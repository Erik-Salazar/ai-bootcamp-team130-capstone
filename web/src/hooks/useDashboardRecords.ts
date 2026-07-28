import { useCallback, useEffect, useRef, useState } from "react";
import { listRecords, retryRecord, type ApiRecordSummary } from "../api-client";
import { VIN_DEBOUNCE_MS } from "../lib/dashboard/constants";
import { matchesStatusFilter } from "../lib/record-status";
import { normalizeVin } from "../lib/validation/vin";
import { useDebouncedValue } from "./useDebouncedValue";

export type RetryMessage = { type: "success" | "error"; text: string } | null;

function applyStatusFilter(records: ApiRecordSummary[], status: string) {
  return records.filter((r) => matchesStatusFilter(r.status, status));
}

export function useDashboardRecords() {
  const [records, setRecords] = useState<ApiRecordSummary[]>([]);
  // Unfiltered-by-status records (still respects the VIN filter). Used to
  // power the stats bar so "Total records" etc. don't change just because
  // a status filter chip is toggled.
  const [allRecords, setAllRecords] = useState<ApiRecordSummary[]>([]);
  const [vinFilter, setVinFilterState] = useState("");
  const vinDebounced = useDebouncedValue(vinFilter, VIN_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<RetryMessage>(null);
  // Tracks the most recently started request so a slower, older response
  // (e.g. from a filter that's since changed) can't clobber fresher state.
  const latestRequestId = useRef(0);

  function setVinFilter(value: string) {
    setRetryMessage(null);
    setVinFilterState(normalizeVin(value).slice(0, 17));
  }

  const loadRecords = useCallback(async (isRefresh = false) => {
    const requestId = ++latestRequestId.current;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    // Status filtering is applied client-side (see below) so the stats bar
    // can always reflect the full, vin-filtered result set regardless of
    // which status chip is active.
    const params: { vin?: string } = {};
    if (vinDebounced.trim()) params.vin = vinDebounced.trim();

    try {
      const result = await listRecords(params);
      if (latestRequestId.current !== requestId) return; // superseded by a newer request
      setAllRecords(result.records);
    } catch {
      if (latestRequestId.current !== requestId) return;
      setAllRecords([]);
      setLoadError("Could not load records. Make sure the API is running at the configured URL.");
    } finally {
      if (latestRequestId.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [vinDebounced]);

  useEffect(() => {
    setRecords(applyStatusFilter(allRecords, statusFilter));
  }, [allRecords, statusFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function refresh() {
    setRetryMessage(null);
    loadRecords(true);
  }

  function clearFilters() {
    setRetryMessage(null);
    if (vinFilter === "" && statusFilter === "") return;
    setVinFilter("");
    setStatusFilter("");
  }

  function clearVinFilter() {
    setRetryMessage(null);
    setVinFilter("");
  }

  function clearStatusFilter() {
    setRetryMessage(null);
    setStatusFilter("");
  }

  function toggleStatusFilter(value: string) {
    setRetryMessage(null);
    setStatusFilter((prev) => (prev === value ? "" : value));
  }

  function setStatus(value: string) {
    setRetryMessage(null);
    setStatusFilter(value);
  }

  async function retryRecordById(id: string) {
    setRetryingId(id);
    setRetryMessage(null);

    try {
      await retryRecord(id);
      await loadRecords(true);
      setRetryMessage({ type: "success", text: "Retry queued — record moved back to pending." });
    } catch {
      setRetryMessage({
        type: "error",
        text: "Could not retry this record. Please try again.",
      });
    } finally {
      setRetryingId(null);
    }
  }

  const hasActiveFilters = vinFilter.trim() !== "" || statusFilter !== "";
  const showSkeleton = loading && records.length === 0 && !loadError;

  return {
    records,
    allRecords,
    vinFilter,
    vinDebounced,
    setVinFilter,
    statusFilter,
    setStatusFilter,
    setStatus,
    loading,
    refreshing,
    loadError,
    retryingId,
    retryMessage,
    hasActiveFilters,
    showSkeleton,
    refresh,
    clearFilters,
    clearVinFilter,
    clearStatusFilter,
    toggleStatusFilter,
    retryRecordById,
  };
}
