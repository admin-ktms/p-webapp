
export type RegistrationProviderStatus =
  | "available"
  | "empty"
  | "error"
  | "not_implemented";

export interface RegistrationProvider {
  tournament_type_id: string;
  tournament_type_name: string;
  tournament_type_status: string;
  status: RegistrationProviderStatus;
  total_count: number | null;
}

/**
 * These fields represent the normalized registration record.
 * Keep these keys aligned with the KT provider's JSONB output.
 */
export interface PlayerRegistration {
  registration_reference_id: string | null;
  request_id: string | null;

  tournament_id: string;
  tournament_type_id: string;
  tournament_name: string | null;

  squad_name: string | null;

  amount_paid: number;
  registration_fee: number | null;
  payment_method: string | null;

  status: string;

  request_datetime: string | null;
  registration_datetime: string | null;
}

export interface PlayerRegistrationsResponse {
  registrations: PlayerRegistration[];
  total_count: number;
  limit: number;
  offset: number;
  providers: RegistrationProvider[];
}

export interface PlayerRegistrationsInput {
  status?: string | null;
  tournament_type_id?: string | null;
  tournament_id?: string | null;
  limit?: number;
  offset?: number;
}
