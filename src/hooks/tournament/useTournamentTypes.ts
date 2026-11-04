import { useCallback, useEffect, useState } from "react";

import { tournamentService } from "../../services/tournament.service";
import type { TournamentType } from "../../types/tournament.types";

interface UseTournamentTypesResult {
  types: TournamentType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not load tournament types.";
}

export function useTournamentTypes(): UseTournamentTypesResult {
  const [types, setTypes] = useState<TournamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tournamentService.listTypes();

      setTypes(response.tournament_types);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    types,
    loading,
    error,
    refresh
  };
}
