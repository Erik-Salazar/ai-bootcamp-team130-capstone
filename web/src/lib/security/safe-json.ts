import { MAX_JSON_TEXT_CHARS } from "./constants";

const FORBIDDEN_JSON_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function assertJsonTextSize(input: string): string | null {
  if (input.length > MAX_JSON_TEXT_CHARS) {
    return `JSON must be smaller than ${Math.floor(MAX_JSON_TEXT_CHARS / 1024)} KB.`;
  }
  return null;
}

/** Parse JSON while rejecting prototype-pollution keys. */
export function safeJsonParse(input: string): unknown {
  return JSON.parse(input, (key, value) => {
    if (FORBIDDEN_JSON_KEYS.has(key)) {
      throw new SyntaxError("Forbidden key in JSON.");
    }
    return value;
  });
}
