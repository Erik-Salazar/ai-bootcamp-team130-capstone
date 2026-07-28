import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("frontend smoke — all routes render", () => {
  function renderAt(path: string) {
    window.history.pushState({}, "", path);
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  }

  it("renders Dashboard", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: /Maintenance Records/i })).toBeInTheDocument();
  });

  it("renders Submit", () => {
    renderAt("/submit");
    expect(screen.getByRole("heading", { name: /Submit Maintenance Record/i })).toBeInTheDocument();
  });

  it("renders Verify", () => {
    renderAt("/verify");
    expect(screen.getByRole("heading", { name: /Verify Maintenance Record/i })).toBeInTheDocument();
  });

  it("renders Import", () => {
    renderAt("/import");
    expect(screen.getByRole("heading", { name: /Import Webhook JSON/i })).toBeInTheDocument();
  });

  it("renders Record Detail shell for invalid id", () => {
    renderAt("/records/not-a-valid-id");
    expect(screen.getByRole("heading", { name: /Record Detail/i })).toBeInTheDocument();
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });
});
