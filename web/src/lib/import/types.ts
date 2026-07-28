import type { ImportPayload } from "../../api-client";

export const IMPORT_EVENT = "work_order.completed" as const;

export type ImportWebhookPayload = ImportPayload;

export interface CanonicalPreview {
  schema_version: "1.0";
  record_id: string;
  vin: string;
  equipment_label?: string;
  service_type: string;
  completed_at: string;
  odometer_miles: number;
  shop_name: string;
  notes?: string;
  source: "import";
}
