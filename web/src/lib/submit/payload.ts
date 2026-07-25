import type { SubmitRecordRequest } from "../../api-client";
import type { SubmitFormData } from "./types";

export function toSubmitPayload(form: SubmitFormData): SubmitRecordRequest {
  return {
    record_id: form.record_id.trim(),
    vin: form.vin.trim().toUpperCase(),
    equipment_label: form.equipment_label.trim() || undefined,
    service_type: form.service_type.trim(),
    completed_at: form.completed_at ? new Date(form.completed_at).toISOString() : "",
    odometer_miles: parseInt(form.odometer_miles, 10) || 0,
    shop_name: form.shop_name.trim(),
    notes: form.notes.trim() || undefined,
  };
}
