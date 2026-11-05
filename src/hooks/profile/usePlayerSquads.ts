
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { squadService } from "../../services/squad.service";

import type {
  PlayerSquad
} from "../../types/squad.types";

interface UsePlayerSquadsResult {
  playerId: string | null;
  squadCount: number;
  squads: PlayerSquad[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load your squads.";
}

export function usePlayerSquads(): UsePlayerSquadsResult {
  const [playerId, setPlayerId] =
    useState<string | null>(null);

  const [squadCount, setSquadCount] =
    useState(0);

  const [squads, setSquads] =
    useState<PlayerSquad[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;

    setLoading(true);
    setError(null);

    try {
      const result = await squadService.listOwn();

      if (currentRequest !== requestId.current) {
        return;
      }

      setPlayerId(result.player_id);
      setSquadCount(result.squad_count);
      setSquads(result.squads);
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
    playerId,
    squadCount,
    squads,
    loading,
    error,
    refresh
  };
}
