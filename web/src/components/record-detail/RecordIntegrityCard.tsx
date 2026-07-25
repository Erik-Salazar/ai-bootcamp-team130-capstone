import type { ApiRecordDetail } from "../../api-client";
import { formatDateTime } from "../../lib/format";
import { getSafeAppLink } from "../../lib/security/safe-url";
import CopyButton from "../CopyButton";
import SafeExternalLink from "../SafeLink";

interface RecordIntegrityCardProps {
  record: ApiRecordDetail;
}

function CopyableValue({ value, label }: { value: string; label: string }) {
  return (
    <div className="copyable-value">
      <code className="copyable-value__text">{value}</code>
      <CopyButton text={value} label={label} />
    </div>
  );
}

export default function RecordIntegrityCard({ record }: RecordIntegrityCardProps) {
  const hasAnchorData = record.content_hash || record.anchored_at || record.tx_hash;
  const safeVerifyLink = getSafeAppLink(record.verify_url);

  return (
    <section className="record-detail-card record-detail-card--integrity">
      <h3 className="record-detail-card__title">Integrity &amp; anchoring</h3>

      {!hasAnchorData ? (
        <p className="record-detail-empty">
          This record has not been anchored yet. Once the worker confirms the on-chain transaction,
          the content hash and explorer link will appear here.
        </p>
      ) : (
        <dl className="record-detail-meta">
          {record.content_hash && (
            <>
              <dt>Content hash</dt>
              <dd><CopyableValue value={record.content_hash} label="hash" /></dd>
            </>
          )}
          {record.anchored_at && (
            <>
              <dt>Anchored at</dt>
              <dd>{formatDateTime(record.anchored_at)}</dd>
            </>
          )}
          {record.tx_hash && (
            <>
              <dt>Transaction</dt>
              <dd>
                <CopyableValue value={record.tx_hash} label="tx hash" />
                <SafeExternalLink
                  href={record.explorer_url}
                  className="record-detail-explorer"
                  explorer
                >
                  View on explorer →
                </SafeExternalLink>
              </dd>
            </>
          )}
          {record.retry_count > 0 && (
            <>
              <dt>Retry attempts</dt>
              <dd>{record.retry_count}</dd>
            </>
          )}
        </dl>
      )}

      {safeVerifyLink && (
        <div className="record-detail-verify-link">
          <label htmlFor="record-verify-url">Verification link</label>
          <div className="link-copy-row">
            <code id="record-verify-url">{safeVerifyLink}</code>
            <CopyButton text={safeVerifyLink} label="Copy link" />
          </div>
          <p className="record-detail-verify-hint">
            Anyone with this link can check whether the record still matches its on-chain anchor.
          </p>
        </div>
      )}
    </section>
  );
}
