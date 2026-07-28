import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateRecord,
  type RecordLookups,
  type ValidationError,
} from "./validateRecord";
import {
  checkCompletedAt,
  checkOdometer,
  checkRequiredFields,
  checkSchemaVersion,
  checkServiceType,
  checkVin,
} from "./rules";
import { isValidVinCheckDigit } from "./vin";

const VALID_VIN = "1FUJGHDV8CLBR1234";
const FIXED_NOW = new Date("2026-07-20T12:00:00Z");

const validBody = {
  schema_version: "1.0",
  record_id: "wo-test-valid-001",
  vin: VALID_VIN,
  equipment_label: "Truck 104",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: 142318,
  shop_name: "In-house shop",
  notes: "ok",
};

function emptyLookups(overrides: Partial<RecordLookups> = {}): RecordLookups {
  return {
    findLastAnchoredOdometer: async () => null,
    recordIdExists: async () => false,
    ...overrides,
  };
}

function codes(errors: ValidationError[]): string[] {
  return errors.map((e) => e.code);
}

// --- Pure rule unit tests (pass + fail each) ---

test("V1 pass: all required fields present", () => {
  assert.deepEqual(checkRequiredFields(validBody), []);
});

test("V1 fail: missing required field", () => {
  const { record_id: _, ...rest } = validBody;
  const errors = checkRequiredFields(rest);
  assert.ok(codes(errors).includes("MISSING_FIELD"));
  assert.equal(errors[0]?.field, "record_id");
});

test("V2 pass: valid VIN check digit", () => {
  assert.equal(isValidVinCheckDigit(VALID_VIN), true);
  assert.deepEqual(checkVin(validBody), []);
});

test("V2 fail: invalid VIN check digit", () => {
  const errors = checkVin({ ...validBody, vin: "1FUJGHDV0CLBR1234" });
  assert.deepEqual(codes(errors), ["INVALID_VIN"]);
});

test("V3 pass: completed_at in the past", () => {
  assert.deepEqual(checkCompletedAt(validBody, FIXED_NOW), []);
});

test("V3 fail: completed_at in the future", () => {
  const errors = checkCompletedAt(
    { ...validBody, completed_at: "2026-12-31T00:00:00Z" },
    FIXED_NOW
  );
  assert.deepEqual(codes(errors), ["FUTURE_DATE"]);
});

test("V4 pass: positive odometer under limit", () => {
  assert.deepEqual(checkOdometer(validBody), []);
});

test("V4 fail: odometer out of range", () => {
  assert.deepEqual(codes(checkOdometer({ odometer_miles: 0 })), ["INVALID_ODOMETER"]);
  assert.deepEqual(codes(checkOdometer({ odometer_miles: 2_000_000 })), ["INVALID_ODOMETER"]);
  assert.deepEqual(codes(checkOdometer({ odometer_miles: 12.5 })), ["INVALID_ODOMETER"]);
});

test("V7 pass: valid service_type", () => {
  assert.deepEqual(checkServiceType(validBody), []);
});

test("V7 fail: service_type too long", () => {
  const errors = checkServiceType({ service_type: "x".repeat(65) });
  assert.deepEqual(codes(errors), ["INVALID_SERVICE"]);
});

test("V8 pass: schema_version 1.0", () => {
  assert.deepEqual(checkSchemaVersion(validBody), []);
});

test("V8 fail: unsupported schema_version", () => {
  const errors = checkSchemaVersion({ schema_version: "2.0" });
  assert.deepEqual(codes(errors), ["UNSUPPORTED_SCHEMA"]);
});

// --- Orchestrator + V5/V6 with fake lookups ---

test("validateRecord pass: fully valid body", async () => {
  const result = await validateRecord(validBody, {
    lookups: emptyLookups(),
    now: FIXED_NOW,
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("V5 pass: odometer >= last anchored", async () => {
  const result = await validateRecord(
    { ...validBody, odometer_miles: 142318 },
    {
      lookups: emptyLookups({
        findLastAnchoredOdometer: async () => 140000,
      }),
      now: FIXED_NOW,
    }
  );
  assert.equal(result.valid, true);
});

test("V5 fail: mileage rollback", async () => {
  const result = await validateRecord(
    { ...validBody, odometer_miles: 100000 },
    {
      lookups: emptyLookups({
        findLastAnchoredOdometer: async () => 142318,
      }),
      now: FIXED_NOW,
    }
  );
  assert.equal(result.valid, false);
  assert.ok(codes(result.errors).includes("MILEAGE_ROLLBACK"));
  assert.match(result.errors[0]!.message, /100000.*142318/);
});

test("V6 pass: new record_id", async () => {
  const result = await validateRecord(validBody, {
    lookups: emptyLookups({ recordIdExists: async () => false }),
    now: FIXED_NOW,
  });
  assert.equal(result.valid, true);
});

test("V6 fail: duplicate record_id", async () => {
  const result = await validateRecord(validBody, {
    lookups: emptyLookups({ recordIdExists: async () => true }),
    now: FIXED_NOW,
  });
  assert.equal(result.valid, false);
  assert.deepEqual(codes(result.errors), ["DUPLICATE_RECORD"]);
});

test("validateRecord rejects non-object body", async () => {
  const result = await validateRecord(null, { lookups: emptyLookups() });
  assert.equal(result.valid, false);
  assert.ok(codes(result.errors).includes("MISSING_FIELD"));
});
