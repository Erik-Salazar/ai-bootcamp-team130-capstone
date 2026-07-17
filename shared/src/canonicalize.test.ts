import { test } from "node:test";
import assert from "node:assert/strict";
import { toCanonicalJson, hashRecord } from "./canonicalize";
import type { MaintenanceRecord } from "./types";

const sample: MaintenanceRecord = {
  schema_version: "1.0",
  record_id: "wo-test-001",
  vin: "1FUJGHDV8CLBR1234",
  equipment_label: "Truck 104",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: 142318,
  shop_name: "In-house shop",
  notes: "Oil, filters, brake inspection",
  source: "manual",
};

test("canonical JSON strips the source field", () => {
  const json = toCanonicalJson(sample);
  assert.ok(!json.includes("source"));
});

test("canonical JSON is identical regardless of source value", () => {
  const asManual = toCanonicalJson(sample);
  const asImport = toCanonicalJson({ ...sample, source: "import" });
  assert.equal(asManual, asImport);
});

test("hashRecord produces a 64-char lowercase hex string", () => {
  const hash = hashRecord(sample);
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test("hashRecord is deterministic regardless of input key order", () => {
  const reordered = {
    source: sample.source,
    vin: sample.vin,
    schema_version: sample.schema_version,
    record_id: sample.record_id,
    service_type: sample.service_type,
    completed_at: sample.completed_at,
    odometer_miles: sample.odometer_miles,
    shop_name: sample.shop_name,
    notes: sample.notes,
    equipment_label: sample.equipment_label,
  } as MaintenanceRecord;
  assert.equal(hashRecord(sample), hashRecord(reordered));
});
