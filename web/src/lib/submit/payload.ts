import type { SubmitRecordRequest } from "../../api-client";
import {
  MAX_EQUIPMENT_LABEL_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_RECORD_ID_LENGTH,
  MAX_SHOP_NAME_LENGTH,
} from "../security/constants";
import { sanitizeMultilineText, sanitizeText } from "../security/sanitize-text";
import type { SubmitFormData } from "./types";

export function toSubmitPayload(form: SubmitFormData): SubmitRecordRequest {
  return {
    schema_version: "1.0",
    record_id: sanitizeText(form.record_id, MAX_RECORD_ID_LENGTH).trim(),
    vin: sanitizeText(form.vin, 17).toUpperCase().trim(),
    equipment_label:
      sanitizeText(form.equipment_label, MAX_EQUIPMENT_LABEL_LENGTH).trim() || undefined,
    service_type: sanitizeText(form.service_type, 64).trim(),
    completed_at: form.completed_at ? new Date(form.completed_at).toISOString() : "",
    odometer_miles: parseInt(form.odometer_miles, 10) || 0,
    shop_name: sanitizeText(form.shop_name, MAX_SHOP_NAME_LENGTH).trim(),
    notes: sanitizeMultilineText(form.notes, MAX_NOTES_LENGTH).trim() || undefined,
  };
}
