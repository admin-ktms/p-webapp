
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LoaderCircle,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { useAuth } from "../app/AuthContext";

import {
  signUpPlayer,
  resendPlayerConfirmation,
  checkUsernameAvailability,
  saveRegistrationDraft,
  getRegistrationDraft,
  finalizePlayerRegistration,
  signOutPlayer
} from "../services/auth.service";

type RegistrationStep = "details" | "squad" | "review";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{4,20}$/;


// Calculate the latest permitted date for an adult player.
function getAdultDateLimit(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convert backend result codes into useful messages.
function getRegistrationMessage(code: string): string {
  const messages: Record<string, string> = {
    AUTHENTICATION_REQUIRED: "Please sign in before continuing.",
    EMAIL_VERIFICATION_REQUIRED: "Confirm your email before continuing.",
    ACCOUNT_ALREADY_LINKED: "This account is already linked to a player.",
    ACCOUNT_LINK_DISABLED: "This account link is disabled. Contact support.",
    DRAFT_NOT_FOUND: "No saved registration was found.",
    DRAFT_EXPIRED: "Your previous registration draft has expired.",
    INVALID_USERNAME: "Enter a valid username using 4–20 letters, numbers or underscores.",
    USERNAME_TAKEN: "That username is already reserved or in use.",
    MANAGER_NAME_REQUIRED: "Enter your manager name.",
    WHATSAPP_NUMBER_REQUIRED: "Enter your WhatsApp number.",
    INVALID_DATE_OF_BIRTH: "Enter a valid date of birth.",
    MINIMUM_AGE_NOT_MET: "Players must be at least 18 years old.",
    INVALID_SQUAD_NAME: "Enter a valid squad name.",
    SQUAD_NAME_REQUIRED: "Enter your initial squad name.",
    PLAYER_REGISTRATION_COMPLETED: "Your player registration is complete.",
    
    // Existing player records.
    EXISTING_PLAYER_EMAIL:
      "This email address is registered. Sign in.",

    WHATSAPP_NUMBER_ALREADY_REGISTERED:
      "This WhatsApp number registered. Enter a different number or contact support.",

    // Registration conflicts.
    REGISTRATION_CONFLICT:
      "Some registration information conflicts with an existing record. Check your details and try again.",

    PLAYER_REGISTRATION_FAILED:
      "Your player record could not be created. Your saved registration has been retained. Please retry or contact support.",

    ACCOUNT_NOT_ELIGIBLE:
      "This account cannot be used to create a player identity. Contact support."

  };

  return messages[code] ?? "The operation could not be completed. Please retry.";
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const { status, accessLevel, session } = useAuth();

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const email = session?.user.email ?? "";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Auth signup fields.
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Registration draft fields.
  const [username, setUsername] = useState("");
  const [managerName, setManagerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [squadName, setSquadName] = useState("");

  // Registration progress.
  const [step, setStep] = useState<RegistrationStep>("details");
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Email confirmation.
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // Username availability.
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState("");

  // CAPTCHA.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  // Submission and feedback.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Restore the current user's saved registration draft.
  useEffect(() => {
    if (status !== "registration_pending") return;

    let cancelled = false;

    async function loadDraft() {
      setDraftLoaded(false);
      setError("");

      try {
        const draft = await getRegistrationDraft();

        if (cancelled) return;

        if (!draft) {
          setError("Could not retrieve your registration draft.");
          return;
        }

        switch (draft.result_code) {
          case "DRAFT_FOUND": {
            setUsername(draft.username ?? "");
            setManagerName(draft.manager_name ?? "");
            setWhatsappNumber(draft.whatsapp_number ?? "");
            setDateOfBirth(draft.date_of_birth ?? "");
            setSquadName(draft.squad_name ?? "");

            // Continue from the first incomplete stage.
            setStep(draft.squad_name ? "review" : "squad");
            break;
          }

          case "DRAFT_NOT_FOUND": {
            setStep("details");
            break;
          }

          case "DRAFT_EXPIRED": {
            setStep("details");
            setUsername("");
            setManagerName("");
            setWhatsappNumber("");
            setDateOfBirth("");
            setSquadName("");
            setNotice(
              "Your previous registration draft expired. Start a new registration to continue."
            );
            break;
          }

          case "ACCOUNT_ALREADY_LINKED": {
            await signOutPlayer();
            navigate("/login", { replace: true });
            return;
          }

          case "ACCOUNT_LINK_DISABLED": {
            await signOutPlayer();
            navigate("/login", { replace: true });
            return;
          }

          default: {
            setError(getRegistrationMessage(draft.result_code));
          }
        }
      } catch {
        if (!cancelled) {
          setError("Could not restore your registration. Please retry.");
        }
      } finally {
        if (!cancelled) {
          setDraftLoaded(true);
        }
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [status, navigate]);

  // Check username availability while the player types.
  useEffect(() => {
    if (status !== "registration_pending") return;

    setUsernameAvailable(null);
    setUsernameCheckError("");

    if (!USERNAME_PATTERN.test(username)) {
      setUsernameChecking(false);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setUsernameChecking(true);

      try {
        const result = await checkUsernameAvailability(username.trim());

        if (cancelled) return;

        if (result?.result_code === "USERNAME_AVAILABLE" && result.available === true) {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
        }

        if (result?.result_code === "USERNAME_TAKEN") {
          setUsernameCheckError("This username is already reserved or in use.");
        } else if (result?.result_code !== "USERNAME_AVAILABLE") {
          setUsernameCheckError(
            getRegistrationMessage(result?.result_code ?? "USERNAME_CHECK_FAILED")
          );
        }
      } catch {
        if (!cancelled) {
          setUsernameAvailable(null);
          setUsernameCheckError("Could not verify username availability.");
        }
      } finally {
        if (!cancelled) {
          setUsernameChecking(false);
        }
      }
    }, 450);

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

  // Require a configured public CAPTCHA site key.
  if (!siteKey) {
    return (
      <main className="registration-page">
        <section className="registration-card">
          <div className="registration-brand">
            <ShieldCheck size={28} />
            <span>KICKOFF PLAYER ARENA</span>
          </div>

          <h1>Registration unavailable</h1>
          <p className="registration-description">
            Security verification is not configured. Contact the platform administrator.
          </p>
        </section>
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
    setCaptchaError("Verification expired. Complete the check again.");
  }

  function handleCaptchaFailure() {
    setCaptchaToken("");
    setCaptchaError("Verification failed. Check your connection and retry.");
  }

  // Create the Supabase Auth account.
  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !captchaToken) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const { data, error: signupError } = await signUpPlayer(
        signupEmail.trim(),
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
        // AuthContext will resolve the unlinked account.
        setNotice("Your account is ready. Continue with player registration.");
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
    if (!captchaToken || submitting || !signupEmail.trim()) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const { error: resendError } = await resendPlayerConfirmation(
        signupEmail.trim(),
        captchaToken
      );

      if (resendError) {
        setError(
          "The confirmation request could not be completed. If your account is already confirmed, sign in instead."
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

  // Save the player details and reserve the username.
  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || usernameAvailable !== true || !email) return;

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
        setError(getRegistrationMessage(result?.result_code ?? "DRAFT_SAVE_FAILED"));
        return;
      }

      setStep("squad");
      setNotice("Your details and username reservation have been saved.");
    } catch {
      setError("Could not save your registration details. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  // Save the initial squad name.
  async function handleSaveSquad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !squadName.trim() || !email) return;

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
        setError(getRegistrationMessage(result?.result_code ?? "DRAFT_SAVE_FAILED"));
        return;
      }

      setStep("review");
      setNotice("Your initial squad name has been saved.");
    } catch {
      setError("Could not save your squad name. Please retry.");
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
        setError("Registration could not be completed. Please retry.");
        return;
      }

      if (result.result_code === "ACCOUNT_ALREADY_LINKED") {
        await signOutPlayer();
        navigate("/login", { replace: true });
        return;
      }

      if (
        !result.success ||
        result.result_code !== "PLAYER_REGISTRATION_COMPLETED"
      ) {
        setError(getRegistrationMessage(result.result_code));
        return;
      }

      // Reload so AuthContext resolves the newly created player identity.
      window.location.assign("/");
    } catch {
      setError(
        "Registration could not be completed. Your saved draft has been retained; please retry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Show account creation and email confirmation to anonymous visitors.
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
            Create your login credentials and confirm your email.
          </p>

          {error && (
            <div className="registration-error" role="alert">
              {error}
            </div>
          )}

          {notice && (
            <div className="registration-notice" role="status">
              {notice}
            </div>
          )}

          {!emailConfirmationSent ? (
            <form onSubmit={handleSignup} className="registration-form">
              <label htmlFor="registration-email">
                Email address
                <input
                  id="registration-email"
                  type="email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </label>

              <label htmlFor="registration-password">
                Password
              
                <div className="password-input-wrapper">
                  <input
                    id="registration-password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
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
                <p className="registration-password">
                  Passwords must include numbers, letters, and symbol. e.g 'TestPlayer2026!'.
                </p>
              </label>

              <label htmlFor="registration-confirm-password">
                Confirm password
              
                <div className="password-input-wrapper">
                  <input
                    id="registration-confirm-password"
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                  />
              
                  <button
                    type="button"
                    className="password-visibility-toggle"
                    onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                    aria-label={
                      confirmPasswordVisible
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    aria-pressed={confirmPasswordVisible}
                    disabled={submitting}
                  >
                    {confirmPasswordVisible ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </label>
                

              <Captcha
                siteKey={siteKey}
                captchaKey={captchaKey}
                captchaReady={captchaReady}
                captchaError={captchaError}
                onLoad={handleCaptchaLoad}
                onSuccess={handleCaptchaSuccess}
                onExpire={handleCaptchaExpire}
                onFailure={handleCaptchaFailure}
                onRetry={resetCaptcha}
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
            <div className="registration-confirmation">
              <CheckCircle2 size={28} />
              <h2>Confirm your email</h2>

              <p>
                Open the confirmation link sent to{" "}
                <strong>{signupEmail}</strong>. You will return to this
                registration page after confirming.
              </p>

              <Captcha
                siteKey={siteKey}
                captchaKey={captchaKey}
                captchaReady={captchaReady}
                captchaError={captchaError}
                onLoad={handleCaptchaLoad}
                onSuccess={handleCaptchaSuccess}
                onExpire={handleCaptchaExpire}
                onFailure={handleCaptchaFailure}
                onRetry={resetCaptcha}
              />

              <button
                className="registration-submit"
                type="button"
                disabled={submitting || !captchaToken}
                onClick={handleResendConfirmation}
              >
                {submitting ? "Sending..." : "Resend confirmation"}
              </button>
            </div>
          )}

          <p className="registration-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </main>
    );
  }

  // Only confirmed, unlinked Auth users may access registration drafts.
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
          Complete your details to create your permanent KickOff player identity.
        </p>

        {error && (
          <div className="registration-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="registration-notice" role="status">
            {notice}
          </div>
        )}

        <div className="registration-email">
          <span>Verified email address</span>
          <strong>{email || "Email unavailable"}</strong>
          <small>This address is linked to your login and cannot be changed here.</small>
        </div>

        {step === "details" && (
          <form onSubmit={handleSaveDetails} className="registration-form">
            <label htmlFor="registration-username">
              Username
              <input
                id="registration-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={4}
                maxLength={20}
                pattern="[A-Za-z0-9_]{4,20}"
                autoComplete="username"
                required
                disabled={submitting}
              />

              <small aria-live="polite">
                {usernameChecking
                  ? "Checking availability..."
                  : usernameAvailable === true
                    ? "Username available"
                    : usernameAvailable === false
                      ? usernameCheckError || "Username unavailable"
                      : usernameCheckError || "4–20 letters, numbers or underscores"}
              </small>
            </label>

            <label htmlFor="registration-manager-name">
              Manager name
              <input
                id="registration-manager-name"
                value={managerName}
                onChange={(event) => setManagerName(event.target.value)}
                autoComplete="name"
                required
                disabled={submitting}
              />
            </label>

            <label htmlFor="registration-whatsapp">
              WhatsApp number
              <input
                id="registration-whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                autoComplete="tel"
                required
                disabled={submitting}
              />
            </label>

            <label htmlFor="registration-dob">
              Date of birth
              <input
                id="registration-dob"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                max={getAdultDateLimit()}
                required
                disabled={submitting}
              />
              <small>Players must be at least 18 years old.</small>
            </label>

            <button
              className="registration-submit"
              type="submit"
              disabled={
                submitting ||
                usernameAvailable !== true ||
                usernameChecking ||
                !managerName.trim() ||
                !whatsappNumber.trim() ||
                !dateOfBirth ||
                dateOfBirth > getAdultDateLimit() ||
                !email
              }
            >
              {submitting ? "Saving details..." : "Save and continue"}
            </button>
          </form>
        )}

        {step === "squad" && (
          <form onSubmit={handleSaveSquad} className="registration-form">
            <label htmlFor="registration-squad-name">
              Initial squad name
              <input
                id="registration-squad-name"
                value={squadName}
                onChange={(event) => setSquadName(event.target.value)}
                required
                disabled={submitting}
              />
              <small>You can add other squads after registration.</small>
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
              disabled={submitting}
              onClick={() => setStep("details")}
            >
              Back to player details
            </button>
          </form>
        )}

        {step === "review" && (
          <div className="registration-review">
            <h2>Review your details</h2>

            <ReviewRow label="Verified email" value={email} />
            <ReviewRow label="Username" value={username} />
            <ReviewRow label="Manager name" value={managerName} />
            <ReviewRow label="WhatsApp" value={whatsappNumber} />
            <ReviewRow label="Date of birth" value={dateOfBirth} />
            <ReviewRow label="Initial squad" value={squadName} />

            <p className="registration-description">
              Confirm to create your permanent player identity and initial squad.
            </p>

            <button
              className="registration-submit"
              type="button"
              disabled={submitting}
              onClick={() => void handleFinalize()}
            >
              {submitting ? "Completing registration..." : "Complete registration"}
            </button>

            <button
              className="registration-secondary"
              type="button"
              disabled={submitting}
              onClick={() => setStep("squad")}
            >
              Back to squad name
            </button>
          </div>
        )}

        <p className="registration-footer">
          Registration information is saved securely to your account draft.
        </p>
      </section>
    </main>
  );
}

// Isolate the Turnstile widget and its status feedback.
function Captcha({
  siteKey,
  captchaKey,
  captchaReady,
  captchaError,
  onLoad,
  onSuccess,
  onExpire,
  onFailure,
  onRetry
}: {
  siteKey: string;
  captchaKey: number;
  captchaReady: boolean;
  captchaError: string;
  onLoad: () => void;
  onSuccess: (token: string) => void;
  onExpire: () => void;
  onFailure: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="registration-captcha">
      <div className="registration-captcha-status" aria-live="polite">
        {captchaError ? (
          <div className="registration-error">
            <p>{captchaError}</p>
            <button
              type="button"
              className="registration-secondary"
              onClick={onRetry}
            >
              <RefreshCw size={15} />
              Retry verification
            </button>
          </div>
        ) : !captchaReady ? (
          <p>
            <LoaderCircle size={16} className="loading-spinner" />
            Preparing security verification...
          </p>
        ) : (
          <p>Complete the security check below.</p>
        )}
      </div>

      <Turnstile
        key={captchaKey}
        siteKey={siteKey}
        onWidgetLoad={onLoad}
        onSuccess={onSuccess}
        onExpire={onExpire}
        onError={onFailure}
        onUnsupported={onFailure}
        options={{
          theme: "dark",
          language: "en"
        }}
      />
    </div>
  );
}

// Display one read-only review field.
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="registration-review-row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
