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
        <h1>MaintNotary Lite</h1>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
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
