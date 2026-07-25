export default function VerifyLoading() {
  return (
    <div className="verify-card verify-card--loading" role="status" aria-live="polite">
      <div className="verify-loading__inner">
        <div className="verify-loading__spinner" aria-hidden="true" />
        <p>Loading verification result…</p>
      </div>
    </div>
  );
}
