import { describe, expect, it } from "vitest";
import { sanitizeMultilineText, sanitizeText } from "./sanitize-text";

describe("sanitizeText", () => {
  it("removes control characters", () => {
    expect(sanitizeText("hello\u0007world", 20)).toBe("helloworld");
  });

  it("enforces max length", () => {
    expect(sanitizeText("abcdef", 3)).toBe("abc");
  });
});

describe("sanitizeMultilineText", () => {
  it("keeps newlines in notes", () => {
    expect(sanitizeMultilineText("line one\nline two", 50)).toBe("line one\nline two");
  });
});
