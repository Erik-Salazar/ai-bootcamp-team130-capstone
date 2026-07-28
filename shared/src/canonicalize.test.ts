import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  toCanonicalJson,
  hashRecord,
  UnknownFieldError,
  assertKnownFields,
  hexToBytes32,
  sha256Hex,
} from "./canonicalize";
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

test("assertKnownFields accepts allowlisted keys only", () => {
  assert.doesNotThrow(() => assertKnownFields(sample));
});

test("assertKnownFields / toCanonicalJson reject unknown fields", () => {
  const dirty = { ...sample, extra_field: "nope" };
  assert.throws(() => assertKnownFields(dirty), UnknownFieldError);
  assert.throws(() => toCanonicalJson(dirty as MaintenanceRecord), (err: unknown) => {
    assert.ok(err instanceof UnknownFieldError);
    assert.equal(err.code, "UNKNOWN_FIELD");
    assert.deepEqual(err.fields, ["extra_field"]);
    return true;
  });
});

test("hexToBytes32 wraps a content hash for on-chain use", () => {
  const hash = hashRecord(sample);
  assert.equal(hexToBytes32(hash), `0x${hash}`);
  assert.equal(hexToBytes32(sha256Hex(sample.record_id)).length, 66);
});

type VectorFile = {
  vectors: Array<{
    id: string;
    input?: MaintenanceRecord;
    input_manual?: MaintenanceRecord;
    input_import?: MaintenanceRecord;
    expected_sha256: string;
  }>;
};

test("shared/test-vectors.json hashes match canonicalize", () => {
  // __dirname is shared/src when tsx runs this file
  const vectorsPath = join(__dirname, "..", "test-vectors.json");
  const data = JSON.parse(readFileSync(vectorsPath, "utf-8")) as VectorFile;

  for (const vector of data.vectors) {
    if (vector.input) {
      assert.equal(
        hashRecord(vector.input),
        vector.expected_sha256,
        `${vector.id} hash mismatch`
      );
    }
    if (vector.input_manual && vector.input_import) {
      const manualHash = hashRecord(vector.input_manual);
      const importHash = hashRecord(vector.input_import);
      assert.equal(manualHash, importHash, `${vector.id}: manual !== import`);
      assert.equal(manualHash, vector.expected_sha256, `${vector.id} expected mismatch`);
    }
  }
});
