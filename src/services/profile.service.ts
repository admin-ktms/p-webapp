
import { callApi } from "../lib/api";

import type {
  PlayerProfile,
  PlayerAvatarId
} from "../types/profile.types";

export const profileService = {
  async getOwnProfile(): Promise<PlayerProfile> {
    return callApi<PlayerProfile>(
      "profile.get_own"
    );
  },

  async selectAvatar(
    avatarId: PlayerAvatarId
  ): Promise<{ avatar_id: PlayerAvatarId }> {
    return callApi<{ avatar_id: PlayerAvatarId }>(
      "profile.avatar.select",
      {
        avatar_id: avatarId
      }
    );
  }
};
