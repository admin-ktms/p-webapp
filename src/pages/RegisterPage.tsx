
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { useAuth } from "../app/AuthContext";
import { supabase } from "../lib/supabase";

import {
  signUpPlayer,
  resendPlayerConfirmation,
  checkUsernameAvailability,
  saveRegistrationDraft,
  getRegistrationDraft,
  finalizePlayerRegistration,
  type RegistrationDraft
} from "../services/auth.service";

type RegistrationStep = "details" | "squad" | "review";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { status, accessLevel } = useAuth();

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Auth signup fields.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Registration draft fields.
  const [username, setUsername] = useState("");
  const [managerName, setManagerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [squadName, setSquadName] = useState("");

  const [step, setStep] = useState<RegistrationStep>("details");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] =
    useState(false);

  // Username availability state.
  const [usernameAvailable, setUsernameAvailable] =
    useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // CAPTCHA state.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(false);

  // Submission and feedback.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load the existing draft after email confirmation.
  useEffect(() => {
    if (status !== "registration_pending") return;

    let cancelled = false;

    async function loadDraft() {
      try {
        const draft = await getRegistrationDraft();

        if (cancelled || !draft) return;

        if (draft.result_code === "DRAFT_FOUND") {
          setUsername(draft.username ?? "");
          setManagerName(draft.manager_name ?? "");
          setWhatsappNumber(draft.whatsapp_number ?? "");
          setDateOfBirth(draft.date_of_birth ?? "");
          setSquadName(draft.squad_name ?? "");

          // Resume at the first incomplete stage.
          setStep(draft.squad_name ? "review" : "squad");
        } else if (draft.result_code === "DRAFT_EXPIRED") {
          setNotice(
            "Your previous registration draft expired. Please create a new draft."
          );
        } else if (
          draft.result_code === "ACCOUNT_ALREADY_LINKED"
        ) {
          await supabase.auth.signOut({ scope: "local" });
          navigate("/login", { replace: true });
        } else if (
          draft.result_code !== "DRAFT_NOT_FOUND"
        ) {
          setError(draft.result_code);
        }
      } catch {
        if (!cancelled) {
          setError("Could not retrieve your registration draft.");
        }
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [status, navigate]);

  // Check username availability while the player types.
  useEffect(() => {
    if (
      status !== "registration_pending" ||
      !/^[A-Za-z0-9_]{4,20}$/.test(username)
    ) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setUsernameChecking(true);

      try {
        const result = await checkUsernameAvailability(username);

        if (!cancelled) {
          setUsernameAvailable(
            result?.result_code === "USERNAME_AVAILABLE" &&
              result?.available === true
          );
        }
      } catch {
        if (!cancelled) {
          setUsernameAvailable(null);
        }
      } finally {
        if (!cancelled) setUsernameChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [username, status]);

  // Redirect an existing player away from registration.
  if (status === "authorized") {
    return (
      <Navigate
        to={accessLevel === "profile_only" ? "/profile" : "/"}
        replace
      />
    );
  }

  if (status === "loading") {
    return (
      <main className="registration-loading">
        <LoaderCircle className="loading-spinner" size={28} />
        <p>Checking your account...</p>
      </main>
    );
  }

  if (!siteKey) {
    return (
      <main className="registration-page">
        <section className="registration-card">
          <h1>Registration unavailable</h1>
          <p>Security verification is not configured.</p>
        </section>
      </main>
    );
  }

  // Reset single-use CAPTCHA tokens after each request.
  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaReady(false);
    setCaptchaKey((current) => current + 1);
  }

  // Create the Supabase Auth account.
  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !captchaToken) return;

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const { data, error: signupError } = await signUpPlayer(
        email,
        password,
        captchaToken
      );

      if (signupError) {
        setError(
          "Account creation could not be completed. If you already have an account, sign in or request a confirmation email."
        );
        return;
      }

      if (data.session) {
        // AuthContext will recognize the unlinked registration session.
        setNotice("Your account is ready. Continue with registration.");
      } else {
        setEmailConfirmationSent(true);
        setNotice(
          "Check your email and confirm your address before continuing."
        );
      }
    } catch {
      setError("Account creation failed. Please retry.");
    } finally {
      resetCaptcha();
      setSubmitting(false);
    }
  }

  // Resend the signup confirmation email.
  async function handleResendConfirmation() {
    if (!captchaToken || submitting) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const { error: resendError } = await resendPlayerConfirmation(
        email,
        captchaToken
      );

      if (resendError) {
        setError(
          "The confirmation email could not be resent. You may already have a confirmed account; try signing in."
        );
      } else {
        setNotice(
          "If confirmation is still required, a new email has been sent."
        );
      }
    } catch {
      setError("Could not resend the confirmation email.");
    } finally {
      resetCaptcha();
      setSubmitting(false);
    }
  }

  // Save the player information and reserve the username.
  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || usernameAvailable !== true) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await saveRegistrationDraft({
        username: username.trim(),
        managerName: managerName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        dateOfBirth,
        squadName: null
      });

      if (!result?.success) {
        setError(result?.result_code ?? "DRAFT_SAVE_FAILED");
        return;
      }

      setStep("squad");
      setNotice("Your details and username reservation have been saved.");
    } catch {
      setError("Could not save your registration details.");
    } finally {
      setSubmitting(false);
    }
  }

  // Save the initial squad name.
  async function handleSaveSquad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !squadName.trim()) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await saveRegistrationDraft({
        username,
        managerName,
        whatsappNumber,
        dateOfBirth,
        squadName: squadName.trim()
      });

      if (!result?.success) {
        setError(result?.result_code ?? "DRAFT_SAVE_FAILED");
        return;
      }

      setStep("review");
      setNotice("Your squad name has been saved.");
    } catch {
      setError("Could not save your squad name.");
    } finally {
      setSubmitting(false);
    }
  }

  // Finalize the permanent player identity and initial squad.
  async function handleFinalize() {
    if (submitting) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await finalizePlayerRegistration();

      if (!result) {
        setError("Registration could not be completed.");
        return;
      }

      if (result.result_code === "ACCOUNT_ALREADY_LINKED") {
        // A previous attempt may already have completed.
        await supabase.auth.signOut({ scope: "local" });
        navigate("/login", { replace: true });
        return;
      }

      if (
        !result.success ||
        result.result_code !== "PLAYER_REGISTRATION_COMPLETED"
      ) {
        setError(result.result_code);
        return;
      }

      // Reload so AuthContext resolves the newly created identity.
      window.location.assign("/");
    } catch {
      setError(
        "Registration could not be completed. Your draft has been retained; please retry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Render the Auth signup and confirmation stage.
  if (status === "anonymous") {
    return (
      <main className="registration-page">
        <section className="registration-card">
          <div className="registration-brand">
            <ShieldCheck size={28} />
            <span>KICKOFF PLAYER ARENA</span>
          </div>

          <h1>Create your player account</h1>
          <p className="registration-description">
            Create your login credentials. You must confirm your
            email before entering your player details.
          </p>

          {error && <div className="registration-error">{error}</div>}
          {notice && <div className="registration-notice">{notice}</div>}

          {!emailConfirmationSent ? (
            <form onSubmit={handleSignup} className="registration-form">
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitting}
                />
              </label>

              <label>
                Confirm password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitting}
                />
              </label>

              <Captcha
                siteKey={siteKey}
                captchaKey={captchaKey}
                onReady={() => setCaptchaReady(true)}
                onSuccess={setCaptchaToken}
                onReset={resetCaptcha}
              />

              <button
                className="registration-submit"
                type="submit"
                disabled={submitting || !captchaToken}
              >
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          ) : (
            <>
              <div className="registration-confirmation">
                <h2>Confirm your email</h2>
                <p>
                  Open the confirmation link sent to <strong>{email}</strong>.
                  You will return here to continue registration.
                </p>
              </div>

              <Captcha
                siteKey={siteKey}
                captchaKey={captchaKey}
                onReady={() => setCaptchaReady(true)}
                onSuccess={setCaptchaToken}
                onReset={resetCaptcha}
              />

              <button
                className="registration-submit"
                type="button"
                disabled={submitting || !captchaToken}
                onClick={handleResendConfirmation}
              >
                {submitting ? "Sending..." : "Resend confirmation"}
              </button>
            </>
          )}

          <p className="registration-footer">
            Already registered? <a href="/login">Sign in</a>
          </p>
        </section>
      </main>
    );
  }

  // Only confirmed, unlinked Auth users can access draft operations.
  if (status !== "registration_pending") {
    return <Navigate to="/login" replace />;
  }

  if (!draftLoaded) {
    return (
      <main className="registration-loading">
        <LoaderCircle className="loading-spinner" size={28} />
        <p>Restoring your registration...</p>
      </main>
    );
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <div className="registration-brand">
          <UserPlus size={28} />
          <span>KICKOFF PLAYER ARENA</span>
        </div>

        <h1>Player registration</h1>

        <p className="registration-description">
          Complete your player details to create your KickOff account.
        </p>

        {error && <div className="registration-error">{error}</div>}
        {notice && <div className="registration-notice">{notice}</div>}

        {step === "details" && (
          <form onSubmit={handleSaveDetails} className="registration-form">
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={4}
                maxLength={20}
                pattern="[A-Za-z0-9_]{4,20}"
                autoComplete="username"
                required
              />
              <small>
                {usernameChecking
                  ? "Checking availability..."
                  : usernameAvailable === true
                    ? "Username available"
                    : usernameAvailable === false
                      ? "Username is unavailable"
                      : "4–20 letters, numbers or underscores"}
              </small>
            </label>

            <label>
              Manager name
              <input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>

            <label>
              WhatsApp number
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                autoComplete="tel"
                required
              />
            </label>

            <label>
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                required
              />
              <small>Players must be at least 18 years old.</small>
            </label>

            <button
              className="registration-submit"
              type="submit"
              disabled={
                submitting ||
                usernameAvailable !== true ||
                usernameChecking
              }
            >
              {submitting ? "Saving details..." : "Save and continue"}
            </button>
          </form>
        )}

        {step === "squad" && (
          <form onSubmit={handleSaveSquad} className="registration-form">
            <label>
              Initial squad name
              <input
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                maxLength={60}
                required
              />
            </label>

            <button
              className="registration-submit"
              type="submit"
              disabled={submitting || !squadName.trim()}
            >
              {submitting ? "Saving squad..." : "Save and review"}
            </button>

            <button
              className="registration-secondary"
              type="button"
              onClick={() => setStep("details")}
            >
              Back to player details
            </button>
          </form>
        )}

        {step === "review" && (
          <div className="registration-review">
            <h2>Review your details</h2>

            <ReviewRow label="Username" value={username} />
            <ReviewRow label="Manager name" value={managerName} />
            <ReviewRow label="WhatsApp" value={whatsappNumber} />
            <ReviewRow label="Date of birth" value={dateOfBirth} />
            <ReviewRow label="Initial squad" value={squadName} />

            <p className="registration-description">
              Confirm to create your permanent player identity and
              initial squad.
            </p>

            <button
              className="registration-submit"
              type="button"
              disabled={submitting}
              onClick={handleFinalize}
            >
              {submitting ? "Completing registration..." : "Complete registration"}
            </button>

            <button
              className="registration-secondary"
              type="button"
              onClick={() => setStep("squad")}
            >
              Back to squad name
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

// Keep the CAPTCHA widget isolated from registration form state.
function Captcha({
  siteKey,
  captchaKey,
  onReady,
  onSuccess,
  onReset
}: {
  siteKey: string;
  captchaKey: number;
  onReady: () => void;
  onSuccess: (token: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="registration-captcha">
      <Turnstile
        key={captchaKey}
        siteKey={siteKey}
        onWidgetLoad={onReady}
        onSuccess={onSuccess}
        onExpire={onReset}
        onError={onReset}
        onUnsupported={onReset}
        options={{ theme: "dark", language: "en" }}
      />
    </div>
  );
}

// Display one review field.
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="registration-review-row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
