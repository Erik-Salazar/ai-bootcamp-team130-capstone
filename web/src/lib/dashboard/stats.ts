import type { ApiRecordSummary } from "../../api-client";

export interface DashboardStats {
  total: number;
  anchored: number;
  inProgress: number;
  failed: number;
}

export function computeDashboardStats(records: ApiRecordSummary[]): DashboardStats {
  return {
    total: records.length,
    anchored: records.filter((r) => r.status === "anchored").length,
    inProgress: records.filter((r) => r.status === "pending_anchor" || r.status === "tx_submitted").length,
    failed: records.filter((r) => r.status === "anchor_failed").length,
  };
}
