import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { WatchlistProvider } from "./context/WatchlistContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WatchlistProvider>
      <App />
    </WatchlistProvider>
  </React.StrictMode>
);