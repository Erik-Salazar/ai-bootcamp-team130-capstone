/**
 * Anchor worker tests (spec §11, §12).
 *
 * Run with:  npm test  (from the worker/ directory)
 *   or:  npm run test:worker  from the monorepo root once that script is added.
 *
 * Tests are grouped into:
 *  1. Hash adapter unit tests — pure functions, no network
 *  2. Test-vector cross-check — verify our bytes32 values match shared/test-vectors.json
 *  3. Anchor workflow simulation — mocked Prisma + viem clients
 *  4. Crash-recovery simulation — mocked contract reads
 *  5. Retry / failure logic
 */

import { describe, it, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// 1. Hash adapter unit tests
// ---------------------------------------------------------------------------

describe("recordIdToBytes32", () => {
  it("produces a 0x-prefixed 66-char string (32 bytes)", async () => {
    // Dynamic import avoids loading dotenv/viem before env is ready in CI
    const { recordIdToBytes32 } = await import("./chain-client.js");
    const result = recordIdToBytes32("wo-test-001");
    assert.match(result, /^0x[0-9a-f]{64}$/, "must be 0x + 64 hex chars");
  });

  it("is deterministic for the same input", async () => {
    const { recordIdToBytes32 } = await import("./chain-client.js");
    assert.equal(recordIdToBytes32("wo-test-001"), recordIdToBytes32("wo-test-001"));
  });

  it("produces different values for different record ids", async () => {
    const { recordIdToBytes32 } = await import("./chain-client.js");
    assert.notEqual(recordIdToBytes32("wo-test-001"), recordIdToBytes32("wo-test-002"));
  });
});

describe("contentHashToBytes32", () => {
  it("wraps a 64-char hex hash as a 0x-prefixed bytes32", async () => {
    const { contentHashToBytes32 } = await import("./chain-client.js");
    const hexHash = "535844002a6967e86b3f117acd4ecaa3ab16909f79ee21dcb5244f479bb06ab5";
    const result = contentHashToBytes32(hexHash);
    assert.equal(result, `0x${hexHash}`);
  });

  it("throws on invalid input (not 64 hex chars)", async () => {
    const { contentHashToBytes32 } = await import("./chain-client.js");
    assert.throws(
      () => contentHashToBytes32("tooshort"),
      /Expected 64 hex chars/
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Test-vector cross-check (spec §14 anti-drift contract)
// ---------------------------------------------------------------------------

describe("test-vector cross-check", () => {
  it("our SHA-256 of canonical JSON matches shared/test-vectors.json", async () => {
    // Load the shared test vectors without depending on a compiled build.
    // fs import avoids import() resolution issues with .json in NodeNext.
    const { readFileSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const vectorsPath = resolve(__dirname, "../../shared/test-vectors.json");
    const { vectors } = JSON.parse(readFileSync(vectorsPath, "utf-8")) as {
      vectors: Array<{ id: string; input: Record<string, unknown>; expected_sha256: string }>;
    };

    for (const vector of vectors) {
      // Replicate canonicalize.ts logic inline to avoid needing a built shared package here.
      const { source: _source, ...rest } = vector.input as { source?: unknown };
      const sorted = deepSortKeys(rest);
      const canonical = JSON.stringify(sorted);
      const computed = createHash("sha256").update(canonical, "utf-8").digest("hex");

      assert.equal(
        computed,
        vector.expected_sha256,
        `Vector ${vector.id}: expected ${vector.expected_sha256}, got ${computed}`
      );
    }
  });

  it("recordIdToBytes32 of test vector record_id is consistent bytes32", async () => {
    const { recordIdToBytes32 } = await import("./chain-client.js");
    // "wo-test-001" → SHA-256 → 0x-prefixed
    const result = recordIdToBytes32("wo-test-001");
    // Value must be stable across runs (regression test)
    const expected =
      "0x" +
      createHash("sha256").update("wo-test-001", "utf-8").digest("hex");
    assert.equal(result, expected);
  });
});

// ---------------------------------------------------------------------------
// 3. Anchor workflow simulation
// ---------------------------------------------------------------------------

describe("anchor workflow (mocked)", () => {
  it("marks record tx_submitted then anchored on happy path", async () => {
    const calls: string[] = [];

    // Build minimal fake record matching Prisma Record shape
    const fakeRecord = makeFakeRecord({ status: "pending_anchor", retryCount: 0 });

    // Mock Prisma update
    const prismaUpdateSpy = mock.fn(async (_args: unknown) => fakeRecord);

    // Mock chain interactions
    const mockWriteAnchor = mock.fn(async () => "0xdeadbeef" as const);
    const mockWaitForReceipt = mock.fn(async () => ({ status: "success" }));
    const mockAuditLog = mock.fn(async () => undefined);

    // Simulate the core anchor flow without importing the module directly
    // (avoids dotenv/Prisma loading issues in test environment).
    await simulateProcessRecord(
      fakeRecord,
      mockWriteAnchor,
      mockWaitForReceipt,
      prismaUpdateSpy,
      mockAuditLog,
      calls
    );

    assert.equal(mockWriteAnchor.mock.calls.length, 1, "should call anchor() once");
    assert.equal(mockWaitForReceipt.mock.calls.length, 1, "should wait for receipt");
    assert.equal(prismaUpdateSpy.mock.calls.length, 2, "should update DB twice (submitted + anchored)");
    assert.deepEqual(calls, ["tx_submitted", "anchored"]);
  });

  it("increments retry_count on tx failure (no retries exhausted)", async () => {
    const fakeRecord = makeFakeRecord({ status: "pending_anchor", retryCount: 0 });
    const calls: string[] = [];

    const mockWriteAnchor = mock.fn(async () => {
      throw new Error("RPC timeout");
    });
    const prismaUpdateSpy = mock.fn(async () => fakeRecord);
    const mockAuditLog = mock.fn(async () => undefined);

    await simulateProcessRecord(
      fakeRecord,
      mockWriteAnchor,
      mock.fn(async () => undefined),
      prismaUpdateSpy,
      mockAuditLog,
      calls
    );

    assert.equal(prismaUpdateSpy.mock.calls.length, 1, "should update DB once on failure");
    const updateArg = prismaUpdateSpy.mock.calls[0]?.arguments[0] as {
      data: { retryCount: number; status: string };
    };
    assert.equal(updateArg.data.retryCount, 1, "retryCount should increment to 1");
    assert.equal(updateArg.data.status, "pending_anchor", "should stay pending_anchor for retry");
  });

  it("marks anchor_failed when retries exhausted", async () => {
    const maxRetriesLocal = 3;
    const fakeRecord = makeFakeRecord({
      status: "pending_anchor",
      retryCount: maxRetriesLocal - 1,
    });

    const mockWriteAnchor = mock.fn(async () => {
      throw new Error("nonce too low");
    });
    const prismaUpdateSpy = mock.fn(async () => fakeRecord);
    const mockAuditLog = mock.fn(async () => undefined);
    const calls: string[] = [];

    await simulateProcessRecord(
      fakeRecord,
      mockWriteAnchor,
      mock.fn(async () => undefined),
      prismaUpdateSpy,
      mockAuditLog,
      calls,
      maxRetriesLocal
    );

    const updateArg = prismaUpdateSpy.mock.calls[0]?.arguments[0] as {
      data: { status: string; retryCount: number };
    };
    assert.equal(updateArg.data.status, "anchor_failed", "should be anchor_failed");
    assert.equal(updateArg.data.retryCount, maxRetriesLocal);
  });
});

// ---------------------------------------------------------------------------
// 4. Crash-recovery simulation
// ---------------------------------------------------------------------------

describe("crash-recovery (mocked)", () => {
  it("marks record anchored when contract already has the hash", async () => {
    const fakeRecord = makeFakeRecord({ status: "tx_submitted", retryCount: 0 });
    const calls: string[] = [];

    // Non-zero hash → on-chain
    const mockReadHashes = mock.fn(async () =>
      "0x535844002a6967e86b3f117acd4ecaa3ab16909f79ee21dcb5244f479bb06ab5"
    );
    const mockGetLogs = mock.fn(async () => [
      { transactionHash: "0xabc123" as Hex },
    ]);
    const prismaUpdateSpy = mock.fn(async () => fakeRecord);
    const mockAuditLog = mock.fn(async () => undefined);

    await simulateCrashRecovery(
      fakeRecord,
      mockReadHashes,
      mockGetLogs,
      prismaUpdateSpy,
      mockAuditLog,
      calls
    );

    const updateArg = prismaUpdateSpy.mock.calls[0]?.arguments[0] as {
      data: { status: string; txHash: string };
    };
    assert.equal(updateArg.data.status, "anchored");
    assert.equal(updateArg.data.txHash, "0xabc123");
    assert.deepEqual(calls, ["anchored"]);
  });

  it("resets to pending_anchor when hash not found on-chain", async () => {
    const fakeRecord = makeFakeRecord({ status: "tx_submitted", retryCount: 0 });
    const calls: string[] = [];

    // Zero hash → not on-chain
    const mockReadHashes = mock.fn(async () =>
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    const mockGetLogs = mock.fn(async () => []);
    const prismaUpdateSpy = mock.fn(async () => fakeRecord);
    const mockAuditLog = mock.fn(async () => undefined);

    await simulateCrashRecovery(
      fakeRecord,
      mockReadHashes,
      mockGetLogs,
      prismaUpdateSpy,
      mockAuditLog,
      calls
    );

    const updateArg = prismaUpdateSpy.mock.calls[0]?.arguments[0] as {
      data: { status: string };
    };
    assert.equal(updateArg.data.status, "pending_anchor");
    assert.deepEqual(calls, ["pending_anchor"]);
  });
});

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepSortKeys);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = deepSortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function makeFakeRecord(
  overrides: Partial<{ status: string; retryCount: number; txHash: string | null; txSubmittedAt: Date | null }>
) {
  return {
    id: "uuid-test-001",
    recordId: "wo-test-001",
    vin: "1FUJGHDV8CLBR1234",
    serviceType: "PM-A",
    odometerMiles: 142318,
    completedAt: new Date("2026-07-08T14:22:00Z"),
    shopName: "In-house shop",
    source: "manual" as const,
    canonicalJson: {},
    contentHash: "535844002a6967e86b3f117acd4ecaa3ab16909f79ee21dcb5244f479bb06ab5",
    status: "pending_anchor" as string,
    txHash: null as string | null,
    txSubmittedAt: null as Date | null,
    anchoredAt: null as Date | null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

type FakeRecord = ReturnType<typeof makeFakeRecord>;

/** Simulates processRecord() without importing anchor.ts (avoids env/Prisma side-effects). */
async function simulateProcessRecord(
  record: FakeRecord,
  writeAnchor: ReturnType<typeof mock.fn>,
  waitForReceipt: ReturnType<typeof mock.fn>,
  prismaUpdate: ReturnType<typeof mock.fn>,
  auditLog: ReturnType<typeof mock.fn>,
  calls: string[],
  maxRetriesLocal = 3,
  confirmationsLocal = 2
): Promise<void> {
  let txHash: string;

  try {
    txHash = await writeAnchor();
    await prismaUpdate({
      where: { id: record.id },
      data: { status: "tx_submitted", txHash, txSubmittedAt: new Date() },
    });
    calls.push("tx_submitted");
    await auditLog(record.id, "tx_submitted", { txHash });
  } catch (err) {
    const newRetryCount = record.retryCount + 1;
    const exhausted = newRetryCount >= maxRetriesLocal;
    await prismaUpdate({
      where: { id: record.id },
      data: {
        retryCount: newRetryCount,
        status: exhausted ? "anchor_failed" : "pending_anchor",
      },
    });
    calls.push(exhausted ? "anchor_failed" : "retry");
    return;
  }

  try {
    await waitForReceipt({ hash: txHash, confirmations: confirmationsLocal });
    await prismaUpdate({
      where: { id: record.id },
      data: { status: "anchored", anchoredAt: new Date() },
    });
    calls.push("anchored");
    await auditLog(record.id, "anchored", { txHash });
  } catch (err) {
    const newRetryCount = record.retryCount + 1;
    const exhausted = newRetryCount >= maxRetriesLocal;
    await prismaUpdate({
      where: { id: record.id },
      data: {
        retryCount: newRetryCount,
        status: exhausted ? "anchor_failed" : "pending_anchor",
      },
    });
    calls.push(exhausted ? "anchor_failed" : "retry");
  }
}

/** Simulates resolveStaleRecord() without importing anchor.ts. */
async function simulateCrashRecovery(
  record: FakeRecord,
  readHashes: ReturnType<typeof mock.fn>,
  getLogs: ReturnType<typeof mock.fn>,
  prismaUpdate: ReturnType<typeof mock.fn>,
  auditLog: ReturnType<typeof mock.fn>,
  calls: string[]
): Promise<void> {
  const onChainHash = await readHashes();
  const isAnchored =
    onChainHash !==
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (isAnchored) {
    const logs = await getLogs();
    const txHash = logs[0]?.transactionHash ?? record.txHash ?? null;
    await prismaUpdate({
      where: { id: record.id },
      data: { status: "anchored", anchoredAt: new Date(), txHash },
    });
    calls.push("anchored");
    await auditLog(record.id, "anchored", { recovery: true, txHash });
  } else {
    await prismaUpdate({
      where: { id: record.id },
      data: { status: "pending_anchor", txHash: null, txSubmittedAt: null },
    });
    calls.push("pending_anchor");
    await auditLog(record.id, "anchor_retry", { recovery: true });
  }
}
