import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listRecordsMock = vi.fn();

vi.mock("../api-client", () => ({
  listRecords: (...args: unknown[]) => listRecordsMock(...args),
  retryRecord: vi.fn(),
}));

import { useDashboardRecords } from "./useDashboardRecords";

function summary(id: string, status: string) {
  return {
    id,
    record_id: id,
    vin: "1FUJGHDV8CLBR1234",
    service_type: "PM-A",
    completed_at: "2026-07-08T14:22:00Z",
    odometer_miles: 100,
    status,
    tx_hash: null,
    anchored_at: null,
    verify_url: `/verify/${id}`,
  };
}

describe("useDashboardRecords", () => {
  beforeEach(() => {
    listRecordsMock.mockReset();
  });

  it("ignores a stale response that resolves after a newer request has already landed", async () => {
    // Regression test: loadRecords() had no way to tell an old, slow
    // response apart from the latest one. If a user changed filters twice
    // in quick succession and the *first* request happened to resolve
    // *after* the second, its (stale) results would overwrite the fresher
    // state that had already rendered.
    let resolveFirst!: (value: { records: unknown[]; total: number }) => void;
    let resolveSecond!: (value: { records: unknown[]; total: number }) => void;

    listRecordsMock
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveFirst = resolve; }),
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveSecond = resolve; }),
      );

    const { result } = renderHook(() => useDashboardRecords());

    // First request is in flight (initial mount load). Trigger a second
    // request before it resolves, e.g. via a manual refresh.
    await waitFor(() => expect(listRecordsMock).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(listRecordsMock).toHaveBeenCalledTimes(2));

    // Newer (second) request resolves first.
    await act(async () => {
      resolveSecond({ records: [summary("fresh", "anchored")], total: 1 });
    });
    await waitFor(() => {
      expect(result.current.records.map((r) => r.id)).toEqual(["fresh"]);
    });

    // Older (first) request resolves late — must NOT clobber current state.
    await act(async () => {
      resolveFirst({ records: [summary("stale", "pending_anchor")], total: 1 });
    });

    expect(result.current.records.map((r) => r.id)).toEqual(["fresh"]);
  });
});
