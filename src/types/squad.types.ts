
export interface PlayerSquad {
  squad_id: string;
  squad_slot: number;
  squad_name: string;
  created_datetime: string;
}

export interface SquadListResponse {
  player_id: string;
  squad_count: number;
  squads: PlayerSquad[];
}

export interface SquadRecord {
  squad_id: string;
  player_id: string;
  squad_slot: number;
  squad_name: string;
  created_datetime: string;
  last_modified_datetime?: string;
}

export interface CreateSquadInput {
  squad_name: string;
}

export interface UpdateSquadInput {
  squad_id: string;
  squad_name?: string;
  screenshot_paths?: string[];
}

export interface DeleteSquadResponse {
  success: boolean;
  reason_code: string;
  player_id: string;
  squad_id: string;
  deleted_squad_slot: number | null;
  remaining_squad_count: number | null;
  deleted_datetime: string | null;
}

export interface ValidateSquadResponse {
  ready: boolean;
  reason_code: string;
  player_id: string | null;
  squad_id: string | null;
  squad_slot: number | null;
  squad_name: string | null;
  screenshot_count: number;
}

export interface SquadScreenshot {
  screenshot_id: string;
  screenshot_slot: number;
  signed_url: string;
  expires_in: number;
}

export interface SquadScreenshotsResponse {
  squad_id: string;
  screenshots: SquadScreenshot[];
}
