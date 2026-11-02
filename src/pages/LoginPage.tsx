
import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, Trophy, LogIn, LoaderCircle, RefreshCw } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "../app/AuthContext";

export default function LoginPage() {
  const {
    status,
    accessLevel,
    message,
    signIn,
    clearMessage,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Show a fallback if the widget takes too long to render.
  useEffect(() => {
    if (captchaToken || captchaReady || captchaError) return;

    const timeout = window.setTimeout(() => {
      setCaptchaError(
        "Security verification is taking longer than expected. Please retry."
      );
    }, 20000);

    return () => window.clearTimeout(timeout);
  }, [captchaKey, captchaToken, captchaReady, captchaError]);

  // Redirect authenticated players to their permitted landing page.
  if (status === "authorized") {
    return (
      <Navigate
        to={accessLevel === "profile_only" ? "/profile" : "/"}
        replace
      />
    );
  }

  // Keep the login page hidden while the existing session is checked.
  if (status === "loading") {
    return (
      <main className="auth-loading">
        <LoaderCircle className="loading-spinner" size={30} />
        <p>Verifying player account...</p>
      </main>
    );
  }

  // Start a fresh CAPTCHA challenge.
  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaReady(false);
    setCaptchaError("");
    setCaptchaKey((current) => current + 1);
  }

  function handleCaptchaLoad() {
    setCaptchaReady(true);
    setCaptchaError("");
  }

  function handleCaptchaSuccess(token: string) {
    setCaptchaToken(token);
    setCaptchaError("");
  }

  function handleCaptchaExpire() {
    setCaptchaToken("");
    setCaptchaError("Verification expired. Please complete it again.");
  }

  function handleCaptchaError() {
    setCaptchaToken("");
    setCaptchaError(
      "Verification could not be completed. Check your connection and retry."
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!captchaToken || submitting) return;

    setSubmitting(true);
    clearMessage();

    try {
      await signIn(email.trim(), password, captchaToken);
    } finally {
      // CAPTCHA tokens are single-use. Require a fresh challenge.
      resetCaptcha();
      setSubmitting(false);
    }
  }

  // Require a configured public site key.
  if (!siteKey) {
    return (
      <main className="captcha-page">
        <section className="captcha-card">
          <ShieldCheck className="captcha-brand-icon" size={34} />
          <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
          <h1>Verification unavailable</h1>
          <p className="captcha-description">
            The security verification service is not configured. Please
            contact the platform administrator.
          </p>
        </section>
      </main>
    );
  }

  // Show CAPTCHA before exposing the login form.
  if (!captchaToken) {
    return (
      <main className="captcha-page">
        <section className="captcha-card">
          <div className="captcha-brand">
            <div className="captcha-brand-mark">
              <ShieldCheck size={25} />
            </div>
            <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
          </div>

          <h1>Security Verification</h1>
          <p className="captcha-description">
            Complete the security verification to continue to your player
            account.
          </p>

          <div className="captcha-status" aria-live="polite">
            {captchaError ? (
              <div className="captcha-error">
                <p>{captchaError}</p>
                <button
                  type="button"
                  className="captcha-retry"
                  onClick={resetCaptcha}
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : !captchaReady ? (
              <div className="captcha-loading">
                <LoaderCircle size={19} className="loading-spinner" />
                <span>Preparing security verification...</span>
              </div>
            ) : (
              <p className="captcha-ready">
                Verification is ready. Login page is being prepared, this might take a minute.
              </p>
            )}
          </div>

          <div className="captcha-widget">
            <Turnstile
              key={captchaKey}
              siteKey={siteKey}
              onWidgetLoad={handleCaptchaLoad}
              onSuccess={handleCaptchaSuccess}
              onExpire={handleCaptchaExpire}
              onError={handleCaptchaError}
              onUnsupported={handleCaptchaError}
              options={{
                theme: "dark",
                language: "en",
              }}
            />
          </div>

          <div className="captcha-footer">
            <ShieldCheck size={15} />
            <span>Protected by Cloudflare Turnstile</span>
          </div>
        </section>
      </main>
    );
  }

  // Render the login form only after CAPTCHA succeeds.
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">
            <Trophy size={27} />
          </div>
          <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
        </div>

        <h1>Welcome Back</h1>
        <p className="login-description">
          Sign in to access your player account and tournament activities.
        </p>

        {message && (
          <div className="login-error" role="alert">
            {message}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="player-email">Email address</label>
            <input
              id="player-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="player-password">Password</label>
            <input
              id="player-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? (
              <>
                <LoaderCircle size={18} className="loading-spinner" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={15} />
          <span>Secure player account access</span>
        </div>
      </section>
    </main>
  );
}
