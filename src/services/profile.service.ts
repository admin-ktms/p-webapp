
import { callApi } from "../lib/api";

import type {
  PlayerProfile
} from "../types/profile.types";

export const profileService = {
  async getOwnProfile(): Promise<PlayerProfile> {
    return callApi<PlayerProfile>(
      "profile.get_own"
    );
  }
};
