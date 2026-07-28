/**
 * Build a MaintenanceRecord from a loose JSON body (submit / verify).
 */

import type { MaintenanceRecord } from "@maintnotary/shared";
import { normalizeVin } from "../validation/vin";

export type RecordSource = "manual" | "import";

/**
 * Server-authoritative `source`. VIN normalized via ISO-friendly uppercase trim.
 */
export function toMaintenanceRecord(
  body: Record<string, unknown>,
  source: RecordSource
): MaintenanceRecord {
  const record: MaintenanceRecord = {
    schema_version: "1.0",
    record_id: String(body.record_id ?? "").trim(),
    vin: normalizeVin(String(body.vin ?? "")),
    service_type: String(body.service_type ?? "").trim(),
    completed_at: String(body.completed_at ?? "").trim(),
    odometer_miles: Number(body.odometer_miles),
    shop_name: String(body.shop_name ?? "").trim(),
    source,
  };

  if (typeof body.equipment_label === "string" && body.equipment_label.trim()) {
    record.equipment_label = body.equipment_label.trim();
  }
  if (typeof body.notes === "string") {
    record.notes = body.notes;
  }

  return record;
}

/** Infer source from body when present; default manual (verify Flow A/B). */
export function sourceFromBody(body: Record<string, unknown>): RecordSource {
  return body.source === "import" || body.source === "manual" ? body.source : "manual";
}
