import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Tournament } from "../../types/tournament.types";

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

function TournamentCard({
  tournament
}: TournamentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <article className="tournament-card">
      <button
        type="button"
        className="tournament-card-heading"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="tournament-card-heading-text">
          <strong>{tournament.tournament_name}</strong>

          <span>{tournament.tournament_id}</span>
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

          <button
            type="button"
            className="tournament-register-button"
            onClick={() =>
              navigate(
                `/tournaments/register/${encodeURIComponent(
                  tournament.tournament_id
                )}`
              )
            }
          >
            <span>Register Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </article>
  );
}

export default TournamentCard;
