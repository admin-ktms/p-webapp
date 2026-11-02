
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Trophy, LogIn } from "lucide-react";

import { useAuth } from "../app/AuthContext";

function LoginPage() {
  const {
    status,
    accessLevel,
    message,
    signIn,
    clearMessage
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect authenticated players.
  if (status === "authorized") {
    return (
      <Navigate
        to={accessLevel === "profile_only" ? "/profile" : "/"}
        replace
      />
    );
  }

  // Wait for session restoration or identity verification.
  if (status === "loading") {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Verifying player account...</p>
      </div>
    );
  }

  // Authenticate the player.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearMessage();
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch {
      // Keep unexpected authentication failures visible.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">
            <Trophy size={27} />
          </div>

          <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
          <h1>Welcome Back</h1>

          <p className="login-description">
            Sign in to access your player account.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {message && (
            <div className="login-error" role="alert">
              {message}
            </div>
          )}

          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearMessage();
            }}
            required
            disabled={submitting}
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearMessage();
            }}
            required
            disabled={submitting}
          />

          <button
            type="submit"
            disabled={submitting}
          >
            <LogIn size={18} />
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          Authorized player accounts only.
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
