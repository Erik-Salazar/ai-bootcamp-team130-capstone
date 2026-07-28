import { test } from "node:test";
import assert from "node:assert/strict";
import { getRecordById, listRecords, type ListRecordsDeps } from "./listRecords";
import type { DbRecord } from "./recordDto";

const row: DbRecord = {
  id: "uuid-list-1",
  recordId: "wo-list-001",
  vin: "1FUJGHDV8CLBR1234",
  serviceType: "PM-A",
  odometerMiles: 142318,
  completedAt: new Date("2026-07-08T14:22:00Z"),
  shopName: "In-house shop",
  source: "manual",
  canonicalJson: {
    equipment_label: "Truck 104",
    notes: "ok",
  },
  contentHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  status: "anchored",
  txHash: "0xdead",
  anchoredAt: new Date("2026-07-08T14:25:00Z"),
  retryCount: 0,
  createdAt: new Date("2026-07-08T14:22:30Z"),
};

const deps: ListRecordsDeps = {
  config: {
    publicWebBaseUrl: "http://localhost:5173",
    explorerBaseUrl: "https://sepolia.basescan.org",
  },
  list: async () => ({ rows: [row], total: 1 }),
  getById: async (id) => (id === row.id ? row : null),
};

test("listRecords returns §10 list shape", async () => {
  const body = await listRecords({}, deps);
  assert.equal(body.total, 1);
  assert.equal(body.records[0]!.record_id, "wo-list-001");
  assert.equal(
    body.records[0]!.verify_url,
    "http://localhost:5173/verify/uuid-list-1"
  );
});

test("getRecordById returns detail with explorer_url", async () => {
  const result = await getRecordById("uuid-list-1", deps);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.body.equipment_label, "Truck 104");
  assert.equal(
    result.body.explorer_url,
    "https://sepolia.basescan.org/tx/0xdead"
  );
});

test("getRecordById 404 when missing", async () => {
  const result = await getRecordById("missing", deps);
  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
});
