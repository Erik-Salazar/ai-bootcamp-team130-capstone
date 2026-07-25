import type { DashboardStats } from "../../lib/dashboard/stats";
import StatCard from "./StatCard";

interface DashboardStatsProps {
  stats: DashboardStats;
  statusFilter: string;
  hasVinFilter: boolean;
  onClearAll: () => void;
  onToggleStatus: (value: string) => void;
}

export default function DashboardStatsBar({
  stats,
  statusFilter,
  hasVinFilter,
  onClearAll,
  onToggleStatus,
}: DashboardStatsProps) {
  return (
    <div className="dashboard-stats">
      <StatCard
        value={stats.total}
        label="Total records"
        variant="primary"
        active={!statusFilter && !hasVinFilter}
        onClick={onClearAll}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      />
      <StatCard
        value={stats.anchored}
        label="Anchored"
        variant="success"
        active={statusFilter === "anchored"}
        onClick={() => onToggleStatus("anchored")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
      <StatCard
        value={stats.inProgress}
        label="In progress"
        variant="warning"
        active={statusFilter === "in_progress"}
        onClick={() => onToggleStatus("in_progress")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      />
      <StatCard
        value={stats.failed}
        label="Failed"
        variant="danger"
        active={statusFilter === "anchor_failed"}
        onClick={() => onToggleStatus("anchor_failed")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          </svg>
        }
      />
    </div>
  );
}
