import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App.jsx";
import { WatchlistProvider } from "./context/WatchlistContext.jsx";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is not configured. Authentication controls will not work until Clerk is configured.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <WatchlistProvider>
        <App />
      </WatchlistProvider>
    </ClerkProvider>
  </React.StrictMode>
);