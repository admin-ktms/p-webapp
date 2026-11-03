
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ShieldCheck,
  Trophy,
  LogIn,
  LoaderCircle,
  RefreshCw,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "../app/AuthContext";
import { requestPlayerPasswordReset } from "../services/auth.service";

type LoginMode = "login" | "reset";

export default function LoginPage() {
  const {
    status,
    accessLevel,
    message,
    signIn,
    clearMessage
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [mode, setMode] = useState<LoginMode>("login");
  const [resetRequested, setResetRequested] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Detect a CAPTCHA widget that takes too long to load.
  useEffect(() => {
    if (
      captchaToken ||
      captchaReady ||
      captchaError ||
      resetRequested
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCaptchaError(
        "Security verification is taking longer than expected. Please retry."
      );
    }, 20000);

    return () => window.clearTimeout(timeout);
  }, [
    captchaKey,
    captchaToken,
    captchaReady,
    captchaError,
    resetRequested
  ]);

  // Redirect authenticated players.
  if (status === "authorized") {
    return (
      <Navigate
        to={accessLevel === "profile_only" ? "/profile" : "/"}
        replace
      />
    );
  }

  // Continue incomplete registrations.
  if (status === "registration_pending") {
    return <Navigate to="/register" replace />;
  }
  
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

  // Return to login and require fresh verification.
  function handleBackToLogin() {
    setMode("login");
    setResetRequested(false);
    setResetError("");
    setPassword("");
    clearMessage();
    resetCaptcha();
  }

  // Request a password-reset email.
  async function handlePasswordReset(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!captchaToken || resetSubmitting) return;

    setResetSubmitting(true);
    setResetError("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await requestPlayerPasswordReset(
        email.trim(),
        captchaToken,
        redirectTo
      );

      if (error) {
        setResetError(error.message);
        return;
      }

      setResetRequested(true);
    } catch {
      setResetError(
        "Could not request a password reset. Please retry."
      );
    } finally {
      // CAPTCHA tokens are single-use.
      resetCaptcha();
      setResetSubmitting(false);
    }
  }

  // Authenticate the player.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!captchaToken || submitting) return;

    setSubmitting(true);
    clearMessage();

    try {
      await signIn(email.trim(), password, captchaToken);
    } finally {
      resetCaptcha();
      setSubmitting(false);
    }
  }

  // Require a configured public site key.
  if (!siteKey) {
    return (
      <main className="captcha-page">
        <section className="captcha-card">
          <ShieldCheck size={34} />
          <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
          <h1>Verification unavailable</h1>
          <p className="captcha-description">
            Security verification is not configured. Contact the
            platform administrator.
          </p>
        </section>
      </main>
    );
  }

  // Confirm that a reset email was requested.
  if (resetRequested) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand-mark">
            <CheckCircle2 size={28} />
          </div>

          <h1>Check your email</h1>

          <p className="login-description">
            If an account exists for this email address, a password
            reset link has been sent. Follow the link to choose a
            new password.
          </p>

          <button
            type="button"
            className="login-submit"
            onClick={handleBackToLogin}
          >
            <ArrowLeft size={18} />
            Back to sign in
          </button>

          <div className="login-footer">
            <ShieldCheck size={15} />
            <span>Secure player account access</span>
          </div>
        </section>
      </main>
    );
  }

  // CAPTCHA must be completed before login or reset operations.
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
            Complete the security verification to continue to your
            player account.
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
                Verification is ready. Complete the check below.
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
                language: "en"
              }}
            />
          </div>
          
          <Link to="/register" className="login-signup-link">
            New player? <span>Create an account</span>
          </Link>
          
          <div className="captcha-footer">
            <ShieldCheck size={15} />
            <span>Protected by Cloudflare Turnstile</span>
          </div>
        </section>
      </main>
    );
  }

  // Show the password-reset request form.
  if (mode === "reset") {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <div className="login-brand-mark">
              <Mail size={27} />
            </div>
            <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
          </div>

          <h1>Reset Password</h1>

          <p className="login-description">
            Enter the email address linked to your player account.
            We will send you a secure password-reset link.
          </p>

          {resetError && (
            <div className="login-error" role="alert">
              {resetError}
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handlePasswordReset}
          >
            <div className="login-field">
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                required
                disabled={resetSubmitting}
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={resetSubmitting || !email.trim()}
            >
              {resetSubmitting ? (
                <>
                  <LoaderCircle size={18} className="loading-spinner" />
                  Sending reset link...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send reset link
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            className="login-text-button"
            onClick={handleBackToLogin}
          >
            <ArrowLeft size={15} />
            Back to sign in
          </button>

          <div className="login-footer">
            <ShieldCheck size={15} />
            <span>Secure player account access</span>
          </div>
        </section>
      </main>
    );
  }

  // Render the normal login form.
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
              placeholder="Enter your email address"
              autoComplete="email"
              required
              disabled={submitting}
            />
          </div>
          <div className="login-field">
            <label htmlFor="player-password">Password</label>
          
            <div className="password-input-wrapper">
              <input
                id="player-password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={submitting}
              />
          
              <button
                type="button"
                className="password-visibility-toggle"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={passwordVisible}
                disabled={submitting}
              >
                {passwordVisible ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
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

        <button
          type="button"
          className="login-text-button"
          onClick={() => {
            setMode("reset");
            setResetError("");
            clearMessage();
          }}
        >
          Forgot password?
        </button>

        <Link to="/register" className="login-signup-link">
          New player? <span>Create an account</span>
        </Link>
        
        <div className="login-footer">
          <ShieldCheck size={15} />
          <span>Secure player account access</span>
        </div>
      </section>
    </main>
  );
}
