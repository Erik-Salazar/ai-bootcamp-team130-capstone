/**
 * Canonical record schema — spec §8.
 * `source` is intentionally part of the persisted record but is stripped
 * before hashing (see `canonicalize.ts`).
 */
export interface MaintenanceRecord {
  schema_version: "1.0";
  record_id: string;
  vin: string;
  equipment_label?: string;
  service_type: string;
  completed_at: string; // ISO 8601 UTC
  odometer_miles: number;
  shop_name: string;
  notes?: string;
  source: "manual" | "import";
}

/** The record shape that actually gets hashed — `source` removed (spec §8). */
export type HashableRecord = Omit<MaintenanceRecord, "source">;
