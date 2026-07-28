import { test } from "node:test";
import assert from "node:assert/strict";
import { retryRecord, type RetryDeps } from "./retryRecord";
import type { DbRecord } from "./recordDto";

const failed: DbRecord = {
  id: "uuid-retry",
  recordId: "wo-retry-001",
  vin: "1FUJGHDV8CLBR1234",
  serviceType: "PM-A",
  odometerMiles: 142318,
  completedAt: new Date("2026-07-08T14:22:00Z"),
  shopName: "In-house shop",
  source: "manual",
  canonicalJson: {},
  contentHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  status: "anchor_failed",
  txHash: "0xfail",
  anchoredAt: null,
  retryCount: 3,
  createdAt: new Date("2026-07-08T14:22:30Z"),
};

test("retryRecord 404 when missing", async () => {
  const deps: RetryDeps = {
    getById: async () => null,
    resetForRetry: async () => failed,
    writeAudit: async () => {},
  };
  const result = await retryRecord("missing", deps);
  assert.equal(result.status, 404);
});

test("retryRecord 409 when not anchor_failed", async () => {
  const deps: RetryDeps = {
    getById: async () => ({ ...failed, status: "pending_anchor" }),
    resetForRetry: async () => failed,
    writeAudit: async () => {},
  };
  const result = await retryRecord("uuid-retry", deps);
  assert.equal(result.status, 409);
});

test("retryRecord success resets to pending_anchor", async () => {
  const audits: string[] = [];
  const deps: RetryDeps = {
    getById: async () => failed,
    resetForRetry: async () => ({
      ...failed,
      status: "pending_anchor",
      retryCount: 0,
      txHash: null,
    }),
    writeAudit: async (_id, action) => {
      audits.push(action);
    },
  };
  const result = await retryRecord("uuid-retry", deps);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.body.status, "pending_anchor");
  assert.deepEqual(audits, ["retry_requested"]);
});
