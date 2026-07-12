import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Copy, Check, Plus, Info } from "lucide-react";
import type { StockPhoto } from "@/server/stockMedia.server";
import { StockAttribution } from "./StockAttribution";
import { StockAttributionModal } from "./StockAttributionModal";
import { trackUnsplashUse } from "@/lib/stockMedia.functions";
import { toast } from "sonner";

interface Props {
  photo: StockPhoto;
  onSelect?: (photo: StockPhoto) => void;
  selectLabel?: string;
}

export function StockPhotoCard({ photo, onSelect, selectLabel = "Use photo" }: Props) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const trackUse = useServerFn(trackUnsplashUse);

  async function fireUnsplashTracking() {
    if (photo.source !== "unsplash" || !photo.downloadLocation) return;
    try {
      await trackUse({ data: { downloadLocation: photo.downloadLocation } });
    } catch (e) {
      // Not user-facing — this is a compliance ping.
      console.warn("Unsplash tracking failed", e);
    }
  }

  async function handleCopy() {
    await fireUnsplashTracking();
    try {
      await navigator.clipboard.writeText(photo.regularUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Image URL copied");
    } catch {
      toast.error("Could not copy URL");
    }
  }

  async function handleSelect() {
    await fireUnsplashTracking();
    onSelect?.(photo);
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-muted/30">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative block aspect-[4/3] w-full overflow-hidden text-left"
          aria-label={`Preview photo by ${photo.photographerName}`}
        >
          {/* Hotlinked provider URL — never re-hosted */}
          <img
            src={photo.thumbUrl}
            alt={photo.alt || `Photo by ${photo.photographerName} on ${photo.source}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto">


          {/* Hover action bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
            {onSelect && (
              <button
                type="button"
                onClick={handleSelect}
                className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow hover:bg-white"
              >
                <Plus className="h-3 w-3" />
                {selectLabel}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow hover:bg-white"
              aria-label="Copy image URL"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow hover:bg-white"
              aria-label="Attribution & download"
            >
              <Download className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-black shadow hover:bg-white"
              aria-label="More info"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>

          {/* Always-on attribution overlay (never hidden, never cropped) */}
          <StockAttribution photo={photo} />
        </div>
      </div>

      <StockAttributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        asset={{ kind: "photo", photo }}
      />
    </>
  );
}

