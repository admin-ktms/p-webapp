import { useEffect, useRef, useState, type ChangeEvent } from "react";

import {
  ImagePlus,
  LoaderCircle,
  Trash2,
  X
} from "lucide-react";

import { squadService } from "../../services/squad.service";

import type {
  SquadScreenshot
} from "../../types/squad.types";

interface SquadScreenshotManagerProps {
  playerId: string;
  squadId: string;
  squadName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface PendingScreenshot {
  key: string;
  file: File;
  previewUrl: string;
  uploadedPath?: string;
}

const MAX_SCREENSHOTS = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The screenshot operation could not be completed.";
}

function SquadScreenshotManager({
  playerId,
  squadId,
  squadName,
  open,
  onClose,
  onSaved
}: SquadScreenshotManagerProps) {
  const [existingScreenshots, setExistingScreenshots] =
    useState<SquadScreenshot[]>([]);

  const [retainedIds, setRetainedIds] =
    useState<string[]>([]);

  const [newFiles, setNewFiles] =
    useState<PendingScreenshot[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const newFilesRef = useRef<PendingScreenshot[]>([]);

  const updateNewFiles = (
    updater: (
      current: PendingScreenshot[]
    ) => PendingScreenshot[]
  ) => {
    setNewFiles((current) => {
      const updated = updater(current);
      newFilesRef.current = updated;
      return updated;
    });
  };

  // Load current screenshots whenever the manager opens.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setLoading(true);
    setLoadFailed(false);
    setError(null);
    setExistingScreenshots([]);
    setRetainedIds([]);
    setNewFiles([]);
    newFilesRef.current = [];

    squadService.getScreenshots(squadId)
      .then((result) => {
        if (cancelled) return;

        setExistingScreenshots(result.screenshots);

        setRetainedIds(
          result.screenshots.map(
            (screenshot) => screenshot.screenshot_id
          )
        );
      })
      .catch((err) => { 
        if (cancelled) return;
        setLoadFailed(true);
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, squadId]);

  // Revoke locally generated image previews on unmount.
  useEffect(() => {
    return () => {
      newFilesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const totalSelected =
    retainedIds.length + newFiles.length;

  const isRetained = (id: string) =>
    retainedIds.includes(id);

  const toggleExistingScreenshot = (id: string) => {
    setError(null);

    setRetainedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length + newFiles.length >= MAX_SCREENSHOTS) {
        setError("A squad cannot have more than three screenshots.");
        return current;
      }

      return [...current, id];
    });
  };

  const handleFileSelection = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    event.target.value = "";

    if (selectedFiles.length === 0) return;

    setError(null);

    const availableSlots =
      MAX_SCREENSHOTS - totalSelected;

    if (selectedFiles.length > availableSlots) {
      setError(
        `You can add only ${availableSlots} more screenshot(s).`
      );
      return;
    }

    for (const file of selectedFiles) {
      if (
        file.type !== "image/jpeg" &&
        file.type !== "image/png"
      ) {
        setError("Only JPEG and PNG images are allowed.");
        return;
      }

      if (
        file.size <= 0 ||
        file.size > MAX_FILE_SIZE
      ) {
        setError("Each screenshot must be between 1 byte and 2 MB.");
        return;
      }
    }

    const additions: PendingScreenshot[] =
      selectedFiles.map((file) => ({
        key: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    updateNewFiles((current) => [
      ...current,
      ...additions
    ]);
  };

  const removeNewFile = (key: string) => {
    updateNewFiles((current) => {
      const removed = current.find(
        (item) => item.key === key
      );

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return current.filter(
        (item) => item.key !== key
      );
    });
  };

  const handleSave = async () => {
    if (saving || loading) return;

    if (totalSelected < 1 || totalSelected > MAX_SCREENSHOTS) {
      setError("A squad must have between one and three screenshots.");
      return;
    }

    const screenshotsChanged =
      newFiles.length > 0 ||
      retainedIds.length !== existingScreenshots.length;

    if (!screenshotsChanged) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const uploadedPaths: string[] = [];

      // Upload only files that have not already been uploaded.
      // This also avoids duplicate uploads when the database
      // update fails and the player retries.
      for (const item of newFiles) {
        let path = item.uploadedPath;

        if (!path) {
          path = await squadService.uploadScreenshot(
            playerId,
            squadId,
            item.file
          );

          updateNewFiles((current) =>
            current.map((currentItem) =>
              currentItem.key === item.key
                ? {
                    ...currentItem,
                    uploadedPath: path
                  }
                : currentItem
            )
          );
        }

        uploadedPaths.push(path);
      }

      await squadService.update({
        squad_id: squadId,
        screenshot_ids: retainedIds,
        screenshot_paths: uploadedPaths
      });

      await onSaved();

      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="squad-screenshot-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="squad-screenshot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="squad-screenshot-title"
      >
        <header className="squad-screenshot-header">
          <div>
            <p className="profile-eyebrow">
              SQUAD MANAGEMENT
            </p>

            <h2 id="squad-screenshot-title">
              Manage screenshots
            </h2>

            <p>{squadName}</p>
          </div>

          <button
            type="button"
            className="profile-squad-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="squad-screenshot-body">
          <div className="squad-screenshot-summary">
            <strong>
              {totalSelected}/{MAX_SCREENSHOTS} selected
            </strong>

            <span>
              JPEG or PNG · Maximum 2 MB each
            </span>
          </div>

          {loading && (
            <div className="squad-screenshot-state">
              <LoaderCircle
                size={21}
                className="profile-spinner"
              />
              Loading screenshots...
            </div>
          )}

          {!loading && (
            <>
              {existingScreenshots.length > 0 && (
                <div className="squad-screenshot-group">
                  <h3>Current screenshots</h3>

                  <div className="squad-screenshot-grid">
                    {existingScreenshots.map((item) => {
                      const retained = isRetained(
                        item.screenshot_id
                      );

                      return (
                        <article
                          key={item.screenshot_id}
                          className={
                            `squad-screenshot-item ${
                              retained ? "" : "is-removed"
                            }`
                          }
                        >
                          <img
                            src={item.signed_url}
                            alt={`Current screenshot ${item.screenshot_slot}`}
                          />

                          <div>
                            <span>
                              Screenshot {item.screenshot_slot}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                toggleExistingScreenshot(
                                  item.screenshot_id
                                )
                              }
                              disabled={
                                saving ||
                                (!retained &&
                                  totalSelected >= MAX_SCREENSHOTS)
                              }
                            >
                              {retained ? (
                                <>
                                  <Trash2 size={13} />
                                  Remove
                                </>
                              ) : (
                                "Keep"
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="squad-screenshot-group">
                <h3>New screenshots</h3>

                {newFiles.length > 0 && (
                  <div className="squad-screenshot-grid">
                    {newFiles.map((item) => (
                      <article
                        key={item.key}
                        className="squad-screenshot-item"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                        />

                        <div>
                          <span>
                            {item.file.name}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeNewFile(item.key)
                            }
                            disabled={saving}
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={handleFileSelection}
                  disabled={
                    saving ||
                    totalSelected >= MAX_SCREENSHOTS
                  }
                />

                <button
                  type="button"
                  className="squad-screenshot-add"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    saving ||
                    totalSelected >= MAX_SCREENSHOTS
                  }
                >
                  <ImagePlus size={18} />
                  Add screenshots
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="squad-screenshot-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="squad-screenshot-footer">
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
            onClick={() => void handleSave()}
            disabled={
              loading ||
              saving ||
              totalSelected < 1 ||
              (
                newFiles.length === 0 &&
                retainedIds.length === existingScreenshots.length
              )
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
            ) : (
              "Save screenshots"
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default SquadScreenshotManager;
