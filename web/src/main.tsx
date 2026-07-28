import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "@trimble-oss/moduswebcomponents/modus-wc-styles.css";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/badges.css";
import "./styles/submit.css";
import "./styles/select.css";
import "./styles/datepicker.css";
import "./styles/dashboard.css";
import "./styles/verify.css";
import "./styles/record-detail.css";
import "./styles/import.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
