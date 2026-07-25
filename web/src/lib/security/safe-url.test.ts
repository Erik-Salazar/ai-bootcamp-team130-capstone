import { describe, expect, it } from "vitest";
import { getSafeAppLink, getSafeExplorerUrl, getSafeExternalUrl } from "./safe-url";

describe("getSafeExternalUrl", () => {
  it("allows https URLs", () => {
    expect(getSafeExternalUrl("https://sepolia.basescan.org/tx/0xabc")).toContain("https://");
  });

  it("blocks javascript URLs", () => {
    expect(getSafeExternalUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("getSafeAppLink", () => {
  it("allows root-relative paths", () => {
    expect(getSafeAppLink("/verify/uuid")).toBe("/verify/uuid");
  });

  it("blocks protocol-relative URLs", () => {
    expect(getSafeAppLink("//evil.example/phish")).toBeNull();
  });
});

describe("getSafeExplorerUrl", () => {
  it("allows basescan hosts", () => {
    expect(getSafeExplorerUrl("https://sepolia.basescan.org/tx/0xabc")).not.toBeNull();
  });

  it("blocks unknown hosts", () => {
    expect(getSafeExplorerUrl("https://evil.example/tx/0xabc")).toBeNull();
  });
});
