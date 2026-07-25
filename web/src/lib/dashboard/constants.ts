import { FIELD_LABELS } from "../field-labels";
import type { SortColumn } from "../sort-records";

export const DEFAULT_PAGE_SIZE = 5;
export const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;
export const VIN_DEBOUNCE_MS = 300;

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  record_id: FIELD_LABELS.record_id,
  vin: FIELD_LABELS.vin,
  equipment_label: FIELD_LABELS.equipment_label,
  service_type: FIELD_LABELS.service_type,
  completed_at: FIELD_LABELS.completed_at,
  odometer_miles: FIELD_LABELS.odometer_miles,
  status: FIELD_LABELS.status,
};

export const TABLE_COLUMNS: { key: SortColumn | "actions"; label: string }[] = [
  { key: "record_id", label: FIELD_LABELS.record_id },
  { key: "vin", label: FIELD_LABELS.vin },
  { key: "equipment_label", label: FIELD_LABELS.equipment_label },
  { key: "service_type", label: FIELD_LABELS.service_type },
  { key: "completed_at", label: FIELD_LABELS.completed_at },
  { key: "odometer_miles", label: FIELD_LABELS.odometer_miles },
  { key: "status", label: FIELD_LABELS.status },
  { key: "actions", label: "Actions" },
];
