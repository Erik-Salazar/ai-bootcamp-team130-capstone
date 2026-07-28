import type { ApiValidationError } from "../../api-client";
import {
  MAX_EQUIPMENT_LABEL_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_RECORD_ID_LENGTH,
  MAX_SHOP_NAME_LENGTH,
} from "../security/constants";
import { MAX_ODOMETER, MAX_SERVICE_TYPE_LENGTH, SUPPORTED_SCHEMA_VERSION } from "./constants";
import { getVinValidationError, normalizeVin } from "./vin";

const VERIFY_REQUIRED_FIELDS = [
  "record_id",
  "vin",
  "service_type",
  "completed_at",
  "odometer_miles",
  "shop_name",
] as const;

function asRecord(data: unknown): Record<string, unknown> | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

function missingField(field: string): ApiValidationError {
  return {
    code: "MISSING_FIELD",
    field,
    message: `${field} is required for verification.`,
  };
}

export function validateVerifyRecord(data: unknown): ApiValidationError[] {
  const record = asRecord(data);
  if (!record) {
    return [{ code: "INVALID_JSON", field: "", message: "JSON must be a single object." }];
  }

  const errors: ApiValidationError[] = [];

  if ("schema_version" in record && record.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    errors.push({
      code: "UNSUPPORTED_SCHEMA",
      field: "schema_version",
      message: `Only schema version "${SUPPORTED_SCHEMA_VERSION}" is supported.`,
    });
  }

  for (const field of VERIFY_REQUIRED_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
      errors.push(missingField(field));
    }
  }

  if (typeof record.record_id === "string" && record.record_id.trim().length > MAX_RECORD_ID_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "record_id",
      message: `record_id must be ${MAX_RECORD_ID_LENGTH} characters or fewer.`,
    });
  }

  if (typeof record.shop_name === "string" && record.shop_name.trim().length > MAX_SHOP_NAME_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "shop_name",
      message: `shop_name must be ${MAX_SHOP_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (typeof record.equipment_label === "string" && record.equipment_label.trim().length > MAX_EQUIPMENT_LABEL_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "equipment_label",
      message: `equipment_label must be ${MAX_EQUIPMENT_LABEL_LENGTH} characters or fewer.`,
    });
  }

  if (typeof record.notes === "string" && record.notes.trim().length > MAX_NOTES_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "notes",
      message: `notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
    });
  }

  if (typeof record.vin === "string") {
    const vinError = getVinValidationError(normalizeVin(record.vin));
    if (vinError) {
      errors.push({ code: "INVALID_VIN", field: "vin", message: vinError });
    }
  }

  if (record.completed_at !== undefined && record.completed_at !== null) {
    const completedAt = new Date(String(record.completed_at));
    if (Number.isNaN(completedAt.getTime())) {
      errors.push({
        code: "FUTURE_DATE",
        field: "completed_at",
        message: "completed_at must be a valid ISO 8601 date.",
      });
    } else if (completedAt.getTime() > Date.now()) {
      errors.push({
        code: "FUTURE_DATE",
        field: "completed_at",
        message: "completed_at cannot be in the future.",
      });
    }
  }

  if (record.odometer_miles !== undefined && record.odometer_miles !== null) {
    const odometer = Number(record.odometer_miles);
    if (!Number.isInteger(odometer) || odometer <= 0 || odometer > MAX_ODOMETER) {
      errors.push({
        code: "INVALID_ODOMETER",
        field: "odometer_miles",
        message: `odometer_miles must be a whole number between 1 and ${MAX_ODOMETER.toLocaleString()}.`,
      });
    }
  }

  if (typeof record.service_type === "string" && record.service_type.trim()) {
    if (record.service_type.trim().length > MAX_SERVICE_TYPE_LENGTH) {
      errors.push({
        code: "INVALID_SERVICE",
        field: "service_type",
        message: `service_type must be ${MAX_SERVICE_TYPE_LENGTH} characters or fewer.`,
      });
    }
  }

  return errors;
}
