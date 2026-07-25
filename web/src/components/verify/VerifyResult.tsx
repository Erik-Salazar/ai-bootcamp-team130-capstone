import type { VerifyResponse } from "../../api-client";
import { formatDateTime } from "../../lib/format";
import { getIntegrityMessage } from "../../lib/verify/messages";
import CopyButton from "../CopyButton";
import SafeExternalLink from "../SafeLink";
import IntegrityBadge from "./IntegrityBadge";

interface VerifyResultProps {
  result: VerifyResponse;
}

const INTEGRITY_VALUES = new Set<VerifyResponse["integrity"]>([
  "verified",
  "not_found",
  "not_anchored",
  "mismatch",
]);

function CopyableValue({ value, label }: { value: string; label: string }) {
  return (
    <div className="copyable-value">
      <code className="copyable-value__text">{value}</code>
      <CopyButton text={value} label={label} />
    </div>
  );
}

export default function VerifyResult({ result }: VerifyResultProps) {
  const integrity = INTEGRITY_VALUES.has(result.integrity) ? result.integrity : "not_found";
  const isVerified = integrity === "verified";

  return (
    <div className={`verify-result verify-result--${integrity} verify-result--animated`}>
      <div className="verify-result__icon" aria-hidden="true">
        {isVerified ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : integrity === "mismatch" ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="verify-result__body">
        <IntegrityBadge integrity={integrity} />
        <p className="verify-result__message">{getIntegrityMessage({ ...result, integrity })}</p>

        {(result.record_id || result.content_hash || result.anchored_at || result.tx_hash) && (
          <dl className="verify-result__meta">
            {result.record_id && (
              <>
                <dt>Record ID</dt>
                <dd><code>{result.record_id}</code></dd>
              </>
            )}
            {result.content_hash && (
              <>
                <dt>Content hash</dt>
                <dd><CopyableValue value={result.content_hash} label="hash" /></dd>
              </>
            )}
            {result.anchored_at && (
              <>
                <dt>Anchored at</dt>
                <dd>{formatDateTime(result.anchored_at)}</dd>
              </>
            )}
            {result.tx_hash && (
              <>
                <dt>Transaction</dt>
                <dd>
                  <CopyableValue value={result.tx_hash} label="tx hash" />
                  <SafeExternalLink
                    href={result.explorer_url}
                    className="verify-result__explorer"
                    explorer
                  >
                    View on explorer →
                  </SafeExternalLink>
                </dd>
              </>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
