// 🧩 Imports start from here
import "./setupPolyfills";
import "./polyfill";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// 🧠 React root rendering
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 📊 Optional: Performance metrics
reportWebVitals();
