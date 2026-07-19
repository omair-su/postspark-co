import { X } from "lucide-react";
import type { StockPhoto, StockVideo } from "@/lib/stockMedia.server";
import { StockMediaPicker } from "./StockMediaPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectPhoto?: (photo: StockPhoto) => void;
  onSelectVideo?: (video: StockVideo) => void;
  selectLabel?: string;
  title?: string;
}

/**
 * Full-screen modal wrapping StockMediaPicker. Renders as an overlay so it
 * works inside routes that don't already use shadcn Dialog. onSelectPhoto /
 * onSelectVideo receive the picked asset — the picker still fires Unsplash
 * download tracking internally via StockPhotoCard.
 */
export function StockPickerDialog({
  open,
  onClose,
  initialQuery = "workspace",
  onSelectPhoto,
  onSelectVideo,
  selectLabel = "Use photo",
  title = "Stock library",
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              Unsplash & Pexels — attribution and download tracking handled automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">
          <StockMediaPicker
            initialQuery={initialQuery}
            onSelectPhoto={(p) => {
              onSelectPhoto?.(p);
              onClose();
            }}
            onSelectVideo={(v) => {
              onSelectVideo?.(v);
              onClose();
            }}
            selectLabel={selectLabel}
          />
        </div>
      </div>
    </div>
  );
}
