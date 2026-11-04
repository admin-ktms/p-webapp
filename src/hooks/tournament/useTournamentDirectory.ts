import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { tournamentService } from "../../services/tournament.service";

import type {
  Tournament
} from "../../types/tournament.types";

const PAGE_SIZE = 20;

interface UseTournamentDirectoryResult {
  tournaments: Tournament[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not load tournaments.";
}

export function useTournamentDirectory(
  tournamentTypeId: string | null
): UseTournamentDirectoryResult {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestVersion = useRef(0);
  const loadingMoreRef = useRef(false);

  const refresh = useCallback(async () => {
    const currentVersion = ++requestVersion.current;

    setLoading(true);
    setError(null);
    setTournaments([]);
    setTotal(0);
    setLoadingMore(false);
    loadingMoreRef.current = false;

    try {
      const response = await tournamentService.listDirectory({
        tournament_type_id: tournamentTypeId,
        limit: PAGE_SIZE,
        offset: 0
      });

      if (currentVersion !== requestVersion.current) {
        return;
      }

      setTournaments(response.tournaments);
      setTotal(response.total);
    } catch (err) {
      if (currentVersion !== requestVersion.current) {
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      if (currentVersion === requestVersion.current) {
        setLoading(false);
      }
    }
  }, [tournamentTypeId]);

  const loadMore = useCallback(async () => {
    if (
      loading ||
      loadingMoreRef.current ||
      tournaments.length >= total
    ) {
      return;
    }

    const currentVersion = requestVersion.current;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const response = await tournamentService.listDirectory({
        tournament_type_id: tournamentTypeId,
        limit: PAGE_SIZE,
        offset: tournaments.length
      });

      if (currentVersion !== requestVersion.current) {
        return;
      }

      setTournaments((current) => {
        const existingIds = new Set(
          current.map((item) => item.tournament_id)
        );

        const additional = response.tournaments.filter(
          (item) => !existingIds.has(item.tournament_id)
        );

        return [...current, ...additional];
      });

      setTotal(response.total);
    } catch (err) {
      if (currentVersion === requestVersion.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (currentVersion === requestVersion.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [
    loading,
    tournaments,
    total,
    tournamentTypeId
  ]);

  useEffect(() => {
    void refresh();

    return () => {
      requestVersion.current += 1;
    };
  }, [refresh]);

  return {
    tournaments,
    total,
    loading,
    loadingMore,
    hasMore: tournaments.length < total,
    error,
    refresh,
    loadMore
  };
}
