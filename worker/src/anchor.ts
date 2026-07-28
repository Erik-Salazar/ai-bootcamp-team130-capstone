import "dotenv/config";
import { PrismaClient, type Record as PrismaRecord } from "@prisma/client";
import type { Address, Hex } from "viem";
import {
  getAnchorContract,
  getWalletClient,
  publicClient,
  recordIdToBytes32,
  contentHashToBytes32,
  MAINTNOTARY_ABI,
} from "./chain-client.js";

const prisma = new PrismaClient();
const pollIntervalMs = Number(process.env.ANCHOR_POLL_INTERVAL_MS ?? 15_000);
const maxRetries = Number(process.env.ANCHOR_MAX_RETRIES ?? 3);
const confirmations = Number(process.env.ANCHOR_CONFIRMATIONS ?? 2);

const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Prevent poll cycles from overlapping if anchoring is slow.
let polling = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeAuditLog(
  recordUuid: string,
  action: string,
  details?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: { recordUuid, action, details: details ?? undefined },
  });
}

/** True when a contract revert reason indicates the recordId was already anchored. */
function isAlreadyAnchoredError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("Already anchored");
}

/** Reads hashes[recordId] and reports whether it's set (non-zero) on-chain. */
async function readIsAnchoredOnChain(
  recordIdBytes32: Hex,
  contractAddress: Address
): Promise<boolean> {
  const onChainHash = await publicClient.readContract({
    address: contractAddress,
    abi: MAINTNOTARY_ABI,
    functionName: "hashes",
    args: [recordIdBytes32],
  });
  return onChainHash !== ZERO_BYTES32;
}

/** Recovers the anchoring tx hash from the RecordAnchored event log (best-effort). */
async function recoverTxHashFromLogs(
  recordIdBytes32: Hex,
  contractAddress: Address
): Promise<Hex | null> {
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock > 10_000n ? currentBlock - 10_000n : 0n;

  const logs = await publicClient.getLogs({
    address: contractAddress,
    event: {
      type: "event",
      name: "RecordAnchored",
      inputs: [
        { name: "recordId", type: "bytes32", indexed: true },
        { name: "contentHash", type: "bytes32", indexed: false },
        { name: "timestamp", type: "uint256", indexed: false },
      ],
    } as const,
    args: { recordId: recordIdBytes32 },
    fromBlock,
    toBlock: "latest",
  });

  return logs[0]?.transactionHash ?? null;
}

/**
 * Marks a record anchored based on confirmed on-chain state (rather than a
 * fresh submission), recovering the tx hash from event logs when possible.
 * Shared by crash-recovery and the pre-submit/defensive checks in
 * processRecord — both cases where we've learned the recordId is already
 * anchored without having just submitted the transaction ourselves.
 */
async function markAnchoredFromChain(
  record: PrismaRecord,
  recordIdBytes32: Hex,
  contractAddress: Address,
  note: string
): Promise<void> {
  const txHash = (await recoverTxHashFromLogs(recordIdBytes32, contractAddress)) ?? record.txHash ?? null;

  await prisma.record.update({
    where: { id: record.id },
    data: {
      status: "anchored",
      anchoredAt: new Date(),
      txHash: txHash ?? undefined,
    },
  });

  await writeAuditLog(record.id, "anchored", { recovery: true, txHash, note });
}

/**
 * Idempotency guard: checks on-chain state before submitting.
 *
 * Without this, a record that failed only because `waitForTransactionReceipt`
 * errored out (RPC hiccup, timeout) — even though the anchor tx was actually
 * mined — would get reset to `pending_anchor` and re-submitted. The second
 * `anchor()` call reverts with "Already anchored", burning a retry, and after
 * `maxRetries` a genuinely-anchored record ends up incorrectly marked
 * `anchor_failed`. Checking `hashes[recordId]` first avoids the double-submit
 * entirely.
 */
