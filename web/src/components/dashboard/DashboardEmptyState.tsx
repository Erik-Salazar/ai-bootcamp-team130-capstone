import { Link } from "react-router-dom";

interface DashboardEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function DashboardEmptyState({ hasActiveFilters, onClearFilters }: DashboardEmptyStateProps) {
  return (
    <div className="dashboard-state">
      <div className="dashboard-state__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3>No records found</h3>
      <p>
        {hasActiveFilters
          ? "No records match your filters."
          : "Submit your first maintenance record to get started."}
      </p>
      {hasActiveFilters ? (
        <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
          Clear filters
        </button>
      ) : (
        <Link to="/submit" className="btn btn-primary">Submit</Link>
      )}
    </div>
  );
}
