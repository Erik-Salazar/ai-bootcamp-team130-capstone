import type { ApiValidationError } from "../../api-client";
import {
  MAX_EQUIPMENT_LABEL_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_RECORD_ID_LENGTH,
  MAX_SHOP_NAME_LENGTH,
} from "../security/constants";
import type { SubmitFormData } from "../submit/types";
import { MAX_ODOMETER, MAX_SERVICE_TYPE_LENGTH } from "./constants";
import { getVinValidationError, normalizeVin } from "./vin";

function missingField(field: string, label: string): ApiValidationError {
  return {
    code: "MISSING_FIELD",
    field,
    message: `${label} is required.`,
  };
}

export function validateSubmitForm(form: SubmitFormData): ApiValidationError[] {
  const errors: ApiValidationError[] = [];

  const recordId = form.record_id.trim();
  const vin = normalizeVin(form.vin);
  const serviceType = form.service_type.trim();
  const shopName = form.shop_name.trim();
  const completedAt = form.completed_at.trim();
  const odometerRaw = form.odometer_miles.trim();

  if (!recordId) errors.push(missingField("record_id", "Work order"));
  if (!vin) errors.push(missingField("vin", "VIN"));
  if (!serviceType) errors.push(missingField("service_type", "Service type"));
  if (!completedAt) errors.push(missingField("completed_at", "Completed at"));
  if (!odometerRaw) errors.push(missingField("odometer_miles", "Odometer"));
  if (!shopName) errors.push(missingField("shop_name", "Shop name"));

  if (recordId.length > MAX_RECORD_ID_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "record_id",
      message: `Work order must be ${MAX_RECORD_ID_LENGTH} characters or fewer.`,
    });
  }

  if (shopName.length > MAX_SHOP_NAME_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "shop_name",
      message: `Shop name must be ${MAX_SHOP_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (form.equipment_label.trim().length > MAX_EQUIPMENT_LABEL_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "equipment_label",
      message: `Equipment label must be ${MAX_EQUIPMENT_LABEL_LENGTH} characters or fewer.`,
    });
  }

  if (form.notes.trim().length > MAX_NOTES_LENGTH) {
    errors.push({
      code: "INVALID_FIELD",
      field: "notes",
      message: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
    });
  }

  const vinError = getVinValidationError(vin);
  if (vin && vinError) {
    errors.push({ code: "INVALID_VIN", field: "vin", message: vinError });
  }

  if (completedAt) {
    const completedDate = new Date(completedAt);
    if (Number.isNaN(completedDate.getTime())) {
      errors.push({
        code: "FUTURE_DATE",
        field: "completed_at",
        message: "Completed at must be a valid date and time.",
      });
    } else if (completedDate.getTime() > Date.now()) {
      errors.push({
        code: "FUTURE_DATE",
        field: "completed_at",
        message: "Completed at cannot be in the future.",
      });
    }
  }

  if (odometerRaw) {
    const odometer = Number(odometerRaw);
    if (!Number.isInteger(odometer) || odometer <= 0 || odometer > MAX_ODOMETER) {
      errors.push({
        code: "INVALID_ODOMETER",
        field: "odometer_miles",
        message: `Odometer must be a whole number between 1 and ${MAX_ODOMETER.toLocaleString()}.`,
      });
    }
  }

  if (serviceType && serviceType.length > MAX_SERVICE_TYPE_LENGTH) {
    errors.push({
      code: "INVALID_SERVICE",
      field: "service_type",
      message: `Service type must be ${MAX_SERVICE_TYPE_LENGTH} characters or fewer.`,
    });
  }

  return errors;
}
