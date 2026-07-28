import { useRef } from "react";

const EXAMPLE_JSON = `{
  "schema_version": "1.0",
  "record_id": "wo-2026-0042",
  "vin": "1M8GDM9AXKP042788",
  "service_type": "PM-A",
  "completed_at": "2026-07-08T14:22:00Z",
  "odometer_miles": 142318,
  "shop_name": "In-house shop"
}`;

interface VerifyJsonPanelProps {
  jsonText: string;
  error: string | null;
  submitting: boolean;
  onJsonChange: (value: string) => void;
  onFileUpload: (file: File) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export default function VerifyJsonPanel({
  jsonText,
  error,
  submitting,
  onJsonChange,
  onFileUpload,
  onSubmit,
  onClear,
}: VerifyJsonPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="verify-card">
      <div className="verify-card__header">
        <span className="verify-card__header-icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
        Verify by JSON
      </div>

      <div className="verify-card__body">
        <p className="verify-card__hint">
          Paste a canonical maintenance record or upload a <code>.json</code> file.
        </p>

        <textarea
          id="verify-json"
          className="json-editor"
          rows={12}
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          placeholder={EXAMPLE_JSON}
          spellCheck={false}
        />

        {error && <p className="field-feedback field-feedback--error" role="alert">{error}</p>}
      </div>

      <div className="verify-card__footer">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="json-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileUpload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload JSON
        </button>
        {jsonText && (
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            Clear
          </button>
        )}
        <button
          type="button"
          className={`btn btn-primary btn-lg ${jsonText.trim() ? "btn-ready" : ""}`}
          disabled={submitting || !jsonText.trim()}
          onClick={onSubmit}
        >
          {submitting && <span className="spinner" />}
          {submitting ? "Verifying…" : "Verify JSON"}
        </button>
      </div>
    </div>
  );
}
