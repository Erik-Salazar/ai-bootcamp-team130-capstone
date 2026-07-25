import { RECORD_STATUS_LABELS } from "../lib/record-status";

const STATUS_CLASS: Record<string, string> = {
  pending_anchor: "status-pending",
  tx_submitted: "status-tx",
  anchored: "status-anchored",
  anchor_failed: "status-failed",
};

export default function StatusBadge({ status }: { status: string }) {
  const label = RECORD_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  const cls = STATUS_CLASS[status] ?? "status-pending";
  return <span className={`status-badge ${cls}`}>{label}</span>;
}
