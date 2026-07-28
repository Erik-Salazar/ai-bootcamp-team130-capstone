import { describe, expect, it } from "vitest";
import { getStatusFilterLabel, matchesStatusFilter } from "./record-status";

describe("matchesStatusFilter", () => {
  it("returns all records when filter is empty", () => {
    expect(matchesStatusFilter("anchored", "")).toBe(true);
    expect(matchesStatusFilter("anchor_failed", "")).toBe(true);
  });

  it("matches exact status filters", () => {
    expect(matchesStatusFilter("anchored", "anchored")).toBe(true);
    expect(matchesStatusFilter("pending_anchor", "anchored")).toBe(false);
  });

  it("groups pending and tx_submitted under in_progress", () => {
    expect(matchesStatusFilter("pending_anchor", "in_progress")).toBe(true);
    expect(matchesStatusFilter("tx_submitted", "in_progress")).toBe(true);
    expect(matchesStatusFilter("anchored", "in_progress")).toBe(false);
  });
});

describe("getStatusFilterLabel", () => {
  it("returns labels for known filters", () => {
    expect(getStatusFilterLabel("anchor_failed")).toBe("Failed");
    expect(getStatusFilterLabel("in_progress")).toBe("In progress");
  });
});
