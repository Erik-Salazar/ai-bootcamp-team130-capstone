import { describe, expect, it } from "vitest";
import { getVinValidationError, isValidVinCheckDigit, normalizeVin } from "./vin";

describe("normalizeVin", () => {
  it("uppercases and strips invalid characters", () => {
    expect(normalizeVin("1m8g-dm9a")).toBe("1M8GDM9A");
  });
});

describe("getVinValidationError", () => {
  it("accepts a known valid VIN", () => {
    expect(getVinValidationError("1M8GDM9AXKP042788")).toBeNull();
    expect(isValidVinCheckDigit("1M8GDM9AXKP042788")).toBe(true);
  });

  it("rejects short VINs", () => {
    expect(getVinValidationError("1M8GDM9A")).toContain("17 characters");
  });

  it("rejects invalid check digit", () => {
    expect(getVinValidationError("1M8GDM9AXKP042789")).toContain("check digit");
  });
});
