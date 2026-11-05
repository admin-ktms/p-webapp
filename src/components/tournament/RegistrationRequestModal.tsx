
import { useState } from "react";
import {
  X,
  Users,
  RefreshCw,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

import { usePlayerSquads } from "../../hooks/profile/usePlayerSquads";

interface RegistrationRequestModalProps {
  tournamentName: string;
  tournamentId: string;
  registrationFee: number;
  currency: string;
  submitting: boolean;
  submissionError: string | null;
  onClose: () => void;
  onContinue: (squadId: string) => void;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function RegistrationRequestModal({
  tournamentName,
  tournamentId,
  registrationFee,
  currency,
  submitting,
  submissionError,
  onClose,
  onContinue
}: RegistrationRequestModalProps) {
  const {
    squads,
    loading,
    error,
    refresh
  } = usePlayerSquads();

  const [selectedSquadId, setSelectedSquadId] =
    useState("");

  const [reviewing, setReviewing] =
    useState(false);

  const selectedSquad = squads.find(
    squad => squad.squad_id === selectedSquadId
  );

  function handleContinue() {
    if (!selectedSquadId || !selectedSquad) {
      return;
    }

    setReviewing(true);
  }

  function handleSubmit() {
    if (!selectedSquadId || !selectedSquad || submitting) {
      return;
    }

    onContinue(selectedSquadId);
  }

  return (
    <div
      className="registration-modal-backdrop"
      onMouseDown={event => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <section
        className="registration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
      >
        <header className="registration-modal-header">
          <div>
            <span className="registration-modal-eyebrow">
              TOURNAMENT REGISTRATION
            </span>

            <h2 id="registration-modal-title">
              {reviewing ? "Review your request" : "Select your squad"}
            </h2>
          </div>

          <button
            type="button"
            className="registration-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close registration window"
          >
            <X size={19} />
          </button>
        </header>

        <div className="registration-modal-body">
          <div className="registration-modal-tournament">
            <span>Tournament</span>
            <strong>{tournamentName}</strong>
            <small>{tournamentId}</small>
          </div>

          {!reviewing && (
            <>
              <div className="registration-modal-section-heading">
                <div>
                  <h3>Your squads</h3>
                  <p>Select the squad you want to register.</p>
                </div>

                <Users size={19} />
              </div>

              {loading && (
                <div className="registration-modal-state">
                  <span className="tournament-spinner" />
                  <span>Loading your squads...</span>
                </div>
              )}

              {!loading && error && (
                <div className="registration-modal-state registration-modal-error">
                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={() => void refresh()}
                  >
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && squads.length === 0 && (
                <div className="registration-modal-state">
                  <Users size={25} />

                  <strong>No squads available</strong>

                  <p>
                    Create a squad in your profile before
                    registering for this tournament.
                  </p>
                </div>
              )}

              {!loading && !error && squads.length > 0 && (
                <div className="registration-squad-list">
                  {squads.map(squad => {
                    const selected =
                      selectedSquadId === squad.squad_id;

                    return (
                      <button
                        key={squad.squad_id}
                        type="button"
                        className={`registration-squad-option ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() =>
                          setSelectedSquadId(squad.squad_id)
                        }
                        aria-pressed={selected}
                      >
                        <span className="registration-squad-radio">
                          {selected && <span />}
                        </span>

                        <span className="registration-squad-info">
                          <strong>{squad.squad_name}</strong>
                          <small>
                            Squad {squad.squad_slot}
                          </small>
                        </span>

                        {selected && (
                          <span className="registration-squad-selected">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {reviewing && selectedSquad && (
            <div className="registration-review">
              <div className="registration-review-heading">
                <CheckCircle2 size={19} />
                <strong>Confirm registration details</strong>
              </div>

              <div className="registration-review-row">
                <span>Tournament</span>
                <strong>{tournamentName}</strong>
              </div>

              <div className="registration-review-row">
                <span>Tournament ID</span>
                <strong>{tournamentId}</strong>
              </div>

              <div className="registration-review-row">
                <span>Selected squad</span>
                <strong>{selectedSquad.squad_name}</strong>
              </div>

              <div className="registration-review-row">
                <span>Registration fee</span>
                <strong>
                  {formatCurrency(registrationFee, currency)}
                </strong>
              </div>

              <p className="registration-review-note">
                Confirming will submit your registration request.
                Payment is a separate step and is not processed here.
              </p>
            </div>
          )}

          {submissionError && (
            <div
              className="registration-submission-error"
              role="alert"
            >
              {submissionError}
            </div>
          )}
        </div>

        <footer className="registration-modal-footer">
          {reviewing ? (
            <>
              <button
                type="button"
                className="registration-modal-cancel"
                onClick={() => setReviewing(false)}
                disabled={submitting}
              >
                Back
              </button>

              <button
                type="button"
                className="registration-modal-continue"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm request"}
                {!submitting && <CheckCircle2 size={16} />}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="registration-modal-cancel"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="registration-modal-continue"
                onClick={handleContinue}
                disabled={
                  loading ||
                  !!error ||
                  squads.length === 0 ||
                  !selectedSquadId
                }
              >
                Review
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

export default RegistrationRequestModal;
