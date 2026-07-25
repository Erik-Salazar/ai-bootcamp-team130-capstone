import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VerifyResult from "./VerifyResult";

describe("VerifyResult", () => {
  it("renders verified state with anchor metadata", () => {
    render(
      <VerifyResult
        result={{
          integrity: "verified",
          record_id: "wo-2026-0042",
          content_hash: "abc123",
          anchored_at: "2026-07-08T14:25:00Z",
          tx_hash: "0xdeadbeef",
          explorer_url: "https://sepolia.basescan.org/tx/0xdeadbeef",
        }}
      />,
    );

    expect(screen.getByText("Integrity verified")).toBeInTheDocument();
    expect(screen.getByText("This record matches its on-chain anchor.")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on explorer/i })).toHaveAttribute(
      "href",
      "https://sepolia.basescan.org/tx/0xdeadbeef",
    );
  });

  it("renders not_anchored without alarming tone", () => {
    render(
      <VerifyResult
        result={{
          integrity: "not_anchored",
          record_id: "wo-pending",
        }}
      />,
    );

    expect(screen.getByText("Not yet anchored")).toBeInTheDocument();
    expect(
      screen.getByText("This record exists but has not been anchored on-chain yet."),
    ).toBeInTheDocument();
  });

  it("renders not_found state", () => {
    render(
      <VerifyResult
        result={{
          integrity: "not_found",
          content_hash: "535844002a6967e86b3f117acd4ecaa3ab16909f79ee21dcb5244f479bb06ab5",
        }}
      />,
    );

    expect(screen.getByText("Record not found")).toBeInTheDocument();
    expect(screen.getByText("No matching record was found for this data.")).toBeInTheDocument();
  });
});
