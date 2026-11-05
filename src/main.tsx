
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";
import { AuthProvider } from "./app/AuthContext";

// Tailwind entry point.
import "./styles/index.css";

// Global foundation.
import "./styles/base.css";

// Shared application layout.
import "./styles/layout.css";

// Accessibility rules.
import "./styles/accessibility.css";

// Page-specific styles.
import "./styles/pages/placeholder.css";
import "./styles/pages/login.css";
import "./styles/pages/register.css";
import "./styles/pages/tournament.css";
import "./styles/pages/profile.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
