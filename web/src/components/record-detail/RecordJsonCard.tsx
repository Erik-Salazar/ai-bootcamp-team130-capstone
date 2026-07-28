import type { ApiRecordDetail } from "../../api-client";
import { formatCanonicalJson } from "../../lib/record-detail/canonical";
import CopyButton from "../CopyButton";

interface RecordJsonCardProps {
  record: ApiRecordDetail;
}

export default function RecordJsonCard({ record }: RecordJsonCardProps) {
  const json = formatCanonicalJson(record);

  return (
    <section className="record-detail-card">
      <div className="record-detail-card__head">
        <h3 className="record-detail-card__title">Canonical record JSON</h3>
        <CopyButton text={json} label="Copy JSON" />
      </div>
      <p className="record-detail-json-hint">
        Read-only view of the canonical schema fields used for hashing (spec §8). The server strips
        <code> source</code> before computing the content hash.
      </p>
      <pre className="json-preview"><code>{json}</code></pre>
    </section>
  );
}
