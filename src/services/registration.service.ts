
import { callApi } from "../lib/api";

import type {
  PlayerRegistrationsInput,
  PlayerRegistrationsResponse
} from "../types/registration.types";
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
  async listOwn(
    input: PlayerRegistrationsInput = {}
  ): Promise<PlayerRegistrationsResponse> {
    return callApi<PlayerRegistrationsResponse>(
      "registration.list_own",
      {
        status: input.status ?? null,
        tournament_type_id:
          input.tournament_type_id ?? null,
        tournament_id: input.tournament_id ?? null,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0
      }
    );
  }
};
