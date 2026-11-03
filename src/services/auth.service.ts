
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const identityDb = supabase.schema("identity");

export interface PlayerIdentity {
  success: boolean;
  reason_code: string;
  auth_user_id: string | null;
  account_type: string | null;
  player_id: string | null;
  admin_id: string | null;
  link_status: string | null;
  account_status: string | null;
}

export type PlayerAccessLevel = "full" | "profile_only";

export interface RegistrationDraft {
  result_code: string;
  username: string | null;
  manager_name: string | null;
  whatsapp_number: string | null;
  date_of_birth: string | null;
  squad_name: string | null;
  created_datetime: string | null;
  last_modified_datetime: string | null;
  expires_datetime: string | null;
}

export interface RegistrationResult {
  success: boolean;
  result_code: string;
  player_id: string | null;
  username: string | null;
  squad_id: string | null;
}

// Create the Supabase Auth account.
export async function signUpPlayer(
  email: string,
  password: string,
  captchaToken: string
) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      captchaToken,
      emailRedirectTo: `${window.location.origin}/register`
    }
  });
}

// Resend the signup confirmation email.
export async function resendPlayerConfirmation(
  email: string,
  captchaToken: string
) {
  return supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: `${window.location.origin}/register`,
      captchaToken
    }
  });
}

// Authenticate using password and verified CAPTCHA.
export async function signInWithPassword(
  email: string,
  password: string,
  captchaToken: string
) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
    options: { captchaToken }
  });
}

// Send the password-reset email.
export async function requestPlayerPasswordReset(
  email: string,
  captchaToken: string,
  redirectTo: string
) {
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
    captchaToken
  });
}

// Save the new password from a valid recovery session.
export async function updatePlayerPassword(password: string) {
  return supabase.auth.updateUser({ password });
}

// Resolve the authenticated user to a KTMS identity.
export async function resolvePlayerIdentity() {
  const { data, error } = await identityDb.rpc("identity_resolver");

  if (error) throw error;

  const identity = Array.isArray(data) ? data[0] : data;

  if (!identity) {
    throw new Error("Player identity could not be resolved.");
  }

  return identity as PlayerIdentity;
}

// Validate identity and determine player access.
export async function validatePlayerSession(
  session: Session
): Promise<{
  identity: PlayerIdentity;
  accessLevel: PlayerAccessLevel;
}> {
  const identity = await resolvePlayerIdentity();

  if (!identity.success) {
    throw new Error(
      identity.reason_code || "Identity verification failed."
    );
  }

  if (identity.auth_user_id !== session.user.id) {
    throw new Error("Account identity does not match the session.");
  }

  if (identity.account_type !== "Player") {
    throw new Error("This portal is for player accounts only.");
  }

  if (identity.link_status !== "Active") {
    throw new Error("Your player account link is not active.");
  }

  if (!identity.player_id) {
    throw new Error("Player identity is incomplete.");
  }

  if (identity.account_status === "Active") {
    return { identity, accessLevel: "full" };
  }

  if (
    identity.account_status === "Suspended" ||
    identity.account_status === "Banned"
  ) {
    return { identity, accessLevel: "profile_only" };
  }

  throw new Error("Your player account status is not recognized.");
}

// Check global username availability.
export async function checkUsernameAvailability(username: string) {
  const { data, error } = await identityDb.rpc(
    "check_player_username_availability",
    { p_username: username }
  );

  if (error) throw error;

  return Array.isArray(data) ? data[0] : data;
}

// Save or update the authenticated user's registration draft.
export async function saveRegistrationDraft(input: {
  username: string;
  managerName: string;
  whatsappNumber: string;
  dateOfBirth: string;
  squadName: string | null;
}) {
  const { data, error } = await identityDb.rpc(
    "save_player_registration_draft",
    {
      p_username: input.username,
      p_manager_name: input.managerName,
      p_whatsapp_number: input.whatsappNumber,
      p_date_of_birth: input.dateOfBirth,
      p_squad_name: input.squadName
    }
  );

  if (error) throw error;

  return Array.isArray(data) ? data[0] : data;
}

// Retrieve the current authenticated user's draft.
export async function getRegistrationDraft() {
  const { data, error } = await identityDb.rpc(
    "get_player_registration_draft"
  );

  if (error) throw error;

  return (Array.isArray(data) ? data[0] : data) as
    | RegistrationDraft
    | null;
}

// Finalize player and initial squad creation.
export async function finalizePlayerRegistration() {
  const { data, error } = await identityDb.rpc(
    "finalize_player_registration"
  );

  if (error) throw error;

  return (Array.isArray(data) ? data[0] : data) as
    | RegistrationResult
    | null;
}

// End the current local session.
export async function signOutPlayer() {
  return supabase.auth.signOut({ scope: "local" });
}