async function isAlreadyAnchoredOnChain(
  record: PrismaRecord,
  recordIdBytes32: Hex,
  contractAddress: Address
): Promise<boolean> {
  try {
    const isAnchored = await readIsAnchoredOnChain(recordIdBytes32, contractAddress);
    if (isAnchored) {
      await markAnchoredFromChain(
        record,
        recordIdBytes32,
        contractAddress,
        "already anchored on-chain prior to submission; skipped duplicate anchor() call"
      );
      console.log(
        `[worker] ${record.recordId} already anchored on-chain — skipping duplicate submission`
      );
    }
    return isAnchored;
  } catch (err) {
    // If the pre-check itself fails (e.g. RPC issue), don't block the normal
    // submit flow — let the regular try/catch below handle retries.
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[worker] pre-submit anchor check failed for ${record.recordId}: ${message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core anchor flow for a single record
// ---------------------------------------------------------------------------

async function processRecord(record: PrismaRecord): Promise<void> {
  const recordIdBytes32 = recordIdToBytes32(record.recordId);
  const contentHashBytes32 = contentHashToBytes32(record.contentHash);
  const contractAddress = process.env.CONTRACT_ADDRESS as Address | undefined;

  if (contractAddress) {
    const alreadyAnchored = await isAlreadyAnchoredOnChain(record, recordIdBytes32, contractAddress);
    if (alreadyAnchored) return;
  }

  let txHash: Hex;

  try {
    const walletClient = getWalletClient();
    const contract = getAnchorContract(walletClient);

    // Submit the transaction
    txHash = await contract.write.anchor([recordIdBytes32, contentHashBytes32]);

    await prisma.record.update({
      where: { id: record.id },
      data: {
        status: "tx_submitted",
        txHash,
        txSubmittedAt: new Date(),
      },
    });

    await writeAuditLog(record.id, "tx_submitted", { txHash });

    console.log(`[worker] tx submitted for ${record.recordId}: ${txHash}`);
  } catch (err) {
    // Defensive fallback: a race between two poll cycles (or a pre-check that
    // missed a just-mined tx) can still surface as an "Already anchored"
    // revert here. Resolve from chain state instead of counting it as a
    // failed attempt against a record that's actually fine.
    if (contractAddress && isAlreadyAnchoredError(err)) {
      await markAnchoredFromChain(
        record,
        recordIdBytes32,
        contractAddress,
        "anchor() reverted with Already anchored; resolved from on-chain state"
      );
      console.log(`[worker] ${record.recordId} was already anchored on-chain (revert) — marked anchored`);
      return;
    }
    await handleAnchorFailure(record, err);
    return;
  }

  // Wait for the required number of block confirmations before marking anchored.
  try {
    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations,
    });

    const now = new Date();
    await prisma.record.update({
      where: { id: record.id },
      data: { status: "anchored", anchoredAt: now },
    });

    await writeAuditLog(record.id, "anchored", { txHash, anchoredAt: now.toISOString() });

    console.log(`[worker] anchored ${record.recordId} (${confirmations} confirmations)`);
  } catch (err) {
    await handleAnchorFailure(record, err);
  }
}

async function handleAnchorFailure(record: PrismaRecord, err: unknown): Promise<void> {
  const newRetryCount = record.retryCount + 1;
  const exhausted = newRetryCount >= maxRetries;

  await prisma.record.update({
    where: { id: record.id },
    data: {
      retryCount: newRetryCount,
      status: exhausted ? "anchor_failed" : "pending_anchor",
    },
  });

  const message = err instanceof Error ? err.message : String(err);
  await writeAuditLog(
    record.id,
    exhausted ? "anchor_failed" : "anchor_retry",
    { error: message, retryCount: newRetryCount }
  );

  if (exhausted) {
    console.error(
      `[worker] anchor_failed for ${record.recordId} after ${maxRetries} retries: ${message}`
    );
  } else {
    console.warn(
      `[worker] retry ${newRetryCount}/${maxRetries} queued for ${record.recordId}: ${message}`
    );
  }
}

// ---------------------------------------------------------------------------
// Poll cycle — called on each interval tick
// ---------------------------------------------------------------------------

async function pollOnce(): Promise<void> {
  const pending = await prisma.record.findMany({
    where: {
      status: "pending_anchor",
      retryCount: { lt: maxRetries },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) return;

  console.log(`[worker] found ${pending.length} pending record(s) to anchor`);

  for (const record of pending) {
    await processRecord(record);
  }
}

// ---------------------------------------------------------------------------
// Crash-recovery scan (spec §11)
//
// On startup: find records stuck in `tx_submitted` for > 10 minutes and
// resolve them by querying the contract directly rather than re-submitting.
// ---------------------------------------------------------------------------

async function runCrashRecoveryScan(): Promise<void> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1_000);

  const stale = await prisma.record.findMany({
    where: {
      status: "tx_submitted",
      txSubmittedAt: { lt: tenMinutesAgo },
    },
  });

  if (stale.length === 0) {
    console.log("[worker] crash-recovery scan: no stale records found");
    return;
  }

  console.log(`[worker] crash-recovery scan: resolving ${stale.length} stale record(s)`);

  const contractAddress = process.env.CONTRACT_ADDRESS as Address | undefined;
  if (!contractAddress) {
    console.error("[worker] crash-recovery: CONTRACT_ADDRESS not set — skipping");
    return;
  }

  for (const record of stale) {
    await resolveStaleRecord(record, contractAddress);
  }
}

async function resolveStaleRecord(
  record: PrismaRecord,
  contractAddress: Address
): Promise<void> {
  const recordIdBytes32 = recordIdToBytes32(record.recordId);

  try {
    const isAnchored = await readIsAnchoredOnChain(recordIdBytes32, contractAddress);

    if (isAnchored) {
      await markAnchoredFromChain(
        record,
        recordIdBytes32,
        contractAddress,
        "resolved by crash-recovery scan"
      );
      console.log(`[worker] crash-recovery: ${record.recordId} is anchored on-chain — marked anchored`);
    } else {
      // Not found on-chain — reset so the next poll can retry it.
      await prisma.record.update({
        where: { id: record.id },
        data: {
          status: "pending_anchor",
          txHash: null,
          txSubmittedAt: null,
        },
      });

      await writeAuditLog(record.id, "anchor_retry", {
        recovery: true,
        note: "tx not found on-chain; reset to pending_anchor",
      });

      console.log(`[worker] crash-recovery: ${record.recordId} not on-chain — reset to pending_anchor`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[worker] crash-recovery error for ${record.recordId}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log("[worker] MaintNotary anchor worker starting...");
  console.log(
    `[worker] config: pollInterval=${pollIntervalMs}ms, maxRetries=${maxRetries}, confirmations=${confirmations}`
  );

  await runCrashRecoveryScan();

  function scheduleNext() {
    setTimeout(async () => {
      if (!polling) {
        polling = true;
        try {
          await pollOnce();
        } catch (err) {
          console.error("[worker] poll error:", err);
        } finally {
          polling = false;
        }
      }
      scheduleNext();
    }, pollIntervalMs);
  }

  scheduleNext();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

process.on("SIGINT", async () => {
  console.log("[worker] shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

// Exported for tests
export {
  runCrashRecoveryScan,
  pollOnce,
  processRecord,
  handleAnchorFailure,
  writeAuditLog,
};
