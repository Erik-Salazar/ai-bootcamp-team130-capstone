import { Link } from "react-router-dom";

interface VerifyHeaderProps {
  showBackLink?: boolean;
}

export default function VerifyHeader({ showBackLink }: VerifyHeaderProps) {
  return (
    <header className="page-header page-header--accent">
      <div>
        <h2>Verify Maintenance Record</h2>
      </div>
      {showBackLink && (
        <div className="page-header__actions">
          <Link to="/verify" className="btn btn-secondary">New verification</Link>
        </div>
      )}
    </header>
  );
}
