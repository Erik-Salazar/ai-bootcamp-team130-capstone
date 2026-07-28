import { assertJsonTextSize, safeJsonParse } from "../security/safe-json";
import { normalizeVin } from "../validation/vin";
import type { ImportWebhookPayload } from "./types";
import { IMPORT_EVENT } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseImportWebhook(input: string): { data: ImportWebhookPayload } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Paste a mock webhook JSON payload or upload a file." };
  }

  const sizeError = assertJsonTextSize(trimmed);
  if (sizeError) {
    return { error: sizeError };
  }

  let parsed: unknown;
  try {
    parsed = safeJsonParse(trimmed);
  } catch {
    return { error: "Invalid JSON. Check syntax and try again." };
  }

  if (!isRecord(parsed)) {
    return { error: "Webhook payload must be a single JSON object." };
  }

  if (parsed.event !== IMPORT_EVENT) {
    return { error: `event must be "${IMPORT_EVENT}".` };
  }

  const payload = parsed.payload;
  if (!isRecord(payload)) {
    return { error: "payload must be an object." };
  }

  const required = [
    "work_order_id",
    "vehicle_vin",
    "service_type",
    "completed_at",
    "odometer",
    "vendor_name",
  ] as const;

  for (const field of required) {
    const value = payload[field];
    if (value === undefined || value === null || value === "") {
      return { error: `payload.${field} is required.` };
    }
  }

  if (typeof payload.odometer !== "number" || !Number.isInteger(payload.odometer)) {
    return { error: "payload.odometer must be a whole number." };
  }

  return {
    data: {
      event: IMPORT_EVENT,
      payload: {
        work_order_id: String(payload.work_order_id),
        // Normalize once, here, so the preview shown to the user, the
        // client-side validation, and the payload actually POSTed to
        // /api/import all agree on the same VIN string. Previously the
        // preview/validation used a cleaned VIN (stripped of non-VIN
        // characters) while the raw, uncleaned string was submitted —
        // letting a webhook VIN with stray formatting characters look
        // "valid" in the UI and then get rejected by the API.
        vehicle_vin: normalizeVin(String(payload.vehicle_vin)),
        vehicle_name: payload.vehicle_name ? String(payload.vehicle_name) : undefined,
        service_type: String(payload.service_type),
        completed_at: String(payload.completed_at),
        odometer: payload.odometer,
        vendor_name: String(payload.vendor_name),
        description: payload.description ? String(payload.description) : undefined,
      },
    },
  };
}
