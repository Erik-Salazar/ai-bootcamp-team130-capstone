import type { ApiRecordSummary } from "../api-client";

export type SortColumn =
  | "record_id"
  | "vin"
  | "equipment_label"
  | "service_type"
  | "completed_at"
  | "odometer_miles"
  | "status";

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const STATUS_SORT_ORDER: Record<string, number> = {
  pending_anchor: 0,
  tx_submitted: 1,
  anchored: 2,
  anchor_failed: 3,
};

function compareValues(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function sortRecords(
  records: ApiRecordSummary[],
  column: SortColumn,
  direction: SortDirection,
): ApiRecordSummary[] {
  const sorted = [...records].sort((a, b) => {
    let cmp = 0;

    switch (column) {
      case "record_id":
        cmp = compareValues(a.record_id, b.record_id);
        break;
      case "vin":
        cmp = compareValues(a.vin, b.vin);
        break;
      case "equipment_label":
        cmp = compareValues(a.equipment_label ?? "", b.equipment_label ?? "");
        break;
      case "service_type":
        cmp = compareValues(a.service_type, b.service_type);
        break;
      case "completed_at":
        cmp = compareValues(new Date(a.completed_at).getTime(), new Date(b.completed_at).getTime());
        break;
      case "odometer_miles":
        cmp = compareValues(a.odometer_miles, b.odometer_miles);
        break;
      case "status":
        cmp = compareValues(STATUS_SORT_ORDER[a.status] ?? 99, STATUS_SORT_ORDER[b.status] ?? 99);
        break;
    }

    return direction === "asc" ? cmp : -cmp;
  });

  return sorted;
}

export function getSortSummary(column: SortColumn, direction: SortDirection, label: string): string {
  if (column === "completed_at") {
    return `Sorted by ${label} · ${direction === "asc" ? "oldest first" : "newest first"}`;
  }
  if (column === "odometer_miles") {
    return `Sorted by ${label} · ${direction === "asc" ? "low to high" : "high to low"}`;
  }
  return `Sorted by ${label} · ${direction === "asc" ? "A–Z" : "Z–A"}`;
}
