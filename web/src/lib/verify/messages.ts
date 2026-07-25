import type { VerifyResponse } from "../../api-client";

export type IntegrityStatus = VerifyResponse["integrity"];

export const INTEGRITY_LABELS: Record<IntegrityStatus, string> = {
  verified: "Integrity verified",
  mismatch: "Mismatch detected",
  not_found: "Record not found",
  not_anchored: "Not yet anchored",
};

export function getIntegrityMessage(result: VerifyResponse): string {
  if (result.message) return result.message;

  switch (result.integrity) {
    case "verified":
      return "This record matches its on-chain anchor.";
    case "mismatch":
      return "This data does not match what was anchored.";
    case "not_found":
      return "No matching record was found for this data.";
    case "not_anchored":
      return "This record exists but has not been anchored on-chain yet.";
    default:
      return "Verification complete.";
  }
}
