
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";

import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

import {
  signInWithPassword,
  signOutPlayer,
  validatePlayerSession,
  type PlayerAccessLevel,
  type PlayerIdentity
} from "../services/auth.service";

type AuthStatus = "loading" | "anonymous" | "registration_pending" | "authorized";

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  identity: PlayerIdentity | null;
  accessLevel: PlayerAccessLevel | null;
  message: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (
    email: string,
    password: string,
    captchaToken: string
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearMessage: () => void;
}

const initialState: AuthState = {
  status: "loading",
  session: null,
  identity: null,
  accessLevel: null,
  message: null
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(initialState);

  const requestId = useRef(0);

  // Resolve and validate every authenticated session.
  const validateSession = useCallback(
    async (session: Session | null): Promise<boolean> => {
      const currentRequest = ++requestId.current;

      if (!session) {
        setAuth((previous) => ({
          ...initialState,
          status: "anonymous",
          message: previous.message
        }));

        return false;
      }

      setAuth((previous) => ({
        ...previous,
        status: "loading",
        session,
        identity: null,
        accessLevel: null,
        message: null
      }));

      try {
        const result = await validatePlayerSession(session);

        // Ignore results from older session requests.
        // Keep confirmed, unlinked users authenticated for registration.
        
        if (currentRequest !== requestId.current) {
          return false;
        }

        setAuth({
          status: "authorized",
          session,
          identity: result.identity,
          accessLevel: result.accessLevel,
          message: null
        });

        return true;
      } catch (error) {

        if (
          error instanceof Error &&
          error.message === "ACCOUNT_NOT_LINKED"
        ) {
          setAuth({
            status: "registration_pending",
            session,
            identity: null,
            accessLevel: null,
            message: null
          });
        
          return false;
        }
    },
    []
  );

  // Restore sessions and listen for authentication changes.
  useEffect(() => {
    let authEventVersion = 0;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventVersion += 1;

      // Defer Supabase calls outside the auth callback.
      window.setTimeout(() => {
        void validateSession(session);
      }, 0);
    });

    const initialVersion = authEventVersion;

    void supabase.auth.getSession().then(({ data, error }) => {
      // Do not overwrite a newer auth event.
      if (authEventVersion !== initialVersion) {
        return;
      }

      if (error) {
        setAuth({
          ...initialState,
          status: "anonymous",
          message: "Could not restore your session."
        });

        return;
      }

      void validateSession(data.session);
    });

    return () => {
      requestId.current += 1;
      subscription.unsubscribe();
    };
  }, [validateSession]);

  // Authenticate, then validate the returned KTMS identity.
const signIn = async (
  email: string,
  password: string,
  captchaToken: string
): Promise<boolean> => {
  setAuth({
    ...initialState,
    status: "loading"
  });

  const { data, error } = await signInWithPassword(
    email,
    password,
    captchaToken
  );

  if (error || !data.session) {
    setAuth({
      ...initialState,
      status: "anonymous",
      message: error?.message || "Login could not be completed."
    });

    return false;
  }

  return validateSession(data.session);
};

  const signOut = async () => {
    requestId.current += 1;

    setAuth({
      ...initialState,
      status: "anonymous"
    });

    const { error } = await signOutPlayer();

    if (error) {
      setAuth((previous) => ({
        ...previous,
        message: "Could not complete logout. Please retry."
      }));
    }
  };

  const clearMessage = () => {
    setAuth((previous) => ({
      ...previous,
      message: null
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        signIn,
        signOut,
        clearMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
