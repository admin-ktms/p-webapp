
import { callApi } from "../lib/api";

/**
 * Registration request result returned by the KT provider
 * through platform.create_registration_request.
 */
export interface RegistrationRequestResult {
  success: boolean;
  reason_code: string;

  request_id: string | null;
  registration_reference_id: string | null;

  tournament_id: string;
  player_id: string | null;
  squad_name: string | null;

  request_status: string | null;
  registration_fee: number | null;
  request_datetime: string | null;
}

export interface CreateRegistrationRequestInput {
  tournament_id: string;
  squad_id: string;
}

export const registrationService = {
  async createRequest(
    input: CreateRegistrationRequestInput
  ): Promise<RegistrationRequestResult> {
    return callApi<RegistrationRequestResult>(
      "registration.request.create",
      {
        tournament_id: input.tournament_id,
        squad_id: input.squad_id
      }
    );
  }
};
