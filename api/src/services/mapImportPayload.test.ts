import { test } from "node:test";
import assert from "node:assert/strict";
import { hashRecord } from "@maintnotary/shared";
import { mapImportPayload } from "./mapImportPayload";

const webhook = {
  event: "work_order.completed",
  payload: {
    work_order_id: "wo-import-001",
    vehicle_vin: "1FUJGHDV8CLBR1234",
    vehicle_name: "Truck 104",
    service_type: "PM-A",
    completed_at: "2026-07-08T14:22:00Z",
    odometer: 142318,
    vendor_name: "In-house shop",
    description: "Oil, filters, brake inspection",
  },
};

test("mapImportPayload maps FMS fields to canonical body", () => {
  const result = mapImportPayload(webhook);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.body.record_id, "wo-import-001");
  assert.equal(result.body.vin, "1FUJGHDV8CLBR1234");
  assert.equal(result.body.equipment_label, "Truck 104");
  assert.equal(result.body.odometer_miles, 142318);
  assert.equal(result.body.shop_name, "In-house shop");
  assert.equal(result.body.notes, "Oil, filters, brake inspection");
  assert.equal(result.body.schema_version, "1.0");
});

test("mapImportPayload rejects missing payload", () => {
  const result = mapImportPayload({ event: "work_order.completed" });
  assert.equal(result.ok, false);
});

test("import and manual of same event produce identical hash", () => {
  const mapped = mapImportPayload(webhook);
  assert.equal(mapped.ok, true);
  if (!mapped.ok) return;

  const asImport = hashRecord({
    ...(mapped.body as object),
    source: "import",
  } as Parameters<typeof hashRecord>[0]);

  const asManual = hashRecord({
    schema_version: "1.0",
    record_id: "wo-import-001",
    vin: "1FUJGHDV8CLBR1234",
    equipment_label: "Truck 104",
    service_type: "PM-A",
    completed_at: "2026-07-08T14:22:00Z",
    odometer_miles: 142318,
    shop_name: "In-house shop",
    notes: "Oil, filters, brake inspection",
    source: "manual",
  });

  assert.equal(asImport, asManual);
});
