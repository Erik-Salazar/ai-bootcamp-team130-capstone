import { useEffect, useMemo, useState } from "react";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import DashboardStatsBar from "../components/dashboard/DashboardStats";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";
import RecordsTable from "../components/dashboard/RecordsTable";
import PageBanner from "../components/PageBanner";
import { DEFAULT_PAGE_SIZE, SORT_COLUMN_LABELS } from "../lib/dashboard/constants";
import { computeDashboardStats } from "../lib/dashboard/stats";
import { paginateItems } from "../lib/paginate";
import { getSortSummary, sortRecords, type SortColumn, type SortState } from "../lib/sort-records";
import { useDashboardRecords } from "../hooks/useDashboardRecords";

export default function Dashboard() {
  const {
    records,
    allRecords,
    vinFilter,
    vinDebounced,
    setVinFilter,
    statusFilter,
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
  } = useDashboardRecords();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ column: "completed_at", direction: "desc" });

  const sortedRecords = useMemo(
    () => sortRecords(records, sort.column, sort.direction),
    [records, sort],
  );

  const pagination = useMemo(
    () => paginateItems(sortedRecords, page, pageSize),
    [sortedRecords, page, pageSize],
  );

  const stats = useMemo(() => computeDashboardStats(allRecords), [allRecords]);
  const sortSummary = getSortSummary(sort.column, sort.direction, SORT_COLUMN_LABELS[sort.column]);

  useEffect(() => {
    setPage(1);
  }, [vinDebounced, statusFilter, pageSize]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function handleSort(column: SortColumn) {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
    setPage(1);
  }

  return (
    <section className="page page--wide">
      <DashboardHeader />

      {!showSkeleton && (
        <DashboardStatsBar
          stats={stats}
          statusFilter={statusFilter}
          hasVinFilter={!!vinFilter.trim()}
          onClearAll={clearFilters}
          onToggleStatus={toggleStatusFilter}
        />
      )}

      <DashboardToolbar
        vinFilter={vinFilter}
        statusFilter={statusFilter}
        loading={loading}
        refreshing={refreshing}
        hasActiveFilters={hasActiveFilters}
        onVinChange={setVinFilter}
        onStatusChange={setStatus}
        onRefresh={refresh}
        onClearVin={clearVinFilter}
        onClearStatus={clearStatusFilter}
        onClearAll={clearFilters}
      />

      {loadError && <PageBanner type="error">{loadError}</PageBanner>}

      {retryMessage && (
        <PageBanner type={retryMessage.type}>{retryMessage.text}</PageBanner>
      )}

      {showSkeleton ? (
        <DashboardSkeleton />
      ) : records.length === 0 ? (
        <DashboardEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} />
      ) : (
        <RecordsTable
          records={pagination.items}
          pagination={pagination}
          sort={sort}
          sortSummary={sortSummary}
          refreshing={refreshing}
          retryingId={retryingId}
          onSort={handleSort}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRetry={retryRecordById}
        />
      )}
    </section>
  );
}
