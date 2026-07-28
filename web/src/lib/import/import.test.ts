import { describe, expect, it } from "vitest";
import { mapWebhookToCanonical } from "./map-webhook";
import { parseImportWebhook } from "./parse-webhook";
import { validateVerifyRecord } from "../validation/verify-record";

const SAMPLE_WEBHOOK = `{
  "event": "work_order.completed",
  "payload": {
    "work_order_id": "wo-2026-0042",
    "vehicle_vin": "1M8GDM9AXKP042788",
    "vehicle_name": "Truck 104",
    "service_type": "PM-A",
    "completed_at": "2026-07-08T14:22:00Z",
    "odometer": 142318,
    "vendor_name": "In-house shop",
    "description": "Oil, filters, brake inspection"
  }
}`;

describe("parseImportWebhook", () => {
  it("accepts a valid mock webhook", () => {
    const result = parseImportWebhook(SAMPLE_WEBHOOK);
    expect("data" in result).toBe(true);
  });

  it("rejects wrong event type", () => {
    const result = parseImportWebhook('{"event":"other","payload":{}}');
    expect("error" in result).toBe(true);
  });

  it("rejects missing required payload fields", () => {
    const result = parseImportWebhook('{"event":"work_order.completed","payload":{"work_order_id":"wo-1"}}');
    expect("error" in result && result.error).toContain("vehicle_vin");
  });

  it("normalizes vehicle_vin so the preview, validation, and submitted payload never diverge", () => {
    // Regression test: a VIN with stray formatting characters (e.g. hyphens
    // from an upstream system) used to look "valid" in the client preview
    // (which silently stripped them before validating) while the raw,
    // uncleaned VIN was what actually got submitted to /api/import — causing
    // the API to reject a record the UI had just told the user was fine.
    const webhook = JSON.parse(SAMPLE_WEBHOOK) as {
      event: string;
      payload: Record<string, unknown>;
    };
    webhook.payload.vehicle_vin = "1m8-gdm9ax-kp042788";

    const result = parseImportWebhook(JSON.stringify(webhook));
    if (!("data" in result)) throw new Error("expected valid webhook");

    expect(result.data.payload.vehicle_vin).toBe("1M8GDM9AXKP042788");
  });
});

describe("mapWebhookToCanonical", () => {
  it("maps webhook fields to canonical schema", () => {
    const parsed = parseImportWebhook(SAMPLE_WEBHOOK);
    if (!("data" in parsed)) throw new Error("expected valid webhook");

    expect(mapWebhookToCanonical(parsed.data)).toEqual({
      schema_version: "1.0",
      record_id: "wo-2026-0042",
      vin: "1M8GDM9AXKP042788",
      equipment_label: "Truck 104",
      service_type: "PM-A",
      completed_at: "2026-07-08T14:22:00Z",
      odometer_miles: 142318,
      shop_name: "In-house shop",
      notes: "Oil, filters, brake inspection",
      source: "import",
    });
  });
});

describe("import canonical validation", () => {
  it("accepts a valid mapped webhook", () => {
    const parsed = parseImportWebhook(SAMPLE_WEBHOOK);
    if (!("data" in parsed)) throw new Error("expected valid webhook");

    const canonical = mapWebhookToCanonical(parsed.data);
    expect(validateVerifyRecord(canonical)).toEqual([]);
  });

  it("rejects invalid VIN after mapping (V2)", () => {
    const webhook = JSON.parse(SAMPLE_WEBHOOK) as {
      event: string;
      payload: Record<string, unknown>;
    };
    webhook.payload.vehicle_vin = "INVALID";

    const parsed = parseImportWebhook(JSON.stringify(webhook));
    if (!("data" in parsed)) throw new Error("expected valid webhook");

    const errors = validateVerifyRecord(mapWebhookToCanonical(parsed.data));
    expect(errors.some((e) => e.code === "INVALID_VIN")).toBe(true);
  });

  it("rejects future completed_at after mapping (V3)", () => {
    const webhook = JSON.parse(SAMPLE_WEBHOOK) as {
      event: string;
      payload: Record<string, unknown>;
    };
    webhook.payload.completed_at = "2099-01-01T00:00:00Z";

    const parsed = parseImportWebhook(JSON.stringify(webhook));
    if (!("data" in parsed)) throw new Error("expected valid webhook");

    const errors = validateVerifyRecord(mapWebhookToCanonical(parsed.data));
    expect(errors.some((e) => e.code === "FUTURE_DATE")).toBe(true);
  });
});
