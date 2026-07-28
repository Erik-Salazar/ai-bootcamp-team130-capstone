import { describe, expect, it } from "vitest";
import { mapWebhookToCanonical } from "./map-webhook";
import { parseImportWebhook } from "./parse-webhook";

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
