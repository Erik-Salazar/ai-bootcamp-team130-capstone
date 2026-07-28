import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateVerifyRecord } from "./verify-record";

const vectorsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../shared/test-vectors.json",
);

const testVectors = JSON.parse(readFileSync(vectorsPath, "utf-8")) as {
  vectors: Array<{ id: string; input: Record<string, unknown>; expected_sha256: string }>;
};

/**
 * Spec §14 — frontend validates shared test-vector input with client rules (V1–V4, V7–V8).
 * V5 (mileage rollback) and V6 (duplicate record_id) are server-only.
 */
describe("shared test vectors (spec §14)", () => {
  it("accepts the published canonical vector with client validation", () => {
    const vector = testVectors.vectors[0];
    expect(validateVerifyRecord(vector.input)).toEqual([]);
  });

  it("includes a real expected_sha256 hash for cross-layer checks", () => {
    const vector = testVectors.vectors[0];
    expect(vector.expected_sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
