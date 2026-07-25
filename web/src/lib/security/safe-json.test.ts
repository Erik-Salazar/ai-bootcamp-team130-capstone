import { describe, expect, it } from "vitest";
import { safeJsonParse } from "./safe-json";

describe("safeJsonParse", () => {
  it("parses valid JSON objects", () => {
    expect(safeJsonParse('{"record_id":"wo-1"}')).toEqual({ record_id: "wo-1" });
  });

  it("rejects prototype pollution keys", () => {
    expect(() => safeJsonParse('{"__proto__":{"polluted":true}}')).toThrow(/Forbidden key/);
  });
});
