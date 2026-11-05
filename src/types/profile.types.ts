
export const PLAYER_AVATAR_IDS = [
  "avatar_01",
  "avatar_02",
  "avatar_03",
  "avatar_04",
  "avatar_05",
  "avatar_06",
  "avatar_07",
  "avatar_08"
] as const;

export type PlayerAvatarId =
  (typeof PLAYER_AVATAR_IDS)[number];

export interface PlayerProfile {
  player_id: string;
  manager_name: string;
  email_address: string;
  whatsapp_number: string;
  date_of_birth: string;
  player_status: string;
  created_datetime: string;
  avatar_id: PlayerAvatarId | null;
}

export interface PlayerProfileState {
  profile: PlayerProfile | null;
  loading: boolean;
  error: string | null;
}
