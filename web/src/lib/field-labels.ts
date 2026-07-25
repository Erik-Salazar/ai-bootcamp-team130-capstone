/** Shared field labels — keep Submit form and Dashboard table in sync with spec §8 */
export const FIELD_LABELS = {
  record_id: "Work Order",
  vin: "VIN",
  equipment_label: "Equipment",
  service_type: "Service Type",
  completed_at: "Completed At",
  odometer_miles: "Odometer",
  shop_name: "Shop Name",
  notes: "Notes",
  status: "Status",
} as const;

export const FIELD_HINTS = {
  record_id: "Unique work order number",
  vin: "17-character identifier",
  equipment_label: "Optional unit name",
  completed_at: "Cannot be in the future",
  notes: "Optional",
} as const;
