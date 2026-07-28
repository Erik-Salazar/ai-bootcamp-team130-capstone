/**
 * ISO 3779 VIN check-digit (spec §9 V2).
 * Pure helpers — no I/O.
 */

export const VIN_LENGTH = 17;

const VIN_CHARS_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidVinCheckDigit(vin: string): boolean {
  let sum = 0;
  for (let i = 0; i < VIN_LENGTH; i++) {
    const char = vin[i];
    const value = /[0-9]/.test(char) ? Number(char) : (TRANSLITERATION[char] ?? NaN);
    if (Number.isNaN(value)) return false;
    sum += value * WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
  return vin[8] === expected;
}

/** Returns null when VIN is valid; otherwise an error message. */
export function getVinValidationError(vin: unknown): string | null {
  if (typeof vin !== "string" || vin.trim() === "") {
    return "VIN is required.";
  }
  const normalized = normalizeVin(vin);
  if (normalized.length !== VIN_LENGTH) {
    return `VIN must be exactly ${VIN_LENGTH} characters.`;
  }
  if (!VIN_CHARS_RE.test(normalized)) {
    return "VIN may only use letters A–Z (except I, O, Q) and digits.";
  }
  if (!isValidVinCheckDigit(normalized)) {
    return "VIN check digit is invalid.";
  }
  return null;
}
