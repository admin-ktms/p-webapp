
import { useState } from "react";

import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Clock3,
  RefreshCw,
  Camera,
  ShieldCheck
} from "lucide-react";

import { useAuth } from "../../app/AuthContext";
import { usePlayerProfile } from "../../hooks/profile/usePlayerProfile";

import AvatarSelector from "../../components/profile/AvatarSelector";

import type {
  PlayerAvatarId
} from "../../types/profile.types";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// Preserve date-only values without timezone conversion.
function formatDateOfBirth(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    return Number.isNaN(date.getTime())
      ? "Not available"
      : formatDate(date.toISOString());
  }

  return formatDate(value);
}

function ProfilePage() {
  const { accessLevel } = useAuth();

  const {
    profile,
    loading,
    updatingAvatar,
    error,
    refresh,
    updateAvatar
  } = usePlayerProfile();

  const [avatarModalOpen, setAvatarModalOpen] =
    useState(false);

  const canChangeAvatar = accessLevel === "full";

  const statusClass =
    profile?.player_status.toLowerCase() === "active"
      ? "status-active"
      : profile?.player_status.toLowerCase() === "suspended"
        ? "status-suspended"
        : "status-banned";

  const handleAvatarChange = async (
    avatarId: PlayerAvatarId
  ) => {
    return updateAvatar(avatarId);
  };

  return (
    <section className="profile-page">

      {/* Fixed page header */}
      <header className="profile-page-header">
        <div>
          <p className="profile-eyebrow">
            PLAYER ARENA
          </p>

          <h1>My Profile</h1>

          <p className="profile-page-subtitle">
            Your player identity and personal information.
          </p>
        </div>

        <button
          type="button"
          className="profile-refresh-button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh profile"
          title="Refresh profile"
        >
          <RefreshCw
            size={18}
            className={loading ? "profile-spinner" : ""}
          />
        </button>
      </header>

      {/* Independently scrollable content */}
      <div className="profile-page-scroll">

        {loading && !profile && (
          <div className="profile-state">
            <RefreshCw
              size={25}
              className="profile-spinner"
            />

            <p>Loading your profile...</p>
          </div>
        )}

        {!loading && !profile && error && (
          <div className="profile-state profile-error-state">
            <p>Unable to load your profile.</p>

            <span>{error}</span>

            <button
              type="button"
              className="profile-button-primary"
              onClick={() => void refresh()}
            >
              Try again
            </button>
          </div>
        )}

        {profile && (
          <div className="profile-content">

            {/* Player identity */}
            <section className="profile-identity">
              <div className="profile-avatar">
                {profile.avatar_id ? (
                  <img
                    src={`/avatars/${profile.avatar_id}.svg`}
                    alt="Player avatar"
                  />
                ) : (
                  <UserRound size={45} />
                )}
              </div>

              <div className="profile-identity-details">
                <p className="profile-eyebrow">
                  PLAYER IDENTITY
                </p>

                <h2>{profile.manager_name}</h2>

                <span className="profile-player-id">
                  {profile.player_id}
                </span>

                <div className={`profile-status ${statusClass}`}>
                  <ShieldCheck size={14} />
                  <span>{profile.player_status}</span>
                </div>

                {canChangeAvatar ? (
                  <button
                    type="button"
                    className="profile-avatar-change"
                    onClick={() => setAvatarModalOpen(true)}
                  >
                    <Camera size={15} />
                    Change avatar
                  </button>
                ) : (
                  <p className="profile-restriction-note">
                    Avatar changes are unavailable for restricted accounts.
                  </p>
                )}
              </div>
            </section>

            {/* Profile errors, including avatar update failures */}
            {error && (
              <div
                className="profile-inline-error"
                role="alert"
              >
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => void refresh()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Personal information */}
            <section className="profile-information">
              <div className="profile-section-heading">
                <div>
                  <p className="profile-eyebrow">
                    ACCOUNT INFORMATION
                  </p>

                  <h2>Personal details</h2>
                </div>
              </div>

              <div className="profile-information-grid">

                <div className="profile-information-item">
                  <span className="profile-information-icon">
                    <Mail size={18} />
                  </span>

                  <div>
                    <label>Email address</label>
                    <p>{profile.email_address}</p>
                  </div>
                </div>

                <div className="profile-information-item">
                  <span className="profile-information-icon">
                    <Phone size={18} />
                  </span>

                  <div>
                    <label>WhatsApp number</label>
                    <p>{profile.whatsapp_number}</p>
                  </div>
                </div>

                <div className="profile-information-item">
                  <span className="profile-information-icon">
                    <CalendarDays size={18} />
                  </span>

                  <div>
                    <label>Date of birth</label>
                    <p>
                      {formatDateOfBirth(profile.date_of_birth)}
                    </p>
                  </div>
                </div>

                <div className="profile-information-item">
                  <span className="profile-information-icon">
                    <Clock3 size={18} />
                  </span>

                  <div>
                    <label>Player since</label>
                    <p>
                      {formatDate(profile.created_datetime)}
                    </p>
                  </div>
                </div>

              </div>
            </section>

          </div>
        )}

      </div>

      {/* Avatar selection */}
      <AvatarSelector
        currentAvatar={profile?.avatar_id ?? null}
        open={avatarModalOpen && canChangeAvatar}
        saving={updatingAvatar}
        onClose={() => setAvatarModalOpen(false)}
        onConfirm={handleAvatarChange}
      />

    </section>
  );
}

export default ProfilePage;
