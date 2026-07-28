import { createHash } from "crypto";
import type { HashableRecord, MaintenanceRecord } from "./types";

/** Spec §8 field allowlist (including `source`, which is stripped before hashing). */
export const CANONICAL_FIELD_NAMES = [
  "schema_version",
  "record_id",
  "vin",
  "equipment_label",
  "service_type",
  "completed_at",
  "odometer_miles",
  "shop_name",
  "notes",
  "source",
] as const;

const ALLOWED_FIELDS = new Set<string>(CANONICAL_FIELD_NAMES);

/**
 * Thrown when a record contains keys outside the §8 allowlist (strict mode).
 * API maps this to a 400 validation-style response.
 */
export class UnknownFieldError extends Error {
  readonly code = "UNKNOWN_FIELD" as const;
  readonly fields: string[];

  constructor(fields: string[]) {
    const sorted = [...fields].sort();
    super(`Unknown field(s): ${sorted.join(", ")}`);
    this.name = "UnknownFieldError";
    this.fields = sorted;
  }
}

/**
 * Rejects any top-level keys not in the §8 allowlist (spec §8, rule 2).
 */
export function assertKnownFields(record: object): void {
  const unknown = Object.keys(record).filter((key) => !ALLOWED_FIELDS.has(key));
  if (unknown.length > 0) {
    throw new UnknownFieldError(unknown);
  }
}

/**
 * Deep-sorts object keys alphabetically (spec §8, rule 3).
 * Arrays are preserved in order; only object keys are sorted.
 */
function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepSortKeys);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = deepSortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Produces the canonical JSON string for a record per spec §8:
 * 1. Reject unknown fields (strict allowlist)
 * 2. Remove `source`
 * 3. Deep-sort keys alphabetically
 * 4. Serialize with no extra whitespace / no trailing newline
 */
export function toCanonicalJson(record: MaintenanceRecord | HashableRecord): string {
  assertKnownFields(record as object);
  const { source: _source, ...rest } = record as MaintenanceRecord;
  const sorted = deepSortKeys(rest);
  return JSON.stringify(sorted);
}

/** SHA-256 of the canonical JSON, lowercase 64-char hex (spec §8, rule 6). */
export function hashCanonicalJson(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson, "utf-8").digest("hex");
}

/** Convenience: canonicalize + hash a record in one call. */
export function hashRecord(record: MaintenanceRecord | HashableRecord): string {
  return hashCanonicalJson(toCanonicalJson(record));
}

/** SHA-256 of a plain string (used for the `record_id` -> bytes32 hash, spec §12). */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

/** Converts a 64-char hex SHA-256 string into a 0x-prefixed bytes32 value for the contract. */
export function hexToBytes32(hexHash: string): string {
  if (!/^[0-9a-f]{64}$/i.test(hexHash)) {
    throw new Error(`Expected 64 hex chars for bytes32, got: ${hexHash}`);
  }
  return `0x${hexHash.toLowerCase()}`;
}
