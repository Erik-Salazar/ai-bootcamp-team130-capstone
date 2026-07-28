import { describe, expect, it } from "vitest";
import type { SubmitFormData } from "./types";
import { toSubmitPayload } from "./payload";

const validForm: SubmitFormData = {
  record_id: "  wo-2026-0042  ",
  vin: "1m8gdm9axkp042788",
  equipment_label: "Truck 104",
  service_type: " PM-A ",
  completed_at: "2026-07-08T14:22:00Z",
  odometer_miles: "142318",
  shop_name: "In-house shop",
  notes: "Oil change\nFilter replaced",
};

describe("toSubmitPayload", () => {
  it("sanitizes and normalizes form values for the API", () => {
    expect(toSubmitPayload(validForm)).toEqual({
      schema_version: "1.0",
      record_id: "wo-2026-0042",
      vin: "1M8GDM9AXKP042788",
      equipment_label: "Truck 104",
      service_type: "PM-A",
      completed_at: "2026-07-08T14:22:00.000Z",
      odometer_miles: 142318,
      shop_name: "In-house shop",
      notes: "Oil change\nFilter replaced",
    });
  });

  it("omits optional fields when empty", () => {
    const payload = toSubmitPayload({
      ...validForm,
      equipment_label: "",
      notes: "   ",
    });

    expect(payload.equipment_label).toBeUndefined();
    expect(payload.notes).toBeUndefined();
  });

  it("strips control characters from text fields", () => {
    const payload = toSubmitPayload({
      ...validForm,
      shop_name: "Shop\u0007Name",
    });

    expect(payload.shop_name).toBe("ShopName");
  });
});
