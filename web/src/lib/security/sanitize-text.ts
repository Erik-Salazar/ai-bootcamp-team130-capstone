const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Strip control characters and enforce a max length before sending to the API. */
export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(CONTROL_CHARS_RE, "").trim().slice(0, maxLength);
}

/** Preserve newlines/tabs in free-text fields such as notes. */
export function sanitizeMultilineText(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}
