
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, Trophy, LogIn } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

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

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaError, setCaptchaError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Redirect authenticated players.
  if (status === "authorized") {
    return (
      <Navigate
        to={accessLevel === "profile_only" ? "/profile" : "/"}
        replace
      />
    );
  }

  // Wait for session restoration and identity verification.
  if (status === "loading") {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Verifying player account...</p>
      </div>
    );
  }

  // Restart CAPTCHA verification.
  const resetCaptcha = () => {
    setCaptchaToken("");
    setCaptchaError("");
    setCaptchaKey((previous) => previous + 1);
  };

  // Accept a successful CAPTCHA verification.
  const handleCaptchaSuccess = (token: string) => {
    setCaptchaError("");
    setCaptchaToken(token);
  };

  // Handle CAPTCHA expiration.
  const handleCaptchaExpire = () => {
    resetCaptcha();
  };

  // Handle CAPTCHA errors.
  const handleCaptchaError = () => {
    setCaptchaToken("");
    setCaptchaError(
      "Verification failed. Please try again."
    );
  };

  // Authenticate using the verified CAPTCHA token.
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!captchaToken || submitting) {
      return;
    }

    clearMessage();
    setSubmitting(true);

    try {
      await signIn(email, password, captchaToken);
    } catch {
      // Supabase errors are reported through AuthContext.
    } finally {
      // Require a fresh token after every login attempt.
      resetCaptcha();
      setSubmitting(false);
    }
  };

  // Show CAPTCHA before displaying the login form.
  if (!captchaToken) {
    return (
      <main className="captcha-page">
        <section className="captcha-card">
          <div className="login-brand-mark">
            <ShieldCheck size={27} />
          </div>

          <p className="login-eyebrow">
            KICKOFF PLAYER ARENA
          </p>

          <h1>Security Verification</h1>

          <p className="login-description">
            Complete the security verification to continue
            to your player account.
          </p>

          {message && (
            <div className="login-error" role="alert">
              {message}
            </div>
          )}

          {captchaError && (
            <div className="login-error" role="alert">
              {captchaError}
            </div>
          )}

          {siteKey ? (
            <div className="captcha-widget">
              <Turnstile
                key={captchaKey}
                siteKey={siteKey}
                onSuccess={handleCaptchaSuccess}
                onExpire={handleCaptchaExpire}
                onError={handleCaptchaError}
              />
            </div>
          ) : (
            <div className="login-error" role="alert">
              CAPTCHA configuration is missing.
            </div>
          )}

          {captchaError && siteKey && (
            <button
              type="button"
              className="captcha-retry"
              onClick={resetCaptcha}
            >
              Try verification again
            </button>
          )}

          <p className="login-footer">
            Protected by Cloudflare Turnstile.
          </p>
        </section>
      </main>
    );
  }

  // Display the normal login screen after verification.
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">
            <Trophy size={27} />
          </div>

          <p className="login-eyebrow">
            KICKOFF PLAYER ARENA
          </p>

          <h1>Welcome Back</h1>

          <p className="login-description">
            Sign in to access your player account.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          {message && (
            <div className="login-error" role="alert">
              {message}
            </div>
          )}

          <label htmlFor="email">
            Email address
          </label>

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

          <label htmlFor="password">
            Password
          </label>

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
