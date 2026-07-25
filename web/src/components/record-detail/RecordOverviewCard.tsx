import type { ReactNode } from "react";
import type { ApiRecordDetail } from "../../api-client";
import { formatDateTime, formatOdometer } from "../../lib/format";

interface RecordOverviewCardProps {
  record: ApiRecordDetail;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="record-detail-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function RecordOverviewCard({ record }: RecordOverviewCardProps) {
  return (
    <section className="record-detail-card">
      <h3 className="record-detail-card__title">Maintenance data</h3>
      <dl className="record-detail-grid">
        <Field label="VIN"><code className="mono">{record.vin}</code></Field>
        <Field label="Equipment">{record.equipment_label || "—"}</Field>
        <Field label="Service type">{record.service_type}</Field>
        <Field label="Completed at">{formatDateTime(record.completed_at)}</Field>
        <Field label="Odometer">{formatOdometer(record.odometer_miles)}</Field>
        <Field label="Shop">{record.shop_name}</Field>
        <Field label="Source">{record.source}</Field>
        <Field label="Submitted at">{formatDateTime(record.created_at)}</Field>
        {record.notes && (
          <div className="record-detail-field record-detail-field--full">
            <dt>Notes</dt>
            <dd>{record.notes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
