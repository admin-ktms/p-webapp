
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { registrationService } from "../../services/registration.service";

import type {
  PlayerRegistration,
  PlayerRegistrationsInput,
  RegistrationProvider
} from "../../types/registration.types";

const PAGE_SIZE = 50;

interface UseRegistrationsResult {
  registrations: PlayerRegistration[];
  providers: RegistrationProvider[];

  totalCount: number;
  limit: number;
  offset: number;

  status: string;
  tournamentTypeId: string;
  tournamentId: string;

  loading: boolean;
  error: string | null;

  hasMore: boolean;

  setStatus: (value: string) => void;
  setTournamentTypeId: (value: string) => void;
  setTournamentId: (value: string) => void;

  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load your registrations.";
}

export function useRegistrations(): UseRegistrationsResult {
  const [registrations, setRegistrations] =
    useState<PlayerRegistration[]>([]);

  const [providers, setProviders] =
    useState<RegistrationProvider[]>([]);

  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(PAGE_SIZE);

  const [status, setStatusState] = useState("");
  const [tournamentTypeId, setTournamentTypeIdState] =
    useState("");

  const [tournamentId, setTournamentIdState] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const filters = useRef({
    status,
    tournamentTypeId,
    tournamentId
  });

  const fetchPage = useCallback(async (
    nextOffset: number,
    append: boolean
  ) => {
    const currentRequest = ++requestId.current;

    setLoading(true);
    setError(null);

    const currentFilters = filters.current;

    const input: PlayerRegistrationsInput = {
      status: currentFilters.status || null,
      tournament_type_id:
        currentFilters.tournamentTypeId || null,
      tournament_id:
        currentFilters.tournamentId.trim() || null,
      limit,
      offset: nextOffset
    };

    try {
      const result = await registrationService.listOwn(input);

      if (currentRequest !== requestId.current) {
        return;
      }

      setRegistrations((previous) =>
        append
          ? [...previous, ...result.registrations]
          : result.registrations
      );

      setProviders(result.providers);
      setTotalCount(result.total_count);
      setOffset(result.offset + result.registrations.length);
    } catch (err) {
      if (currentRequest !== requestId.current) {
        return;
      }

      setError(getErrorMessage(err));

      if (!append) {
        setRegistrations([]);
        setProviders([]);
        setTotalCount(0);
        setOffset(0);
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    await fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || offset >= totalCount) {
      return;
    }

    await fetchPage(offset, true);
  }, [fetchPage, loading, offset, totalCount]);

  const setStatus = (value: string) => {
    filters.current.status = value;
    setStatusState(value);
  };

  const setTournamentTypeId = (value: string) => {
    filters.current.tournamentTypeId = value;
    setTournamentTypeIdState(value);
  };

  const setTournamentId = (value: string) => {
    filters.current.tournamentId = value;
    setTournamentIdState(value);
  };

  useEffect(() => {
    void refresh();

    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    setOffset(0);
    void fetchPage(0, false);
  }, [
    status,
    tournamentTypeId,
    tournamentId,
    fetchPage
  ]);

  return {
    registrations,
    providers,
    totalCount,
    limit,
    offset,

    status,
    tournamentTypeId,
    tournamentId,

    loading,
    error,

    hasMore: offset < totalCount,

    setStatus,
    setTournamentTypeId,
    setTournamentId,

    refresh,
    loadMore
  };
}
