interface SubmitFormActionsProps {
  submitting: boolean;
  filledRequired: number;
  totalRequired: number;
  allRequiredFilled: boolean;
}

export default function SubmitFormActions({
  submitting,
  filledRequired,
  totalRequired,
  allRequiredFilled,
}: SubmitFormActionsProps) {
  return (
    <div className="form-actions">
      <button
        type="submit"
        className={`btn btn-primary btn-lg ${allRequiredFilled ? "btn-ready" : ""}`}
        disabled={submitting}
      >
        {submitting && <span className="spinner" />}
        {submitting ? "Submitting…" : "Submit"}
      </button>
      {!allRequiredFilled && (
        <span className="fields-remaining">{filledRequired}/{totalRequired} required</span>
      )}
      {allRequiredFilled && !submitting && (
        <span className="fields-complete">Ready to submit</span>
      )}
    </div>
  );
}
