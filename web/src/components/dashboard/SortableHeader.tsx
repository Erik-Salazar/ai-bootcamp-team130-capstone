import type { SortColumn, SortDirection, SortState } from "../../lib/sort-records";

interface SortableHeaderProps {
  label: string;
  column: SortColumn;
  sort: SortState;
  onSort: (column: SortColumn) => void;
}

export default function SortableHeader({ label, column, sort, onSort }: SortableHeaderProps) {
  const active = sort.column === column;
  const ariaSort: "ascending" | "descending" | "none" = active
    ? sort.direction === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th aria-sort={ariaSort} scope="col">
      <button
        type="button"
        className={`dashboard-table__sort-btn${active ? " dashboard-table__sort-btn--active" : ""}`}
        onClick={() => onSort(column)}
      >
        <span>{label}</span>
        <SortIcon direction={active ? sort.direction : null} />
      </button>
    </th>
  );
}

function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <span className="dashboard-table__sort-icon" aria-hidden="true">
      <svg
        className={direction === "asc" ? "is-active" : ""}
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="currentColor"
      >
        <path d="M5 1.5 1.75 5.25h6.5L5 1.5Z" />
      </svg>
      <svg
        className={direction === "desc" ? "is-active" : ""}
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="currentColor"
      >
        <path d="M5 8.5 8.25 4.75H1.75L5 8.5Z" />
      </svg>
    </span>
  );
}
