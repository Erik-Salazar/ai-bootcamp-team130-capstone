import { useCallback, useEffect, useState } from "react";
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
  const [vinFilter, setVinFilterState] = useState("");
  const vinDebounced = useDebouncedValue(vinFilter, VIN_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<RetryMessage>(null);

  function setVinFilter(value: string) {
    setRetryMessage(null);
    setVinFilterState(normalizeVin(value).slice(0, 17));
  }

  const loadRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    const params: { vin?: string; status?: string } = {};
    if (vinDebounced.trim()) params.vin = vinDebounced.trim();
    if (statusFilter && statusFilter !== "in_progress") params.status = statusFilter;

    try {
      const result = await listRecords(params);
      setRecords(applyStatusFilter(result.records, statusFilter));
    } catch {
      setRecords([]);
      setLoadError("Could not load records. Make sure the API is running at the configured URL.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vinDebounced, statusFilter]);

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
