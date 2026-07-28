import type { CanonicalPreview, ImportWebhookPayload } from "./types";

export function mapWebhookToCanonical(webhook: ImportWebhookPayload): CanonicalPreview {
  const { payload } = webhook;

  const canonical: CanonicalPreview = {
    schema_version: "1.0",
    record_id: payload.work_order_id,
    vin: payload.vehicle_vin.toUpperCase(),
    service_type: payload.service_type,
    completed_at: payload.completed_at,
    odometer_miles: payload.odometer,
    shop_name: payload.vendor_name,
    source: "import",
  };

  if (payload.vehicle_name) canonical.equipment_label = payload.vehicle_name;
  if (payload.description) canonical.notes = payload.description;

  return canonical;
}

export function formatCanonicalPreview(record: CanonicalPreview): string {
  return JSON.stringify(record, null, 2);
}
