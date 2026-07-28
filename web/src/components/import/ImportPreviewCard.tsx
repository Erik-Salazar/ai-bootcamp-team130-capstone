import type { ApiValidationError } from "../../api-client";
import type { CanonicalPreview } from "../../lib/import/types";
import { formatCanonicalPreview } from "../../lib/import/map-webhook";
import { formatValidationErrors } from "../../lib/validation/format-errors";
import PageBanner from "../PageBanner";
import CopyButton from "../CopyButton";

interface ImportPreviewCardProps {
  preview: CanonicalPreview;
  validationErrors: ApiValidationError[];
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

export default function ImportPreviewCard({
  preview,
  validationErrors,
  submitting,
  submitError,
  onSubmit,
}: ImportPreviewCardProps) {
  const json = formatCanonicalPreview(preview);
  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className="verify-card">
      <div className="verify-card__header">
        <span className="verify-card__header-icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
        Normalized preview
      </div>

      <div className="verify-card__body">
        <p className="verify-card__hint">
          Canonical fields after mapping. <code>source</code> is set server-side and excluded from the content hash.
        </p>

        <pre className="json-preview"><code>{json}</code></pre>

        {hasValidationErrors && (
          <p className="field-feedback field-feedback--error" role="alert">
            {formatValidationErrors(validationErrors)}
          </p>
        )}

        {submitError && <PageBanner type="error">{submitError}</PageBanner>}
      </div>

      <div className="verify-card__footer">
        <CopyButton text={json} label="Copy preview" />
        <button
          type="button"
          className={`btn btn-primary btn-lg ${!hasValidationErrors ? "btn-ready" : ""}`}
          disabled={submitting || hasValidationErrors}
          onClick={onSubmit}
        >
          {submitting && <span className="spinner" />}
          {submitting ? "Importing…" : "Import record"}
        </button>
      </div>
    </div>
  );
}
