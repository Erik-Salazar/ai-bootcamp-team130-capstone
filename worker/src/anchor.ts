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

// ---------------------------------------------------------------------------
// Core anchor flow for a single record
// ---------------------------------------------------------------------------

async function processRecord(record: PrismaRecord): Promise<void> {
  const recordIdBytes32 = recordIdToBytes32(record.recordId);
  const contentHashBytes32 = contentHashToBytes32(record.contentHash);

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
    // Ask the contract whether this recordId has been anchored.
    const onChainHash = await publicClient.readContract({
      address: contractAddress,
      abi: MAINTNOTARY_ABI,
      functionName: "hashes",
      args: [recordIdBytes32],
    });

    const isAnchored =
      onChainHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";

    if (isAnchored) {
      // Recover the tx hash from the RecordAnchored event log.
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

      const txHash = logs[0]?.transactionHash ?? record.txHash ?? null;

      await prisma.record.update({
        where: { id: record.id },
        data: {
          status: "anchored",
          anchoredAt: new Date(),
          txHash: txHash ?? undefined,
        },
      });

      await writeAuditLog(record.id, "anchored", {
        recovery: true,
        txHash,
        note: "resolved by crash-recovery scan",
      });

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
