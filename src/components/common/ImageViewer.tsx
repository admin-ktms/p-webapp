import { useEffect, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

export interface ViewerImage {
  src: string;
  alt: string;
}

interface ImageViewerProps {
  images: ViewerImage[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

function ImageViewer({
  images,
  initialIndex = 0,
  open,
  onClose
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] =
    useState(initialIndex);

  useEffect(() => {
    if (open) {
      setCurrentIndex(
        Math.max(
          0,
          Math.min(initialIndex, images.length - 1)
        )
      );
    }
  }, [open, initialIndex, images.length]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((current) =>
          current > 0 ? current - 1 : current
        );
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((current) =>
          current < images.length - 1
            ? current + 1
            : current
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, images.length, onClose]);

  if (!open || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const previousImage = () => {
    setCurrentIndex((current) =>
      current > 0 ? current - 1 : current
    );
  };

  const nextImage = () => {
    setCurrentIndex((current) =>
      current < images.length - 1
        ? current + 1
        : current
    );
  };

  return (
    <div
      className="image-viewer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="image-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        <header className="image-viewer-header">
          <span>
            Image {currentIndex + 1} of {images.length}
          </span>

          <button
            type="button"
            className="image-viewer-close"
            onClick={onClose}
            aria-label="Close image viewer"
          >
            <X size={22} />
          </button>
        </header>

        <div className="image-viewer-content">
          {currentIndex > 0 && (
            <button
              type="button"
              className="image-viewer-nav image-viewer-previous"
              onClick={previousImage}
              aria-label="Previous image"
            >
              <ChevronLeft size={25} />
            </button>
          )}

          <img
            key={currentImage.src}
            src={currentImage.src}
            alt={currentImage.alt}
          />

          {currentIndex < images.length - 1 && (
            <button
              type="button"
              className="image-viewer-nav image-viewer-next"
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight size={25} />
            </button>
          )}
        </div>

        <footer className="image-viewer-footer">
          {currentImage.alt}
        </footer>
      </section>
    </div>
  );
}

export default ImageViewer;
