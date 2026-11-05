import { useState, type FormEvent } from "react";

import {
  Plus,
  MoreVertical,
  Pencil,
  Image as ImageIcon,
  Trash2,
  X,
  LoaderCircle,
  RefreshCw
} from "lucide-react";

import { usePlayerSquads } from "../../hooks/profile/usePlayerSquads";
import { squadService } from "../../services/squad.service";

import ImageViewer, {
  type ViewerImage
} from "../common/ImageViewer";

import type {
  PlayerSquad
} from "../../types/squad.types";

type ModalMode = "create" | "edit" | null;

function formatSquadDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed.";
}

function PlayerSquads() {
  const {
    squadCount,
    squads,
    loading,
    error,
    refresh
  } = usePlayerSquads();

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [selectedSquad, setSelectedSquad] =
    useState<PlayerSquad | null>(null);

  const [squadName, setSquadName] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [deletingSquadId, setDeletingSquadId] =
    useState<string | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [viewerOpen, setViewerOpen] =
    useState(false);

  const [viewerImages, setViewerImages] =
    useState<ViewerImage[]>([]);

  const [viewerLoading, setViewerLoading] =
    useState<string | null>(null);

  const [viewerError, setViewerError] =
    useState<string | null>(null);

  const canCreate = squadCount < 3;

  const openCreateModal = () => {
    setSelectedSquad(null);
    setSquadName("");
    setActionError(null);
    setModalMode("create");
    setOpenMenuId(null);
  };

  const openEditModal = (squad: PlayerSquad) => {
    setSelectedSquad(squad);
    setSquadName(squad.squad_name);
    setActionError(null);
    setModalMode("edit");
    setOpenMenuId(null);
  };

  const closeModal = () => {
    if (saving) return;

    setModalMode(null);
    setSelectedSquad(null);
    setSquadName("");
    setActionError(null);
  };

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = squadName.trim();

    if (!trimmedName || saving) return;

    setSaving(true);
    setActionError(null);

    try {
      if (modalMode === "create") {
        await squadService.create({
          squad_name: trimmedName
        });
      } else if (
        modalMode === "edit" &&
        selectedSquad
      ) {
        await squadService.update({
          squad_id: selectedSquad.squad_id,
          squad_name: trimmedName
        });
      }

      setModalMode(null);
      setSelectedSquad(null);
      setSquadName("");

      await refresh();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (squad: PlayerSquad) => {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Delete "${squad.squad_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingSquadId(squad.squad_id);
    setActionError(null);

    try {
      const result = await squadService.delete(
        squad.squad_id
      );

      if (!result.success) {
        throw new Error(
          result.reason_code || "The squad could not be deleted."
        );
      }

      await refresh();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeletingSquadId(null);
    }
  };

  const handleViewScreenshots = async (
    squad: PlayerSquad
  ) => {
    if (viewerLoading) return;

    setViewerError(null);
    setViewerImages([]);
    setViewerLoading(squad.squad_id);

    try {
      const result = await squadService.getScreenshots(
        squad.squad_id
      );

      const images = result.screenshots.map(
        (screenshot, index) => ({
          src: screenshot.signed_url,
          alt: `${squad.squad_name} screenshot ${index + 1}`
        })
      );

      if (images.length === 0) {
        setViewerError("No screenshots are available for this squad.");
        return;
      }

      setViewerImages(images);
      setViewerOpen(true);
    } catch (err) {
      setViewerError(getErrorMessage(err));
    } finally {
      setViewerLoading(null);
    }
  };

  return (
    <section className="profile-squads">

      <div className="profile-section-heading profile-squads-heading">
        <div>
          <p className="profile-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h2>
            My Squads
            <span className="profile-squad-count">
              {squadCount}/3
            </span>
          </h2>

          <p className="profile-squads-description">
            Manage the squads associated with your player account.
          </p>
        </div>

        <button
          type="button"
          className="profile-squad-add-button"
          onClick={openCreateModal}
          disabled={!canCreate || loading}
          aria-label="Create squad"
          title={
            canCreate
              ? "Create squad"
              : "You have reached the maximum of three squads"
          }
        >
          <Plus size={20} />
        </button>
      </div>

      {actionError && !modalMode && (
        <div className="profile-inline-error" role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {viewerError && (
        <div className="profile-inline-error" role="alert">
          <span>{viewerError}</span>
          <button
            type="button"
            onClick={() => setViewerError(null)}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div className="profile-squads-state">
          <RefreshCw
            size={21}
            className="profile-spinner"
          />
          <span>Loading your squads...</span>
        </div>
      )}

      {!loading && error && (
        <div className="profile-squads-state profile-squads-error">
          <span>{error}</span>

          <button
            type="button"
            className="profile-button-secondary"
            onClick={() => void refresh()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && squads.length === 0 && (
        <div className="profile-squads-empty">
          <div className="profile-squads-empty-icon">
            <ImageIcon size={25} />
          </div>

          <strong>No squads yet</strong>

          <p>
            Create your first squad to get started.
          </p>

          <button
            type="button"
            className="profile-button-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Create squad
          </button>
        </div>
      )}

      {!loading && !error && squads.length > 0 && (
        <div className="profile-squad-grid">
          {squads.map((squad) => (
            <article
              key={squad.squad_id}
              className="profile-squad-card"
            >
              <div className="profile-squad-card-top">
                <span className="profile-squad-slot">
                  SQUAD {squad.squad_slot}
                </span>

                <div className="profile-squad-menu-wrapper">
                  <button
                    type="button"
                    className="profile-squad-menu-button"
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === squad.squad_id
                          ? null
                          : squad.squad_id
                      )
                    }
                    aria-label={`Actions for ${squad.squad_name}`}
                    aria-expanded={
                      openMenuId === squad.squad_id
                    }
                  >
                    <MoreVertical size={19} />
                  </button>

                  {openMenuId === squad.squad_id && (
                    <div className="profile-squad-menu">
                      <button
                        type="button"
                        onClick={() => openEditModal(squad)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled
                        title="Screenshot replacement will be implemented in Stage 3"
                      >
                        <ImageIcon size={15} />
                        Update
                      </button>

                      <button
                        type="button"
                        className="danger"
                        disabled={
                          deletingSquadId === squad.squad_id
                        }
                        onClick={() => void handleDelete(squad)}
                      >
                        {deletingSquadId === squad.squad_id ? (
                          <LoaderCircle
                            size={15}
                            className="profile-spinner"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3>{squad.squad_name}</h3>

              <p className="profile-squad-created">
                Created {formatSquadDate(squad.created_datetime)}
              </p>

              <button
                type="button"
                className="profile-squad-view-button"
                onClick={() => void handleViewScreenshots(squad)}
                disabled={viewerLoading === squad.squad_id}
              >
                {viewerLoading === squad.squad_id ? (
                  <LoaderCircle
                    size={16}
                    className="profile-spinner"
                  />
                ) : (
                  <ImageIcon size={16} />
                )}

                View screenshots
              </button>
            </article>
          ))}
        </div>
      )}

      {modalMode && (
        <div
          className="profile-squad-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="profile-squad-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-squad-modal-title"
          >
            <header className="profile-squad-modal-header">
              <div>
                <p className="profile-eyebrow">
                  SQUAD MANAGEMENT
                </p>

                <h2 id="profile-squad-modal-title">
                  {modalMode === "create"
                    ? "Create squad"
                    : "Edit squad"}
                </h2>
              </div>

              <button
                type="button"
                className="profile-squad-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="profile-squad-modal-body">
                <label htmlFor="profile-squad-name">
                  Squad name
                </label>

                <input
                  id="profile-squad-name"
                  type="text"
                  value={squadName}
                  onChange={(event) =>
                    setSquadName(event.target.value)
                  }
                  maxLength={80}
                  required
                  autoFocus
                  placeholder="Enter your squad name"
                  disabled={saving}
                />

                {actionError && (
                  <p
                    className="profile-squad-modal-error"
                    role="alert"
                  >
                    {actionError}
                  </p>
                )}
              </div>

              <footer className="profile-squad-modal-footer">
                <button
                  type="button"
                  className="profile-button-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-button-primary"
                  disabled={
                    saving ||
                    !squadName.trim() ||
                    (modalMode === "edit" &&
                      squadName.trim() === selectedSquad?.squad_name)
                  }
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="profile-spinner"
                      />
                      Saving...
                    </>
                  ) : modalMode === "create" ? (
                    "Create squad"
                  ) : (
                    "Save changes"
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

    </section>
  );
}

export default PlayerSquads;
