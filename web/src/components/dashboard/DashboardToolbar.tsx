import { FIELD_LABELS } from "../../lib/field-labels";
import { STATUS_FILTER_OPTIONS, getStatusFilterLabel } from "../../lib/record-status";

interface DashboardToolbarProps {
  vinFilter: string;
  statusFilter: string;
  loading: boolean;
  refreshing: boolean;
  hasActiveFilters: boolean;
  onVinChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  onClearVin: () => void;
  onClearStatus: () => void;
  onClearAll: () => void;
}

export default function DashboardToolbar({
  vinFilter,
  statusFilter,
  loading,
  refreshing,
  hasActiveFilters,
  onVinChange,
  onStatusChange,
  onRefresh,
  onClearVin,
  onClearStatus,
  onClearAll,
}: DashboardToolbarProps) {
  const activeStatusLabel = getStatusFilterLabel(statusFilter);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-toolbar">
        <div className="dashboard-filter">
          <label htmlFor="vin-filter">{FIELD_LABELS.vin}</label>
          <div className="dashboard-filter-input">
            <svg className="dashboard-filter-input__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="vin-filter"
              type="search"
              placeholder="e.g. 1FUJGHDV8CLBR1234"
              value={vinFilter}
              onChange={(e) => onVinChange(e.target.value)}
              className="mono"
            />
          </div>
        </div>

        <div className="dashboard-filter dashboard-filter--status">
          <label htmlFor="status-filter">{FIELD_LABELS.status}</label>
          <select
            id="status-filter"
            className="app-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="dashboard-toolbar__actions">
          <button
            type="button"
            className={`btn btn-secondary btn-refresh${refreshing ? " btn-refresh--spinning" : ""}`}
            onClick={onRefresh}
            disabled={loading || refreshing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="dashboard-active-filters" aria-live="polite">
          <span className="dashboard-active-filters__label">Filtered by</span>
          {vinFilter.trim() && (
            <button
              type="button"
              className="filter-chip"
              onClick={onClearVin}
              aria-label={`Remove VIN filter: ${vinFilter.trim()}`}
            >
              <span className="filter-chip__text">{FIELD_LABELS.vin}: {vinFilter.trim()}</span>
              <span className="filter-chip__remove" aria-hidden="true">×</span>
            </button>
          )}
          {statusFilter && activeStatusLabel && (
            <button
              type="button"
              className="filter-chip"
              onClick={onClearStatus}
              aria-label={`Remove status filter: ${activeStatusLabel}`}
            >
              <span className="filter-chip__text">{FIELD_LABELS.status}: {activeStatusLabel}</span>
              <span className="filter-chip__remove" aria-hidden="true">×</span>
            </button>
          )}
          <button type="button" className="filter-clear-all" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
