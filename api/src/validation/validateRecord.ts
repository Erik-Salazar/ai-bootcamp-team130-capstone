/**
 * Validation engine skeleton (spec §9, rules V1-V8).
 *
 * Each rule below is a placeholder — implement the real checks here.
 * Keep one function per rule so each can be unit tested independently
 * against `shared/test-vectors.json`.
 */

export interface ValidationError {
  code:
    | "MISSING_FIELD"
    | "INVALID_VIN"
    | "FUTURE_DATE"
    | "INVALID_ODOMETER"
    | "MILEAGE_ROLLBACK"
    | "DUPLICATE_RECORD"
    | "INVALID_SERVICE"
    | "UNSUPPORTED_SCHEMA";
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// TODO(Backend): implement V1-V8 from spec §9.
// V5 (mileage rollback) and V6 (duplicate record) require a DB lookup,
// so this function should be async once wired up to Prisma.
export async function validateRecord(_input: unknown): Promise<ValidationResult> {
  return { valid: true, errors: [] };
}
