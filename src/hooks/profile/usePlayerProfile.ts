
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { profileService } from "../../services/profile.service";

import type {
  PlayerProfile
} from "../../types/profile.types";

interface UsePlayerProfileResult {
  profile: PlayerProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not load your player profile.";
}

export function usePlayerProfile(): UsePlayerProfileResult {
  const [profile, setProfile] =
    useState<PlayerProfile | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;

    setLoading(true);
    setError(null);

    try {
      const result = await profileService.getOwnProfile();

      if (currentRequest !== requestId.current) {
        return;
      }

      setProfile(result);
    } catch (err) {
      if (currentRequest !== requestId.current) {
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();

    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return {
    profile,
    loading,
    error,
    refresh
  };
}
