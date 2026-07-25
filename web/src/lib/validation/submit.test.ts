import { describe, expect, it } from "vitest";
import type { SubmitFormData } from "../submit/types";
import { validateSubmitForm } from "./submit";

const validForm: SubmitFormData = {
  record_id: "wo-2026-0042",
  vin: "1M8GDM9AXKP042788",
  equipment_label: "",
  service_type: "PM-A",
  completed_at: "2026-07-08T14:22:00",
  odometer_miles: "142318",
  shop_name: "In-house shop",
  notes: "",
};

describe("validateSubmitForm", () => {
  it("accepts a valid form", () => {
    expect(validateSubmitForm(validForm)).toEqual([]);
  });

  it("reports missing required fields (V1)", () => {
    const errors = validateSubmitForm({
      ...validForm,
      record_id: "",
      shop_name: "  ",
    });
    expect(errors.some((e) => e.code === "MISSING_FIELD" && e.field === "record_id")).toBe(true);
    expect(errors.some((e) => e.code === "MISSING_FIELD" && e.field === "shop_name")).toBe(true);
  });

  it("reports invalid VIN (V2)", () => {
    const errors = validateSubmitForm({ ...validForm, vin: "TOO-SHORT" });
    expect(errors.some((e) => e.code === "INVALID_VIN" && e.field === "vin")).toBe(true);
  });

  it("reports future completed_at (V3)", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    const errors = validateSubmitForm({ ...validForm, completed_at: future });
    expect(errors.some((e) => e.code === "FUTURE_DATE" && e.field === "completed_at")).toBe(true);
  });

  it("reports invalid odometer (V4)", () => {
    expect(validateSubmitForm({ ...validForm, odometer_miles: "0" }).some((e) => e.code === "INVALID_ODOMETER")).toBe(true);
    expect(validateSubmitForm({ ...validForm, odometer_miles: "2000000" }).some((e) => e.code === "INVALID_ODOMETER")).toBe(true);
  });

  it("reports invalid service type length (V7)", () => {
    const errors = validateSubmitForm({
      ...validForm,
      service_type: "x".repeat(65),
    });
    expect(errors.some((e) => e.code === "INVALID_SERVICE")).toBe(true);
  });
});
