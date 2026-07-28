/**
 * Validation engine (spec §9, rules V1–V8).
 *
 * Pure rules live in rules.ts / vin.ts. V5/V6 use injected lookups — no Prisma here.
 */

import {
  checkCompletedAt,
  checkOdometer,
  checkRequiredFields,
  checkSchemaVersion,
  checkServiceType,
  checkVin,
  readOdometer,
  readRecordId,
  readVin,
} from "./rules";
import type { ValidationError, ValidationResult } from "./types";

export type { ValidationError, ValidationResult };

/** DB-facing lookups for V5/V6 — inject fakes in unit tests. */
export type RecordLookups = {
  findLastAnchoredOdometer(vin: string): Promise<number | null>;
  recordIdExists(recordId: string): Promise<boolean>;
};

export type ValidateRecordOptions = {
  lookups: RecordLookups;
  /** Injected clock for deterministic V3 tests. */
  now?: Date;
};

function asObject(input: unknown): Record<string, unknown> | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  return input as Record<string, unknown>;
}

/** V5 — odometer >= last anchored for VIN. */
async function checkMileageMonotonicity(
  input: Record<string, unknown>,
  lookups: RecordLookups
): Promise<ValidationError[]> {
  const vin = readVin(input);
  const odometer = readOdometer(input);
  if (!vin || odometer === null) return [];

  const last = await lookups.findLastAnchoredOdometer(vin);
  if (last === null) return [];

  if (odometer < last) {
    return [{
      code: "MILEAGE_ROLLBACK",
      field: "odometer_miles",
      message: `Odometer ${odometer} is below last recorded ${last} for this VIN.`,
    }];
  }
  return [];
}

/** V6 — record_id must not already exist. */
async function checkDuplicateRecordId(
  input: Record<string, unknown>,
  lookups: RecordLookups
): Promise<ValidationError[]> {
  const recordId = readRecordId(input);
  if (!recordId) return [];

  const exists = await lookups.recordIdExists(recordId);
  if (!exists) return [];

  return [{
    code: "DUPLICATE_RECORD",
    field: "record_id",
    message: `record_id "${recordId}" already exists.`,
  }];
}

/**
 * Run V1–V8. Collects all applicable errors (does not short-circuit after the first).
 */
export async function validateRecord(
  input: unknown,
  options: ValidateRecordOptions
): Promise<ValidationResult> {
  const obj = asObject(input);
  if (!obj) {
    return {
      valid: false,
      errors: [{
        code: "MISSING_FIELD",
        message: "Request body must be a JSON object.",
      }],
    };
  }

  const now = options.now ?? new Date();
  const errors: ValidationError[] = [
    ...checkRequiredFields(obj),
    ...checkSchemaVersion(obj),
    ...checkVin(obj),
    ...checkCompletedAt(obj, now),
    ...checkOdometer(obj),
    ...checkServiceType(obj),
  ];

  // V5/V6 only when field-level checks for those values already passed
  const hasVinError = errors.some((e) => e.field === "vin");
  const hasOdoError = errors.some((e) => e.field === "odometer_miles");
  const hasIdError = errors.some((e) => e.field === "record_id");

  if (!hasVinError && !hasOdoError) {
    errors.push(...(await checkMileageMonotonicity(obj, options.lookups)));
  }
  if (!hasIdError) {
    errors.push(...(await checkDuplicateRecordId(obj, options.lookups)));
  }

  return { valid: errors.length === 0, errors };
}
