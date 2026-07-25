import type { ApiRecordDetail } from "../../api-client";

/** Canonical schema fields (spec §8) for read-only JSON display. */
export function toCanonicalRecord(record: ApiRecordDetail) {
  const canonical: Record<string, unknown> = {
    schema_version: "1.0",
    record_id: record.record_id,
    vin: record.vin,
    service_type: record.service_type,
    completed_at: record.completed_at,
    odometer_miles: record.odometer_miles,
    shop_name: record.shop_name,
    source: record.source,
  };

  if (record.equipment_label) canonical.equipment_label = record.equipment_label;
  if (record.notes) canonical.notes = record.notes;

  return canonical;
}

export function formatCanonicalJson(record: ApiRecordDetail): string {
  return JSON.stringify(toCanonicalRecord(record), null, 2);
}
