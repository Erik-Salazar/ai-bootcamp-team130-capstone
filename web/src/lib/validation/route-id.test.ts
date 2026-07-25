import { describe, expect, it } from "vitest";
import { isValidRecordRouteId } from "./route-id";

describe("isValidRecordRouteId", () => {
  it("accepts UUIDs", () => {
    expect(isValidRecordRouteId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects invalid ids", () => {
    expect(isValidRecordRouteId("not-a-uuid")).toBe(false);
    expect(isValidRecordRouteId(undefined)).toBe(false);
  });
});
