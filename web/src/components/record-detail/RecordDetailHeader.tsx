import { Link } from "react-router-dom";
import type { ApiRecordDetail } from "../../api-client";

interface RecordDetailHeaderProps {
  record: ApiRecordDetail;
  retrying: boolean;
  onRetry: () => void;
}

export default function RecordDetailHeader({ record, retrying, onRetry }: RecordDetailHeaderProps) {
  const showRetry = record.status === "anchor_failed";

  return (
    <header className="page-header page-header--accent">
      <div>
        <h2>Record Detail</h2>
      </div>
      <div className="page-header__actions">
        <Link to="/" className="btn btn-secondary">Back to dashboard</Link>
        <Link to={`/verify/${record.id}`} className="btn btn-secondary">Verify</Link>
        {showRetry && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={retrying}
            onClick={onRetry}
          >
            {retrying ? "Retrying…" : "Retry anchor"}
          </button>
        )}
      </div>
    </header>
  );
}
