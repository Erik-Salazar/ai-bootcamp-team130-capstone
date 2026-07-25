import { describe, expect, it } from "vitest";
import { validateVerifyRecord } from "./verify-record";

const validRecord = {
  schema_version: "1.0",
  record_id: "wo-2026-0042",
  vin: "1M8GDM9AXKP042788",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: 142318,
  shop_name: "In-house shop",
};

describe("validateVerifyRecord", () => {
  it("accepts a valid record object", () => {
    expect(validateVerifyRecord(validRecord)).toEqual([]);
  });

  it("rejects unsupported schema version (V8)", () => {
    const errors = validateVerifyRecord({ ...validRecord, schema_version: "2.0" });
    expect(errors.some((e) => e.code === "UNSUPPORTED_SCHEMA")).toBe(true);
  });

  it("requires canonical fields (V1)", () => {
    const { shop_name: _removed, ...partial } = validRecord;
    const errors = validateVerifyRecord(partial);
    expect(errors.some((e) => e.code === "MISSING_FIELD" && e.field === "shop_name")).toBe(true);
  });
});
