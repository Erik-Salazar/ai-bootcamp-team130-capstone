import { useRef } from "react";
import { EXAMPLE_WEBHOOK } from "./ImportHeader";

interface ImportWebhookPanelProps {
  jsonText: string;
  error: string | null;
  canPreview: boolean;
  onJsonChange: (value: string) => void;
  onFileUpload: (file: File) => void;
  onClear: () => void;
}

export default function ImportWebhookPanel({
  jsonText,
  error,
  canPreview,
  onJsonChange,
  onFileUpload,
  onClear,
}: ImportWebhookPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="import-card">
      <div className="import-card__header">
        <span className="import-card__header-icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </span>
        Mock webhook payload
      </div>

      <div className="import-card__body">
        <p className="import-card__hint">
          Simulates an FMS <code>work_order.completed</code> event (spec §10). The API maps this to the canonical schema before validation.
        </p>

        <textarea
          id="import-webhook-json"
          className="import-card__textarea"
          rows={14}
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          placeholder={EXAMPLE_WEBHOOK}
          spellCheck={false}
        />

        {error && <p className="import-card__error" role="alert">{error}</p>}
        {canPreview && !error && (
          <p className="import-card__ok" role="status">Payload looks valid — review the preview below before importing.</p>
        )}
      </div>

      <div className="import-card__footer">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="import-card__file-input"
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
      </div>
    </div>
  );
}
