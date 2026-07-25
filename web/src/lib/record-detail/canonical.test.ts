import { describe, expect, it } from "vitest";
import type { ApiRecordDetail } from "../../api-client";
import { formatCanonicalJson, toCanonicalRecord } from "./canonical";

const sampleRecord: ApiRecordDetail = {
  id: "uuid-1",
  record_id: "wo-2026-0042",
  vin: "1FUJGHDV8CLBR1234",
  equipment_label: "Truck 104",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: 142318,
  shop_name: "In-house shop",
  notes: "Oil, filters, brake inspection",
  source: "manual",
  status: "anchored",
  content_hash: "abc123",
  tx_hash: "0xdead",
  anchored_at: "2026-07-08T14:25:00Z",
  explorer_url: "https://sepolia.basescan.org/tx/0xdead",
  verify_url: "https://example.com/verify/uuid-1",
  retry_count: 0,
  created_at: "2026-07-08T14:22:30Z",
};

describe("toCanonicalRecord", () => {
  it("includes schema_version and canonical fields", () => {
    expect(toCanonicalRecord(sampleRecord)).toEqual({
      schema_version: "1.0",
      record_id: "wo-2026-0042",
      vin: "1FUJGHDV8CLBR1234",
      equipment_label: "Truck 104",
      service_type: "PM-A",
      completed_at: "2026-07-08T14:22:00Z",
      odometer_miles: 142318,
      shop_name: "In-house shop",
      notes: "Oil, filters, brake inspection",
      source: "manual",
    });
  });

  it("omits optional fields when absent", () => {
    const minimal = { ...sampleRecord, equipment_label: undefined, notes: undefined };
    const canonical = toCanonicalRecord(minimal);
    expect(canonical).not.toHaveProperty("equipment_label");
    expect(canonical).not.toHaveProperty("notes");
  });
});

describe("formatCanonicalJson", () => {
  it("returns pretty-printed JSON", () => {
    const json = formatCanonicalJson(sampleRecord);
    expect(json).toContain('"record_id": "wo-2026-0042"');
    expect(json.startsWith("{\n")).toBe(true);
  });
});
