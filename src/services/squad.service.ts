
import { callApi } from "../lib/api";

import type {
  SquadListResponse,
  SquadRecord,
  CreateSquadInput,
  UpdateSquadInput,
  DeleteSquadResponse,
  ValidateSquadResponse,
  SquadScreenshotsResponse
} from "../types/squad.types";

export const squadService = {
  async listOwn(): Promise<SquadListResponse> {
    return callApi<SquadListResponse>(
      "squad.list_own"
    );
  },

  async create(
    input: CreateSquadInput
  ): Promise<SquadRecord> {
    return callApi<SquadRecord>(
      "squad.create",
      input
    );
  },

  async update(
    input: UpdateSquadInput
  ): Promise<SquadRecord> {
    return callApi<SquadRecord>(
      "squad.update",
      input
    );
  },

  async delete(
    squadId: string
  ): Promise<DeleteSquadResponse> {
    return callApi<DeleteSquadResponse>(
      "squad.delete",
      {
        squad_id: squadId
      }
    );
  },

  async validate(
    squadId: string
  ): Promise<ValidateSquadResponse> {
    return callApi<ValidateSquadResponse>(
      "squad.validate",
      {
        squad_id: squadId
      }
    );
  },

  async getScreenshots(
    squadId: string
  ): Promise<SquadScreenshotsResponse> {
    return callApi<SquadScreenshotsResponse>(
      "squad.screenshots.view",
      {
        squad_id: squadId
      }
    );
  }
};
