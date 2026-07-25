import type { SubmitFormData } from "./types";

export const SERVICE_TYPES = [
  "PM-A",
  "PM-B",
  "PM-C",
  "Brake Service",
  "DOT Annual",
  "Oil Change",
  "Tire Service",
  "A/C Repair",
] as const;

export const INITIAL_SUBMIT_FORM: SubmitFormData = {
  record_id: "",
  vin: "",
  equipment_label: "",
  service_type: "",
  completed_at: "",
  odometer_miles: "",
  shop_name: "",
  notes: "",
};

export const REQUIRED_SUBMIT_FIELDS: (keyof SubmitFormData)[] = [
  "record_id",
  "vin",
  "service_type",
  "completed_at",
  "odometer_miles",
  "shop_name",
];

export const REQUIRED_FIELD_COUNT = REQUIRED_SUBMIT_FIELDS.length;
