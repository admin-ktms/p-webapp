
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { profileService } from "../../services/profile.service";

import type {
  PlayerProfile,
  PlayerAvatarId
} from "../../types/profile.types";

interface UsePlayerProfileResult {
  profile: PlayerProfile | null;
  loading: boolean;
  updatingAvatar: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateAvatar: (
    avatarId: PlayerAvatarId
  ) => Promise<boolean>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "The requested operation could not be completed.";
}

export function usePlayerProfile(): UsePlayerProfileResult {
  const [profile, setProfile] =
    useState<PlayerProfile | null>(null);

  const [loading, setLoading] = useState(true);

  const [updatingAvatar, setUpdatingAvatar] =
    useState(false);

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

  const updateAvatar = useCallback(
    async (avatarId: PlayerAvatarId): Promise<boolean> => {
      if (updatingAvatar) {
        return false;
      }

      setUpdatingAvatar(true);
      setError(null);

      try {
        const result = await profileService.selectAvatar(avatarId);

        setProfile((previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            avatar_id: result.avatar_id
          };
        });

        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setUpdatingAvatar(false);
      }
    },
    [updatingAvatar]
  );

  useEffect(() => {
    void refresh();

    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return {
    profile,
    loading,
    updatingAvatar,
    error,
    refresh,
    updateAvatar
  };
}
