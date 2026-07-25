import { describe, expect, it } from "vitest";
import { parseRecordJson } from "./parse-json";

describe("parseRecordJson", () => {
  it("accepts a valid JSON object", () => {
    const result = parseRecordJson('{"record_id":"wo-1","vin":"1FUJGHDV8CLBR1234"}');
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toEqual({ record_id: "wo-1", vin: "1FUJGHDV8CLBR1234" });
    }
  });

  it("rejects empty input", () => {
    const result = parseRecordJson("   ");
    expect("error" in result).toBe(true);
  });

  it("rejects invalid JSON syntax", () => {
    const result = parseRecordJson("{ not json");
    expect("error" in result && result.error).toContain("Invalid JSON");
  });

  it("rejects arrays and primitives", () => {
    expect("error" in parseRecordJson("[]")).toBe(true);
    expect("error" in parseRecordJson('"hello"')).toBe(true);
  });
});
