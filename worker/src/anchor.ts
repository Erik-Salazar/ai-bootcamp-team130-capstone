import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const pollIntervalMs = Number(process.env.ANCHOR_POLL_INTERVAL_MS ?? 15000);
const maxRetries = Number(process.env.ANCHOR_MAX_RETRIES ?? 3);
const confirmations = Number(process.env.ANCHOR_CONFIRMATIONS ?? 2);

/**
 * Crash-recovery scan (spec §11): on startup, resolve any records stuck in
 * `tx_submitted` for more than 10 minutes by checking the contract directly.
 */
async function runCrashRecoveryScan() {
  // TODO(Blockchain): find records with status=tx_submitted and
  // tx_submitted_at older than 10 minutes; query contract by recordId hash;
  // mark anchored (with tx_hash from event log) or reset to pending_anchor.
  console.log("[worker] crash-recovery scan: not yet implemented");
}

/** Single poll cycle: pick up pending_anchor records and submit tx. */
async function pollOnce() {
  // TODO(Blockchain):
  // 1. SELECT records WHERE status = 'pending_anchor' (respect retryCount < maxRetries)
  // 2. For each: compute recordId/contentHash bytes32 (chain-client.ts adapters)
  // 3. Call contract.anchor(recordId, contentHash) via viem wallet client
  // 4. Update status -> tx_submitted, tx_hash, tx_submitted_at
  // 5. After `confirmations` blocks, update status -> anchored, anchored_at
  // 6. On failure, increment retry_count; mark anchor_failed once retries exhausted
  console.log(`[worker] poll cycle (maxRetries=${maxRetries}, confirmations=${confirmations}) — not yet implemented`);
}

async function main() {
  console.log("[worker] MaintNotary anchor worker starting...");
  await runCrashRecoveryScan();

  setInterval(() => {
    pollOnce().catch((err) => console.error("[worker] poll error:", err));
  }, pollIntervalMs);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
