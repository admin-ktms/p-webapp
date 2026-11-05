

export interface TournamentType {
  tournament_type_id: string;
  tournament_type_name: string;
  tournament_type_status: "Active";
}

export type TournamentDisplayStatus =
  | "Soon"
  | "Open"
  | "Ongoing"
  | "Suspended";

export interface TournamentStatusPresentation {
  label: TournamentDisplayStatus;
  className: string;
  canRegister: boolean;
}

export function getTournamentStatusPresentation(
  status: string
): TournamentStatusPresentation | null {
  switch (status) {
    case "Upcoming":
      return {
        label: "Soon",
        className: "soon",
        canRegister: false
      };

    case "Registration Open":
      return {
        label: "Open",
        className: "open",
        canRegister: true
      };

    case "Registration Closed":
    case "Group Stage":
    case "Playoff Stage":
    case "Knockout Stage":
      return {
        label: "Ongoing",
        className: "ongoing",
        canRegister: false
      };

    case "Suspended":
      return {
        label: "Suspended",
        className: "suspended",
        canRegister: false
      };

    default:
      return null;
  }
}

export interface Tournament {
  tournament_id: string;
  tournament_name: string;
  tournament_type_id: string;
  tournament_status: string;
  registration_fee: number;
  currency: string;
  registration_open_datetime: string;
  registration_close_datetime: string;
  tournament_start_date: string;
  tournament_end_date: string;
  is_archived: boolean;
}

export interface TournamentTypesResponse {
  tournament_types: TournamentType[];
}

export interface TournamentDirectoryInput {
  tournament_type_id?: string | null;
  limit?: number;
  offset?: number;
}

export interface TournamentDirectoryResponse {
  tournaments: Tournament[];
  total: number;
  limit: number;
  offset: number;
}
