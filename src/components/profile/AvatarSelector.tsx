
import { useEffect, useState } from "react";

import { Check, LoaderCircle, X } from "lucide-react";

import {
  PLAYER_AVATAR_IDS,
  type PlayerAvatarId
} from "../../types/profile.types";

interface AvatarSelectorProps {
  currentAvatar: PlayerAvatarId | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: (avatarId: PlayerAvatarId) => Promise<boolean>;
}

const avatarNames: Record<PlayerAvatarId, string> = {
  avatar_01: "Striker",
  avatar_02: "Captain",
  avatar_03: "Playmaker",
  avatar_04: "Keeper",
  avatar_05: "Winger",
  avatar_06: "Veteran",
  avatar_07: "Rookie",
  avatar_08: "Legend"
};

function AvatarSelector({
  currentAvatar,
  open,
  saving,
  onClose,
  onConfirm
}: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] =
    useState<PlayerAvatarId | null>(currentAvatar);

  useEffect(() => {
    if (open) {
      setSelectedAvatar(currentAvatar);
    }
  }, [open, currentAvatar]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!selectedAvatar || saving) return;

    if (selectedAvatar === currentAvatar) {
      onClose();
      return;
    }

    const success = await onConfirm(selectedAvatar);

    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="avatar-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <section
        className="avatar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <header className="avatar-modal-header">
          <div>
            <p className="profile-eyebrow">
              PLAYER CUSTOMIZATION
            </p>

            <h2 id="avatar-modal-title">
              Choose your avatar
            </h2>

            <p>
              Select an identity that represents you.
            </p>
          </div>

          <button
            type="button"
            className="avatar-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close avatar selector"
          >
            <X size={20} />
          </button>
        </header>

        <div className="avatar-grid">
          {PLAYER_AVATAR_IDS.map((avatarId) => {
            const selected = selectedAvatar === avatarId;
            const current = currentAvatar === avatarId;

            return (
              <button
                key={avatarId}
                type="button"
                className={`avatar-option ${
                  selected ? "selected" : ""
                }`}
                onClick={() => setSelectedAvatar(avatarId)}
                disabled={saving}
                aria-pressed={selected}
                aria-label={`${avatarNames[avatarId]} avatar${
                  current ? ", currently selected" : ""
                }`}
              >
                <span className="avatar-option-image">
                  <img
                    src={`/avatars/${avatarId}.svg`}
                    alt=""
                  />

                  {selected && (
                    <span className="avatar-selected-check">
                      <Check size={14} />
                    </span>
                  )}
                </span>

                <span className="avatar-option-name">
                  {avatarNames[avatarId]}
                </span>

                {current && (
                  <span className="avatar-current-label">
                    CURRENT
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <footer className="avatar-modal-footer">
          <button
            type="button"
            className="profile-button-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="profile-button-primary"
            onClick={() => void handleConfirm()}
            disabled={
              saving ||
              !selectedAvatar ||
              selectedAvatar === currentAvatar
            }
          >
            {saving ? (
              <>
                <LoaderCircle
                  size={17}
                  className="profile-spinner"
                />
                Saving...
              </>
            ) : (
              "Confirm avatar"
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default AvatarSelector;
