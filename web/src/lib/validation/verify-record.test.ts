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

  it("reports field max lengths", () => {
    const errors = validateVerifyRecord({
      ...validRecord,
      record_id: "x".repeat(129),
      shop_name: "y".repeat(257),
    });
    expect(errors.some((e) => e.code === "INVALID_FIELD" && e.field === "record_id")).toBe(true);
    expect(errors.some((e) => e.code === "INVALID_FIELD" && e.field === "shop_name")).toBe(true);
  });

  it("reports invalid VIN (V2)", () => {
    const errors = validateVerifyRecord({ ...validRecord, vin: "TOO-SHORT" });
    expect(errors.some((e) => e.code === "INVALID_VIN")).toBe(true);
  });

  it("reports future completed_at (V3)", () => {
    const errors = validateVerifyRecord({
      ...validRecord,
      completed_at: "2099-01-01T00:00:00Z",
    });
    expect(errors.some((e) => e.code === "FUTURE_DATE")).toBe(true);
  });

  it("reports invalid odometer (V4)", () => {
    expect(validateVerifyRecord({ ...validRecord, odometer_miles: 0 }).some((e) => e.code === "INVALID_ODOMETER")).toBe(true);
    expect(validateVerifyRecord({ ...validRecord, odometer_miles: 2_000_000 }).some((e) => e.code === "INVALID_ODOMETER")).toBe(true);
  });

  it("reports invalid service type length (V7)", () => {
    const errors = validateVerifyRecord({
      ...validRecord,
      service_type: "x".repeat(65),
    });
    expect(errors.some((e) => e.code === "INVALID_SERVICE")).toBe(true);
  });
});
