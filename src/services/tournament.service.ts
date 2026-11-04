import { callApi } from "../lib/api";

import type {
  TournamentDirectoryInput,
  TournamentDirectoryResponse,
  TournamentTypesResponse
} from "../types/tournament.types";

export const tournamentService = {
  async listTypes(): Promise<TournamentTypesResponse> {
    return callApi<TournamentTypesResponse>(
      "tournament.types.list"
    );
  },

  async listDirectory(
    input: TournamentDirectoryInput = {}
  ): Promise<TournamentDirectoryResponse> {
    return callApi<TournamentDirectoryResponse>(
      "tournament.directory.list",
      {
        tournament_type_id:
          input.tournament_type_id ?? null,
        limit: input.limit ?? 20,
        offset: input.offset ?? 0
      }
    );
  }
};
