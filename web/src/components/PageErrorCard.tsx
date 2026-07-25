import { Link } from "react-router-dom";

interface PageErrorCardProps {
  title: string;
  message: string;
  backTo?: string;
  backLabel?: string;
}

export default function PageErrorCard({
  title,
  message,
  backTo = "/",
  backLabel = "Back to dashboard",
}: PageErrorCardProps) {
  return (
    <div className="page-error-card" role="alert">
      <div className="page-error-card__icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      <Link to={backTo} className="btn btn-secondary">{backLabel}</Link>
    </div>
  );
}
