import { describe, expect, it } from "vitest";
import { getIntegrityMessage, INTEGRITY_LABELS } from "./messages";

describe("getIntegrityMessage", () => {
  it("uses spec copy for verified", () => {
    expect(getIntegrityMessage({ integrity: "verified" })).toBe(
      "This record matches its on-chain anchor.",
    );
  });

  it("uses spec copy for mismatch", () => {
    expect(getIntegrityMessage({ integrity: "mismatch" })).toBe(
      "This data does not match what was anchored.",
    );
  });

  it("uses calm copy for not_found", () => {
    expect(getIntegrityMessage({ integrity: "not_found" })).toBe(
      "No matching record was found for this data.",
    );
  });

  it("uses calm copy for not_anchored", () => {
    expect(getIntegrityMessage({ integrity: "not_anchored" })).toBe(
      "This record exists but has not been anchored on-chain yet.",
    );
  });

  it("prefers the API message when provided", () => {
    expect(
      getIntegrityMessage({
        integrity: "verified",
        message: "Record matches on-chain anchor. No tampering detected.",
      }),
    ).toBe("Record matches on-chain anchor. No tampering detected.");
  });
});

describe("INTEGRITY_LABELS", () => {
  it("covers all four integrity states", () => {
    expect(Object.keys(INTEGRITY_LABELS).sort()).toEqual(
      ["mismatch", "not_anchored", "not_found", "verified"].sort(),
    );
  });
});
