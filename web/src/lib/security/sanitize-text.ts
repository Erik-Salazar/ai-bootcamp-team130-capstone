const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Strip control characters and enforce a max length before sending to the API.
 * Does not trim leading/trailing whitespace, so it is safe to call on every
 * keystroke (e.g. in an onChange handler) without blocking the user from
 * typing a trailing space. Trim separately when building the final payload.
 */
export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(CONTROL_CHARS_RE, "").slice(0, maxLength);
}

/** Preserve newlines/tabs in free-text fields such as notes. */
export function sanitizeMultilineText(value: string, maxLength: number): string {
  return value.replace(CONTROL_CHARS_RE, "").slice(0, maxLength);
}
