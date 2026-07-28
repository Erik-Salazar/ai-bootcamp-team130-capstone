export interface ValidationError {
  code:
    | "MISSING_FIELD"
    | "INVALID_VIN"
    | "FUTURE_DATE"
    | "INVALID_ODOMETER"
    | "MILEAGE_ROLLBACK"
    | "DUPLICATE_RECORD"
    | "INVALID_SERVICE"
    | "UNSUPPORTED_SCHEMA"
    | "UNKNOWN_FIELD";
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
