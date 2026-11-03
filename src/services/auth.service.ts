
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

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

// Authenticate using password and verified CAPTCHA.
export async function signInWithPassword(
  email: string,
  password: string,
  captchaToken: string
) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
    options: {
      captchaToken
    }
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

// Resolve the authenticated Supabase user to a KTMS identity.
export async function resolvePlayerIdentity() {
  const { data, error } = await supabase.rpc("identity_resolver");

  if (error) {
    throw error;
  }

  const identity = Array.isArray(data) ? data[0] : data;

  if (!identity) {
    throw new Error("Player identity could not be resolved.");
  }

  return identity as PlayerIdentity;
}

// Validate identity and determine the player's access level.
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

  // Active players receive full portal access.
  if (identity.account_status === "Active") {
    return {
      identity,
      accessLevel: "full"
    };
  }

  // Non-active players retain profile-only access.
  if (
    identity.account_status === "Suspended" ||
    identity.account_status === "Banned"
  ) {
    return {
      identity,
      accessLevel: "profile_only"
    };
  }

  throw new Error("Your player account status is not recognized.");
}

// End the current local session.
export async function signOutPlayer() {
  return supabase.auth.signOut({ scope: "local" });
}
