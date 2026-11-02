
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../app/AuthContext";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, accessLevel } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Verifying player account...</p>
      </div>
    );
  }

  if (status !== "authorized") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Non-active players may open only their profile.
  if (
    accessLevel === "profile_only" &&
    location.pathname !== "/profile"
  ) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default ProtectedRoute;
