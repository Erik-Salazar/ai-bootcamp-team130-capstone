import { test } from "node:test";
import assert from "node:assert/strict";
import { hashRecord } from "@maintnotary/shared";
import { verifyByBody, verifyById, type VerifyDeps } from "./verifyRecord";
import type { DbRecord } from "./recordDto";

const baseRecord: DbRecord = {
  id: "uuid-1",
  recordId: "wo-verify-001",
  vin: "1FUJGHDV8CLBR1234",
  serviceType: "PM-A",
  odometerMiles: 142318,
  completedAt: new Date("2026-07-08T14:22:00Z"),
  shopName: "In-house shop",
  source: "manual",
  canonicalJson: {
    schema_version: "1.0",
    record_id: "wo-verify-001",
    vin: "1FUJGHDV8CLBR1234",
    service_type: "PM-A",
    completed_at: "2026-07-08T14:22:00Z",
    odometer_miles: 142318,
    shop_name: "In-house shop",
  },
  contentHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  status: "anchored",
  txHash: "0xabc",
  anchoredAt: new Date("2026-07-08T14:25:00Z"),
  retryCount: 0,
  createdAt: new Date("2026-07-08T14:22:30Z"),
};

const sampleBody = {
  schema_version: "1.0" as const,
  record_id: "wo-verify-001",
  vin: "1FUJGHDV8CLBR1234",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: 142318,
  shop_name: "In-house shop",
  source: "manual" as const,
};

function deps(overrides: Partial<VerifyDeps> = {}): VerifyDeps {
  const contentHash = hashRecord(sampleBody);
  const row = { ...baseRecord, contentHash };
  return {
    config: {
      publicWebBaseUrl: "http://localhost:5173",
      explorerBaseUrl: "https://sepolia.basescan.org",
    },
    getById: async (id) => (id === row.id ? row : null),
    getByRecordId: async (recordId) => (recordId === row.recordId ? row : null),
    getOnChainHash: async () => contentHash,
    ...overrides,
  };
}

test("verifyById not_found", async () => {
  const result = await verifyById("missing", deps());
  assert.equal(result.integrity, "not_found");
});

test("verifyById verified when DB and chain match", async () => {
  const result = await verifyById("uuid-1", deps());
  assert.equal(result.integrity, "verified");
  assert.equal(result.record_id, "wo-verify-001");
  assert.ok(result.explorer_url?.includes("/tx/0xabc"));
});

test("verifyById not_anchored when pending and no chain hash", async () => {
  const contentHash = hashRecord(sampleBody);
  const result = await verifyById(
    "uuid-1",
    deps({
      getById: async () => ({
        ...baseRecord,
        contentHash,
        status: "pending_anchor",
        txHash: null,
        anchoredAt: null,
      }),
      getOnChainHash: async () => null,
    })
  );
  assert.equal(result.integrity, "not_anchored");
});

test("verifyById mismatch when chain differs", async () => {
  const result = await verifyById(
    "uuid-1",
    deps({
      getOnChainHash: async () =>
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    })
  );
  assert.equal(result.integrity, "mismatch");
});

test("verifyByBody Flow A: hash-only when record_id missing in DB", async () => {
  const result = await verifyByBody(
    { ...sampleBody, record_id: "wo-unknown" },
    deps({ getByRecordId: async () => null })
  );
  assert.equal(result.integrity, "not_found");
  assert.equal(result.content_hash, hashRecord({ ...sampleBody, record_id: "wo-unknown" }));
});

test("verifyByBody Flow B: verified when hashes match", async () => {
  const result = await verifyByBody(sampleBody, deps());
  assert.equal(result.integrity, "verified");
});

test("verifyByBody Flow B: mismatch when body tampered", async () => {
  const result = await verifyByBody(
    { ...sampleBody, notes: "tampered" },
    deps()
  );
  assert.equal(result.integrity, "mismatch");
});
