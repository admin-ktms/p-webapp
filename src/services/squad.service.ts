
import { supabase } from "../lib/supabase";
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
    async uploadScreenshot(
      playerId: string,
      squadId: string,
      file: File
    ): Promise<string> {
      const MAX_FILE_SIZE = 2 * 1024 * 1024;
    
      const extensions: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png"
      };
    
      if (!extensions[file.type]) {
        throw new Error("Only JPEG and PNG images are allowed.");
      }
    
      if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        throw new Error("Each screenshot must be between 1 byte and 2 MB.");
      }
    
      if (!playerId || !squadId) {
        throw new Error("Player and squad identifiers are required.");
      }
    
      const filename = `${crypto.randomUUID()}.${extensions[file.type]}`;
      const path = `${playerId}/${squadId}/${filename}`;
    
      const { data, error } = await supabase.storage
        .from("squad-screenshot-bucket")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false
        });
    
      if (error) {
        throw new Error(error.message);
      }
    
      return data.path;
    },
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
        ...(input.screenshot_ids !== undefined
          ? { screenshot_ids: input.screenshot_ids }
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
