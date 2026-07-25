import { Link } from "react-router-dom";
import type { ApiRecordSummary } from "../../api-client";
import { TABLE_COLUMNS } from "../../lib/dashboard/constants";
import { formatDate, formatOdometer } from "../../lib/format";
import type { PaginationResult } from "../../lib/paginate";
import type { SortColumn, SortState } from "../../lib/sort-records";
import StatusBadge from "../StatusBadge";
import SortableHeader from "./SortableHeader";
import TablePagination from "./TablePagination";

interface RecordsTableProps {
  records: ApiRecordSummary[];
  pagination: PaginationResult<ApiRecordSummary>;
  sort: SortState;
  sortSummary: string;
  refreshing: boolean;
  retryingId: string | null;
  onSort: (column: SortColumn) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRetry: (id: string) => void;
}

export default function RecordsTable({
  records,
  pagination,
  sort,
  sortSummary,
  refreshing,
  retryingId,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRetry,
}: RecordsTableProps) {
  return (
    <div className={`dashboard-table-wrap${refreshing ? " dashboard-table-wrap--refreshing" : ""}`}>
      {refreshing && <div className="dashboard-table-overlay" aria-hidden="true" />}

      <div className="dashboard-table-cap">
        <span className="dashboard-table-cap__title">Records</span>
        <span className="dashboard-table-cap__count">{pagination.total} total</span>
      </div>

      <div className="dashboard-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              {TABLE_COLUMNS.map((col) =>
                col.key === "actions" ? (
                  <th key={col.key} scope="col">{col.label}</th>
                ) : (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    column={col.key}
                    sort={sort}
                    onSort={onSort}
                  />
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <Link to={`/records/${record.id}`} className="dashboard-table__record-id">
                    {record.record_id}
                  </Link>
                </td>
                <td className="mono">{record.vin}</td>
                <td>{record.equipment_label || <span className="dashboard-table__muted">—</span>}</td>
                <td>{record.service_type}</td>
                <td>{formatDate(record.completed_at)}</td>
                <td>{formatOdometer(record.odometer_miles)}</td>
                <td><StatusBadge status={record.status} /></td>
                <td>
                  <div className="dashboard-actions">
                    <Link to={`/records/${record.id}`} className="btn-link">View</Link>
                    <span className="dashboard-actions__sep" aria-hidden="true">·</span>
                    <Link to={`/verify/${record.id}`} className="btn-link">Verify</Link>
                    {record.status === "anchor_failed" && (
                      <>
                        <span className="dashboard-actions__sep" aria-hidden="true">·</span>
                        <button
                          type="button"
                          className="btn-link btn-link--danger"
                          disabled={retryingId === record.id}
                          onClick={() => onRetry(record.id)}
                        >
                          {retryingId === record.id ? "Retrying…" : "Retry"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        totalPages={pagination.totalPages}
        loading={refreshing}
        sortSummary={sortSummary}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
