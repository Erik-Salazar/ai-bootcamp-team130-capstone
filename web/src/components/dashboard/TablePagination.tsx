import { PAGE_SIZE_OPTIONS } from "../../lib/dashboard/constants";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  totalPages: number;
  loading?: boolean;
  sortSummary?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function TablePagination({
  page,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  totalPages,
  loading = false,
  sortSummary,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const canGoPrev = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading;

  return (
    <div className="dashboard-table-footer">
      <div className="dashboard-table-footer__info">
        <span>
          {loading
            ? "Loading…"
            : total === 0
              ? "No records"
              : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </span>
        {sortSummary && !loading && total > 0 && (
          <span className="dashboard-table-footer__sort">{sortSummary}</span>
        )}
      </div>

      <div className="dashboard-table-footer__controls">
        <label className="dashboard-table-footer__page-size">
          <span>Rows</span>
          <select
            className="app-select app-select--compact"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <div className="dashboard-table-footer__pages">
          <button
            type="button"
            className="btn btn-secondary btn-sm dashboard-table-footer__page-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrev}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="dashboard-table-footer__page-label">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm dashboard-table-footer__page-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
