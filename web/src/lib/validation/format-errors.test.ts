import { describe, expect, it } from "vitest";
import { formatValidationErrors } from "./format-errors";

describe("formatValidationErrors", () => {
  it("joins field-scoped messages", () => {
    const message = formatValidationErrors([
      { code: "INVALID_VIN", field: "vin", message: "VIN check digit is invalid." },
      { code: "FUTURE_DATE", field: "completed_at", message: "completed_at cannot be in the future." },
    ]);

    expect(message).toBe(
      "vin: VIN check digit is invalid. completed_at: completed_at cannot be in the future.",
    );
  });

  it("includes global messages without a field prefix", () => {
    const message = formatValidationErrors([
      { code: "NETWORK_ERROR", field: "", message: "Could not reach the server." },
    ]);

    expect(message).toBe("Could not reach the server.");
  });
});
