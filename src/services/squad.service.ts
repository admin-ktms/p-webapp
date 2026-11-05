
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
      {
        squad_name: input.squad_name
      }
    );
  },

  async update(
    input: UpdateSquadInput
  ): Promise<SquadRecord> {
    return callApi<SquadRecord>(
      "squad.update",
      {
        squad_id: input.squad_id,
        ...(input.squad_name !== undefined
          ? { squad_name: input.squad_name }
          : {}),
        ...(input.screenshot_paths !== undefined
          ? { screenshot_paths: input.screenshot_paths }
          : {})
      }
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
