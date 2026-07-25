import { assertJsonTextSize, safeJsonParse } from "../security/safe-json";

export function parseRecordJson(input: string): { data: unknown } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Paste a JSON record or upload a file to verify." };
  }

  const sizeError = assertJsonTextSize(trimmed);
  if (sizeError) {
    return { error: sizeError };
  }

  try {
    const parsed = safeJsonParse(trimmed);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { error: "JSON must be a single object." };
    }
    return { data: parsed };
  } catch {
    return { error: "Invalid JSON. Check syntax and try again." };
  }
}
