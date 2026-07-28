/**
 * Pure validation rules V1–V4, V7–V8 (spec §9).
 * V5/V6 need DB lookups and live in validateRecord.ts.
 */

import type { ValidationError } from "./types";
import { getVinValidationError, normalizeVin } from "./vin";

const REQUIRED_FIELDS = [
  "schema_version",
  "record_id",
  "vin",
  "service_type",
  "completed_at",
  "odometer_miles",
  "shop_name",
] as const;

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

/** V1 — all required fields present. */
export function checkRequiredFields(input: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (isBlank(input[field])) {
      errors.push({
        code: "MISSING_FIELD",
        field,
        message: `Missing required field: ${field}.`,
      });
    }
  }
  return errors;
}

/** V2 — VIN length 17 + ISO 3779 check-digit. */
export function checkVin(input: Record<string, unknown>): ValidationError[] {
  if (isBlank(input.vin)) return []; // V1 owns missing
  const message = getVinValidationError(input.vin);
  if (!message) return [];
  return [{ code: "INVALID_VIN", field: "vin", message }];
}

/** V3 — completed_at parseable and not in the future. */
export function checkCompletedAt(
  input: Record<string, unknown>,
  now: Date = new Date()
): ValidationError[] {
  if (isBlank(input.completed_at)) return [];
  if (typeof input.completed_at !== "string") {
    return [{
      code: "FUTURE_DATE",
      field: "completed_at",
      message: "completed_at must be an ISO 8601 UTC timestamp.",
    }];
  }
  const parsed = Date.parse(input.completed_at);
  if (Number.isNaN(parsed)) {
    return [{
      code: "FUTURE_DATE",
      field: "completed_at",
      message: "completed_at must be a valid ISO 8601 UTC timestamp.",
    }];
  }
  if (parsed > now.getTime()) {
    return [{
      code: "FUTURE_DATE",
      field: "completed_at",
      message: "completed_at must not be in the future.",
    }];
  }
  return [];
}

/** V4 — odometer_miles positive integer < 2_000_000. */
export function checkOdometer(input: Record<string, unknown>): ValidationError[] {
  if (input.odometer_miles === undefined || input.odometer_miles === null) return [];
  const value = input.odometer_miles;
  const isInt = typeof value === "number" && Number.isInteger(value);
  if (!isInt || value <= 0 || value >= 2_000_000) {
    return [{
      code: "INVALID_ODOMETER",
      field: "odometer_miles",
      message: "odometer_miles must be a positive integer less than 2,000,000.",
    }];
  }
  return [];
}

/** V7 — service_type non-empty, max 64 chars. */
export function checkServiceType(input: Record<string, unknown>): ValidationError[] {
  if (isBlank(input.service_type)) return []; // V1 owns missing
  if (typeof input.service_type !== "string") {
    return [{
      code: "INVALID_SERVICE",
      field: "service_type",
      message: "service_type must be a non-empty string (max 64 characters).",
    }];
  }
  const trimmed = input.service_type.trim();
  if (trimmed.length === 0 || trimmed.length > 64) {
    return [{
      code: "INVALID_SERVICE",
      field: "service_type",
      message: "service_type must be a non-empty string (max 64 characters).",
    }];
  }
  return [];
}

/** V8 — schema_version === "1.0". */
export function checkSchemaVersion(input: Record<string, unknown>): ValidationError[] {
  if (isBlank(input.schema_version)) return [];
  if (input.schema_version !== "1.0") {
    return [{
      code: "UNSUPPORTED_SCHEMA",
      field: "schema_version",
      message: `Unsupported schema_version: ${String(input.schema_version)}. Expected "1.0".`,
    }];
  }
  return [];
}

/** Normalize VIN on a copy when present and valid-shaped (for lookups). */
export function readVin(input: Record<string, unknown>): string | null {
  if (typeof input.vin !== "string" || !input.vin.trim()) return null;
  return normalizeVin(input.vin);
}

export function readRecordId(input: Record<string, unknown>): string | null {
  if (typeof input.record_id !== "string" || !input.record_id.trim()) return null;
  return input.record_id.trim();
}

export function readOdometer(input: Record<string, unknown>): number | null {
  if (typeof input.odometer_miles !== "number" || !Number.isInteger(input.odometer_miles)) {
    return null;
  }
  return input.odometer_miles;
}
