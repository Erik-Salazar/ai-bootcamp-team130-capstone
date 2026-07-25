export default function RecordDetailSkeleton() {
  return (
    <div className="record-detail-skeleton" aria-busy="true" aria-label="Loading record">
      <div className="record-detail-skeleton__card" />
      <div className="record-detail-skeleton__card record-detail-skeleton__card--short" />
      <div className="record-detail-skeleton__card record-detail-skeleton__card--tall" />
    </div>
  );
}
