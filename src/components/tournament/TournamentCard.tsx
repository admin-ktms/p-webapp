
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";

import {
  getTournamentStatusPresentation
} from "../../types/tournament.types";

import type {
  Tournament
} from "../../types/tournament.types";

import RegistrationRequestModal from "./RegistrationRequestModal";

import { registrationService } from "../../services/registration.service";

interface TournamentCardProps {
  tournament: Tournament;
}

function formatCurrency(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return "Date unavailable";
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  const date = new Date(year, month, day);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to submit your registration request. Please try again.";
}

function TournamentCard({
  tournament
}: TournamentCardProps) {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] =
    useState<string | null>(null);

  const status = getTournamentStatusPresentation(
    tournament.tournament_status
  );

  async function handleRegistration(squadId: string) {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await registrationService.createRequest({
        tournament_id: tournament.tournament_id,
        squad_id: squadId
      });

      if (!result.success) {
        setSubmissionError(
          result.message ||
          result.reason_code ||
          "Your registration request could not be created."
        );
        return;
      }

      setShowRegistrationModal(false);

      navigate("/registrations");
    } catch (error) {
      setSubmissionError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function closeRegistrationModal() {
    if (submitting) {
      return;
    }

    setShowRegistrationModal(false);
    setSubmissionError(null);
  }

  return (
    <article className="tournament-card">
      <button
        type="button"
        className="tournament-card-heading"
        onClick={() => setExpanded(current => !current)}
        aria-expanded={expanded}
      >
        <span className="tournament-card-heading-text">
          <strong>{tournament.tournament_name}</strong>

          <span>{tournament.tournament_id}</span>

          {status && (
            <span
              className={`tournament-status-badge tournament-status-${status.className}`}
            >
              {status.label}
            </span>
          )}
        </span>

        <span className="tournament-expand-icon">
          {expanded ? (
            <ChevronUp size={19} />
          ) : (
            <ChevronDown size={19} />
          )}
        </span>
      </button>

      {expanded && (
        <div className="tournament-card-details">
          <div className="tournament-detail-row">
            <span>Registration fee</span>
            <strong>
              {formatCurrency(
                tournament.registration_fee,
                tournament.currency
              )}
            </strong>
          </div>

          <div className="tournament-detail-row">
            <span>Registration opens</span>
            <strong>
              {formatDateTime(
                tournament.registration_open_datetime
              )}
            </strong>
          </div>

          <div className="tournament-detail-row">
            <span>Registration closes</span>
            <strong>
              {formatDateTime(
                tournament.registration_close_datetime
              )}
            </strong>
          </div>

          <div className="tournament-detail-row">
            <span>Tournament ends</span>
            <strong>
              {formatDateOnly(
                tournament.tournament_end_date
              )}
            </strong>
          </div>

          {status?.canRegister && (
            <button
              type="button"
              className="tournament-register-button"
              onClick={() => {
                setSubmissionError(null);
                setShowRegistrationModal(true);
              }}
            >
              <span>Register Now</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {showRegistrationModal && (
        <RegistrationRequestModal
          tournamentName={tournament.tournament_name}
          tournamentId={tournament.tournament_id}
          registrationFee={tournament.registration_fee}
          currency={tournament.currency}
          submitting={submitting}
          submissionError={submissionError}
          onClose={closeRegistrationModal}
          onContinue={handleRegistration}
        />
      )}
    </article>
  );
}

export default TournamentCard;
