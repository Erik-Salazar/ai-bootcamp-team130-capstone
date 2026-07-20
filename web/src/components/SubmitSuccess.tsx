import type { SubmitRecordResponse } from "../api-client";

interface SubmitSuccessProps {
  result: SubmitRecordResponse;
  onReset: () => void;
}

export default function SubmitSuccess({ result, onReset }: SubmitSuccessProps) {
  return (
    <div className="submit-success">
      <div className="success-icon">✓</div>
      <h2>Record Submitted Successfully</h2>
      <p className="success-detail">
        <code className="record-id-display">{result.record_id}</code>
      </p>
      <p className="success-status">
        Status: <span className="status-badge status-pending">pending anchor</span>
      </p>
      <p className="success-subtitle">
        The record passed validation and is queued for on-chain anchoring. Once the transaction confirms, anyone with the verify link can prove this record hasn't been altered.
      </p>
      <div className="success-actions">
        <a href={result.verify_url} className="btn btn-primary">Open Verify Link</a>
        <a href={`/records/${result.id}`} className="btn btn-secondary">View Record</a>
        <button type="button" onClick={onReset} className="btn btn-ghost">Submit Another</button>
      </div>
      <div className="success-link-copy">
        <label>Share this verification link</label>
        <div className="link-copy-row">
          <code>{result.verify_url}</code>
        </div>
      </div>
    </div>
  );
}
