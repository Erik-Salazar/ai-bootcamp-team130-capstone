import { test } from "node:test";
import assert from "node:assert/strict";
import {
  submitRecord,
  type SaveRecordInput,
  type SubmitDeps,
} from "./submitRecord";

const VALID_VIN = "1FUJGHDV8CLBR1234";
const FIXED_NOW = new Date("2026-07-20T12:00:00Z");

const validBody = {
  schema_version: "1.0",
  record_id: "wo-submit-test-001",
  vin: VALID_VIN,
  equipment_label: "Truck 104",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: 142318,
  shop_name: "In-house shop",
  notes: "unit test",
};

function createFakeDeps(overrides: Partial<SubmitDeps> = {}): SubmitDeps & {
  saved: SaveRecordInput[];
  audits: Array<{ id: string; action: string }>;
} {
  const saved: SaveRecordInput[] = [];
  const audits: Array<{ id: string; action: string }> = [];

  const deps: SubmitDeps & { saved: typeof saved; audits: typeof audits } = {
    saved,
    audits,
    lookups: {
      findLastAnchoredOdometer: async () => null,
      recordIdExists: async () => false,
    },
    config: { publicWebBaseUrl: "http://localhost:5173" },
    now: FIXED_NOW,
    async saveRecord(input) {
      saved.push(input);
      return {
        id: "uuid-test-001",
        recordId: input.recordId,
        status: "pending_anchor",
      };
    },
    async writeAudit(recordUuid, action) {
      audits.push({ id: recordUuid, action });
    },
    ...overrides,
  };

  // Re-bind saved/audits if overrides replaced save/writeAudit without tracking
  deps.saved = saved;
  deps.audits = audits;
  return deps;
}

test("submitRecord success: persists, audits, returns 201 shape", async () => {
  const deps = createFakeDeps();
  const result = await submitRecord(validBody, "manual", deps);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.status, 201);
  assert.equal(result.body.success, true);
  assert.equal(result.body.record_id, "wo-submit-test-001");
  assert.equal(result.body.status, "pending_anchor");
  assert.equal(
    result.body.verify_url,
    "http://localhost:5173/verify/uuid-test-001"
  );

  assert.equal(deps.saved.length, 1);
  assert.equal(deps.saved[0]!.source, "manual");
  assert.equal(deps.saved[0]!.contentHash.length, 64);
  assert.equal(deps.audits.map((a) => a.action).join(","), "submitted,validated,anchor_queued");
});

test("submitRecord validation failure: does not save", async () => {
  const deps = createFakeDeps();
  const result = await submitRecord(
    { ...validBody, vin: "SHORT" },
    "manual",
    deps
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
  assert.ok(result.body.errors.some((e) => e.code === "INVALID_VIN"));
  assert.equal(deps.saved.length, 0);
  assert.equal(deps.audits.length, 0);
});

test("submitRecord sets source from argument, not body", async () => {
  const deps = createFakeDeps();
  const result = await submitRecord(
    { ...validBody, record_id: "wo-import-src", source: "manual" },
    "import",
    deps
  );

  assert.equal(result.ok, true);
  assert.equal(deps.saved[0]!.source, "import");
});

test("submitRecord rejects unknown fields without saving", async () => {
  const deps = createFakeDeps();
  const result = await submitRecord(
    { ...validBody, record_id: "wo-unknown", extra_field: "nope" },
    "manual",
    deps
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 400);
  assert.ok(result.body.errors.some((e) => e.code === "UNKNOWN_FIELD"));
  assert.equal(deps.saved.length, 0);
});

test("submitRecord maps unique constraint to DUPLICATE_RECORD", async () => {
  const deps = createFakeDeps({
    async saveRecord() {
      const err = Object.assign(new Error("Unique constraint"), { code: "P2002" });
      throw err;
    },
  });

  const result = await submitRecord(
    { ...validBody, record_id: "wo-dup" },
    "manual",
    deps
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.body.errors.some((e) => e.code === "DUPLICATE_RECORD"));
});
