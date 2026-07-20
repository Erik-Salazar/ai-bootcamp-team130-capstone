function PreviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="preview-row">
      <span className="preview-label">{label}</span>
      <span className={`preview-value ${mono ? "mono" : ""} ${value ? "" : "preview-empty"}`}>
        {value || "—"}
      </span>
    </div>
  );
}

interface PreviewSidebarProps {
  formData: {
    record_id: string;
    vin: string;
    equipment_label: string;
    service_type: string;
    completed_at: string;
    odometer_miles: string;
    shop_name: string;
  };
  filledRequired: number;
  totalRequired: number;
}

export default function PreviewSidebar({ formData, filledRequired, totalRequired }: PreviewSidebarProps) {
  return (
    <aside className="submit-sidebar">
      <div className="sidebar-card">
        <h3>Record Preview</h3>
        <div className="preview-fields">
          <PreviewRow label="Record ID" value={formData.record_id} />
          <PreviewRow label="VIN" value={formData.vin.toUpperCase()} mono />
          <PreviewRow label="Equipment" value={formData.equipment_label} />
          <PreviewRow label="Service" value={formData.service_type} />
          <PreviewRow label="Completed" value={formData.completed_at ? new Date(formData.completed_at).toLocaleString() : ""} />
          <PreviewRow label="Odometer" value={formData.odometer_miles ? `${Number(formData.odometer_miles).toLocaleString()} mi` : ""} />
          <PreviewRow label="Shop" value={formData.shop_name} />
        </div>
        <div className="preview-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(filledRequired / totalRequired) * 100}%` }} />
          </div>
          <span className="progress-text">{filledRequired} of {totalRequired} required fields</span>
        </div>
      </div>

      <div className="sidebar-card sidebar-card--info">
        <h3>What happens next?</h3>
        <ol className="info-steps">
          <li><strong>Validation</strong> — record is checked against rules (VIN format, mileage, dates)</li>
          <li><strong>Hashing</strong> — a SHA-256 fingerprint of the canonical record is created</li>
          <li><strong>Anchoring</strong> — the hash is stored on Base Sepolia blockchain</li>
          <li><strong>Verification</strong> — anyone with the link can prove integrity</li>
        </ol>
      </div>
    </aside>
  );
}
