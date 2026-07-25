export default function VerifyHowItWorks() {
  return (
    <div className="verify-steps-wrap">
      <div className="verify-steps" aria-label="How verification works">
        <div className="verify-steps__item">
          <span className="verify-steps__num">1</span>
          <div>
            <strong>Open a receipt link</strong>
            <span>or paste the record JSON below</span>
          </div>
        </div>
        <div className="verify-steps__divider" aria-hidden="true" />
        <div className="verify-steps__item">
          <span className="verify-steps__num">2</span>
          <div>
            <strong>Check integrity</strong>
            <span>see if the data still matches its on-chain anchor</span>
          </div>
        </div>
      </div>
      <p className="verify-steps__tagline">
        Integrity, not truth — this proves the record was not altered after filing, not that the maintenance work itself is correct.
      </p>
    </div>
  );
}
