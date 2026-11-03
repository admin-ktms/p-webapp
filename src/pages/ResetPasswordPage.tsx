
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { updatePlayerPassword } from "../services/auth.service";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Detect the recovery session created by the email link.
  useEffect(() => {
    let active = true;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      setHasSession(Boolean(data.session));

      if (error) {
        setErrorMessage("Could not verify the password-reset session.");
      }

      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Validate and save the new password.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const { error } = await updatePlayerPassword(password);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setComplete(true);
    } catch {
      setErrorMessage("Password update failed. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="auth-loading">
        <LoaderCircle size={30} className="loading-spinner" />
        <p>Verifying password-reset link...</p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand-mark">
            <ShieldCheck size={27} />
          </div>

          <h1>Reset link unavailable</h1>

          <p className="login-description">
            This password-reset link is invalid or has expired.
            Return to sign in and request another link.
          </p>

          <Link to="/login" className="login-submit">
            Return to sign in
          </Link>
        </section>
      </main>
    );
  }

  if (complete) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand-mark">
            <CheckCircle2 size={27} />
          </div>

          <h1>Password updated</h1>

          <p className="login-description">
            Your password has been changed successfully.
            Continue to your player account.
          </p>

          <button
            type="button"
            className="login-submit"
            onClick={() => navigate("/login", { replace: true })}
          >
            Continue
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">
            <KeyRound size={27} />
          </div>

          <p className="login-eyebrow">KICKOFF PLAYER ARENA</p>
        </div>

        <h1>Choose a new password</h1>

        <p className="login-description">
          Enter your new password and confirm it below.
        </p>

        {errorMessage && (
          <div className="login-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Enter new password"
              required
              disabled={saving}
            />
          </div>

          <div className="login-field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Confirm new password"
              required
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={saving || !password || !confirmPassword}
          >
            {saving ? (
              <>
                <LoaderCircle size={18} className="loading-spinner" />
                Updating password...
              </>
            ) : (
              <>
                <KeyRound size={18} />
                Update password
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
