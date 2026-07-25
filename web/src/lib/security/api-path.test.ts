import { describe, expect, it } from "vitest";
import { buildRecordPath, getSafeApiBaseUrl } from "./api-path";

describe("buildRecordPath", () => {
  it("encodes valid record ids", () => {
    expect(buildRecordPath("550e8400-e29b-41d4-a716-446655440000"))
      .toBe("/records/550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects invalid ids", () => {
    expect(() => buildRecordPath("../secrets")).toThrow();
  });
});

describe("getSafeApiBaseUrl", () => {
  it("falls back for javascript URLs", () => {
    expect(getSafeApiBaseUrl("javascript:alert(1)")).toBe("http://localhost:4000/api");
  });
});
