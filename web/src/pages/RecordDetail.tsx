import RecordDetailHeader from "../components/record-detail/RecordDetailHeader";
import RecordDetailSkeleton from "../components/record-detail/RecordDetailSkeleton";
import RecordIntegrityCard from "../components/record-detail/RecordIntegrityCard";
import RecordJsonCard from "../components/record-detail/RecordJsonCard";
import RecordOverviewCard from "../components/record-detail/RecordOverviewCard";
import PageErrorCard from "../components/PageErrorCard";
import { useRecordDetail } from "../hooks/useRecordDetail";

export default function RecordDetail() {
  const {
    record,
    loading,
    loadError,
    retrying,
    retryMessage,
    retryAnchor,
  } = useRecordDetail();

  const showSkeleton = loading && !record && !loadError;

  return (
    <section className="record-detail-page">
      {showSkeleton && (
        <>
          <header className="page-header page-header--accent">
            <div><h2>Record Detail</h2></div>
          </header>
          <RecordDetailSkeleton />
        </>
      )}

      {!showSkeleton && loadError && !record && (
        <>
          <header className="page-header page-header--accent">
            <div><h2>Record Detail</h2></div>
          </header>
          <PageErrorCard title="Unable to load record" message={loadError} />
        </>
      )}

      {record && (
        <>
          <RecordDetailHeader
            record={record}
            retrying={retrying}
            onRetry={retryAnchor}
          />

          {retryMessage && (
            <div
              className={`record-detail-banner record-detail-banner--${retryMessage.type}`}
              role="status"
            >
              {retryMessage.text}
            </div>
          )}

          <div className="record-detail-stack">
            <RecordOverviewCard record={record} />
            <RecordIntegrityCard record={record} />
            <RecordJsonCard record={record} />
          </div>
        </>
      )}
    </section>
  );
}
