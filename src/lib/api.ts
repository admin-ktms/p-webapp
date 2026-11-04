import { supabase } from "./supabase";

const apiUrl = import.meta.env.VITE_API_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!apiUrl) {
  throw new Error("VITE_API_URL is missing.");
}

const API_VERSION = 1;

interface ApiEnvelope<T> {
  success: boolean;
  operation: string | null;
  data: T | null;
  error: { code: string; message: string } | null;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

// Call a player-api operation with the signed-in user's access token.
export async function callApi<T>(
  operation: string,
  input: Record<string, unknown> = {}
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new ApiError(
      "AUTHENTICATION_REQUIRED",
      "You must be signed in.",
      401
    );
  }

  let response: Response;

  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        api_version: API_VERSION,
        operation,
        input
      })
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Could not reach the server.",
      0
    );
  }

  let body: ApiEnvelope<T> | null = null;

  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok || !body || !body.success) {
    throw new ApiError(
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return body.data as T;
}
