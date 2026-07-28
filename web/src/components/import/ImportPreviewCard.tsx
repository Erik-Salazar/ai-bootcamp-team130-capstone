import type { CanonicalPreview } from "../../lib/import/types";
import { formatCanonicalPreview } from "../../lib/import/map-webhook";
import CopyButton from "../CopyButton";

interface ImportPreviewCardProps {
  preview: CanonicalPreview;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

export default function ImportPreviewCard({
  preview,
  submitting,
  submitError,
  onSubmit,
}: ImportPreviewCardProps) {
  const json = formatCanonicalPreview(preview);

  return (
    <div className="import-card import-card--preview">
      <div className="import-card__header">
        <span className="import-card__header-icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
        Normalized record preview
      </div>

      <div className="import-card__body">
        <p className="import-card__hint">
          This is how the record will look after mapping. <code>source</code> is set server-side and excluded from the content hash (spec §8).
        </p>

        <pre className="import-preview-json"><code>{json}</code></pre>

        {submitError && (
          <div className="import-banner import-banner--error" role="alert">
            {submitError}
          </div>
        )}
      </div>

      <div className="import-card__footer">
        <CopyButton text={json} label="Copy preview" />
        <button
          type="button"
          className={`btn btn-primary btn-lg ${preview ? "btn-ready" : ""}`}
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting && <span className="spinner" />}
          {submitting ? "Importing…" : "Import record"}
        </button>
      </div>
    </div>
  );
}
