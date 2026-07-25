import { Link } from "react-router-dom";
import type { SubmitRecordResponse } from "../../api-client";
import { getSafeAppLink } from "../../lib/security/safe-url";
import { isValidRecordRouteId } from "../../lib/validation/route-id";
import StatusBadge from "../StatusBadge";
import CopyButton from "../CopyButton";
import { SafeAppLink } from "../SafeLink";

interface SubmitSuccessProps {
  result: SubmitRecordResponse;
  onReset: () => void;
}

export default function SubmitSuccess({ result, onReset }: SubmitSuccessProps) {
  const safeVerifyLink = getSafeAppLink(result.verify_url);
  const canViewRecord = isValidRecordRouteId(result.id);

  return (
    <div className="submit-success">
      <div className="success-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2>Record Submitted Successfully</h2>
      <p className="success-detail">
        <code className="record-id-display">{result.record_id}</code>
      </p>
      <p className="success-status">
        Status: <StatusBadge status={result.status} />
      </p>
      <p className="success-subtitle">
        The record passed validation and is queued for on-chain anchoring. Once the transaction confirms, anyone with the verify link can prove this record has not been altered.
      </p>
      <div className="success-actions">
        {safeVerifyLink && (
          <SafeAppLink href={result.verify_url} className="btn btn-primary">
            Open Verify Link
          </SafeAppLink>
        )}
        {canViewRecord && (
          <Link to={`/records/${result.id}`} className="btn btn-secondary">View Record</Link>
        )}
        <button type="button" onClick={onReset} className="btn btn-ghost">Submit Another</button>
      </div>
      {safeVerifyLink && (
        <div className="success-link-copy">
          <label>Share this verification link</label>
          <div className="link-copy-row">
            <code>{safeVerifyLink}</code>
            <CopyButton text={safeVerifyLink} label="Copy link" />
          </div>
        </div>
      )}
    </div>
  );
}
