import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";
import Verify from "./pages/Verify";
import RecordDetail from "./pages/RecordDetail";
import Import from "./pages/Import";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <svg className="app-logo" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 22V12M2 7l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h1>MaintNotary Lite</h1>
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/submit">Submit</NavLink>
          <NavLink to="/verify">Verify</NavLink>
          <NavLink to="/import">Import</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:id" element={<Verify />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </main>
    </div>
  );
}
