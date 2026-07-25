export function parseRecordJson(input: string): { data: unknown } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Paste a JSON record or upload a file to verify." };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { error: "JSON must be a single object." };
    }
    return { data: parsed };
  } catch {
    return { error: "Invalid JSON. Check syntax and try again." };
  }
}
