/** Status filter values used by the dashboard toolbar, stat cards, and mock data. */
export type StatusFilterValue =
  | ""
  | "pending_anchor"
  | "tx_submitted"
  | "in_progress"
  | "anchored"
  | "anchor_failed";

export const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending_anchor", label: "Pending" },
  { value: "tx_submitted", label: "On chain" },
  { value: "in_progress", label: "In progress" },
  { value: "anchored", label: "Anchored" },
  { value: "anchor_failed", label: "Failed" },
];

/** Display labels for record status values (badges, tooltips). */
export const RECORD_STATUS_LABELS: Record<string, string> = {
  pending_anchor: "Pending",
  tx_submitted: "On chain",
  anchored: "Anchored",
  anchor_failed: "Failed",
};

export function matchesStatusFilter(recordStatus: string, filter: string): boolean {
  if (!filter) return true;
  if (filter === "in_progress") {
    return recordStatus === "pending_anchor" || recordStatus === "tx_submitted";
  }
  return recordStatus === filter;
}

export function getStatusFilterLabel(filter: string): string | undefined {
  return STATUS_FILTER_OPTIONS.find((opt) => opt.value === filter)?.label;
}
