import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import VerifyResult from "../src/components/verify/VerifyResult";

const vectorsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../shared/test-vectors.json",
);
const testVectors = JSON.parse(readFileSync(vectorsPath, "utf-8")) as {
  vectors: Array<{ id: string; input: Record<string, unknown> }>;
};

/**
 * Week 2 workplan: use test-vectors.json and confirm mismatch displays correctly (spec T6).
 * Hashing/compare happens server-side; this test validates the tampered payload and UI copy.
 */
describe("verify tampered vector (spec T6)", () => {
  const canonical = testVectors.vectors[0].input;

  it("tampered record differs from the shared test vector", () => {
    const tampered = { ...canonical, odometer_miles: (canonical.odometer_miles as number) + 1 };
    expect(JSON.stringify(tampered)).not.toBe(JSON.stringify(canonical));
  });

  it("renders mismatch result for a tampered record_id from the vector", () => {
    render(
      <VerifyResult
        result={{
          integrity: "mismatch",
          record_id: canonical.record_id as string,
          message: "This data does not match what was anchored.",
        }}
      />,
    );

    expect(screen.getByText("Mismatch detected")).toBeInTheDocument();
    expect(screen.getByText("This data does not match what was anchored.")).toBeInTheDocument();
    expect(screen.getByText(String(canonical.record_id))).toBeInTheDocument();
  });

  it("renders verified result for the shared test vector (T7)", () => {
    render(
      <VerifyResult
        result={{
          integrity: "verified",
          record_id: canonical.record_id as string,
          content_hash: testVectors.vectors[0].expected_sha256,
          anchored_at: "2026-07-08T14:25:00Z",
          tx_hash: "0xabc123",
          explorer_url: "https://sepolia.basescan.org/tx/0xabc123",
          message: "This record matches its on-chain anchor.",
        }}
      />,
    );

    expect(screen.getByText("Integrity verified")).toBeInTheDocument();
    expect(screen.getByText("This record matches its on-chain anchor.")).toBeInTheDocument();
    expect(screen.getByText(testVectors.vectors[0].expected_sha256)).toBeInTheDocument();
  });
});
