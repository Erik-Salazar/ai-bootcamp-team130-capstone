import { Link } from "react-router-dom";

export default function DashboardHeader() {
  return (
    <header className="page-header page-header--accent">
      <div>
        <h2>Maintenance Records</h2>
      </div>
      <div className="page-header__actions">
        <Link to="/submit" className="btn btn-primary">Submit</Link>
      </div>
    </header>
  );
}
