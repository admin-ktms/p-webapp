
import { useState } from "react";
import {
  X,
  Users,
  RefreshCw,
  ArrowRight
} from "lucide-react";

import { usePlayerSquads } from "../../hooks/profile/usePlayerSquads";

interface RegistrationRequestModalProps {
  tournamentName: string;
  onClose: () => void;
  onContinue: (squadId: string) => void;
}

function RegistrationRequestModal({
  tournamentName,
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
    useState<string>("");

  function handleContinue() {
    if (!selectedSquadId) {
      return;
    }

    onContinue(selectedSquadId);
  }

  return (
    <div
      className="registration-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
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
              Select your squad
            </h2>
          </div>

          <button
            type="button"
            className="registration-modal-close"
            onClick={onClose}
            aria-label="Close registration window"
          >
            <X size={19} />
          </button>
        </header>

        <div className="registration-modal-body">
          <div className="registration-modal-tournament">
            <span>Tournament</span>
            <strong>{tournamentName}</strong>
          </div>

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
              {squads.map((squad) => {
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
                      {selected && (
                        <span />
                      )}
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
        </div>

        <footer className="registration-modal-footer">
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
            Continue
            <ArrowRight size={16} />
          </button>
        </footer>
      </section>
    </div>
  );
}

export default RegistrationRequestModal;
