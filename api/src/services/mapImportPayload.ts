/**
 * Pure mapper: mock FMS webhook → canonical submit body (spec §10 POST /api/import).
 */

export type ImportMapResult =
  | { ok: true; body: Record<string, unknown> }
  | {
      ok: false;
      errors: Array<{ code: string; field?: string; message: string }>;
    };

/**
 * Map mock webhook payload fields to canonical record fields (without source).
 * Server sets source:"import" in submitRecord.
 */
export function mapImportPayload(input: unknown): ImportMapResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      errors: [{ code: "INVALID_IMPORT", message: "Import body must be a JSON object." }],
    };
  }

  const root = input as Record<string, unknown>;
  const payload = root.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: [{
        code: "INVALID_IMPORT",
        field: "payload",
        message: "Import body must include a payload object.",
      }],
    };
  }

  const p = payload as Record<string, unknown>;

  return {
    ok: true,
    body: {
      schema_version: "1.0",
      record_id: p.work_order_id,
      vin: p.vehicle_vin,
      equipment_label: p.vehicle_name,
      service_type: p.service_type,
      completed_at: p.completed_at,
      odometer_miles: p.odometer,
      shop_name: p.vendor_name,
      notes: p.description,
    },
  };
}
