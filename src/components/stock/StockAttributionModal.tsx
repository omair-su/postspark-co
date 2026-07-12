import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, ExternalLink, Download, X } from "lucide-react";
import type { StockPhoto, StockVideo } from "@/server/stockMedia.server";
import { trackUnsplashUse } from "@/lib/stockMedia.functions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  asset:
    | { kind: "photo"; photo: StockPhoto }
    | { kind: "video"; video: StockVideo };
}

/**
 * Modal shown when a user clicks download / more on a stock card.
 * - Displays full attribution text ("Photo by X on Unsplash/Pexels")
 * - Copy source URL button
 * - Opens provider page in a new tab (required for Unsplash tracking + credit)
 * - For Unsplash photos, pings the download_location endpoint on download.
 */
export function StockAttributionModal({ open, onClose, asset }: Props) {
  const [copied, setCopied] = useState(false);
  const trackUse = useServerFn(trackUnsplashUse);

  if (!open) return null;

  const isPhoto = asset.kind === "photo";
  const source: "unsplash" | "pexels" = isPhoto ? asset.photo.source : "pexels";
  const providerLabel = source === "unsplash" ? "Unsplash" : "Pexels";
  const providerUrl =
    source === "unsplash"
      ? "https://unsplash.com/?utm_source=postspark&utm_medium=referral"
      : "https://www.pexels.com";
  const photographerName = isPhoto ? asset.photo.photographerName : asset.video.photographerName;
  const photographerUrl = isPhoto ? asset.photo.photographerUrl : asset.video.photographerUrl;
  const sourceUrl = isPhoto ? asset.photo.sourceUrl : asset.video.sourceUrl;
  const thumbUrl = isPhoto ? asset.photo.regularUrl : asset.video.thumbUrl;
  const downloadUrl = isPhoto ? asset.photo.fullUrl : asset.video.downloadUrl;
  const alt = isPhoto ? asset.photo.alt || `Photo by ${photographerName}` : `Video by ${photographerName}`;

  async function fireUnsplashTracking() {
    if (!isPhoto) return;
    const p = (asset as { kind: "photo"; photo: StockPhoto }).photo;
    if (p.source !== "unsplash" || !p.downloadLocation) return;
    try {
      await trackUse({ data: { downloadLocation: p.downloadLocation } });
    } catch (e) {
      console.warn("Unsplash tracking failed", e);
    }
  }

  const attributionText = `${isPhoto ? "Photo" : "Video"} by ${photographerName} on ${providerLabel} — ${sourceUrl}`;

  async function copySource() {
    try {
      await navigator.clipboard.writeText(sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Source link copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function copyAttribution() {
    try {
      await navigator.clipboard.writeText(attributionText);
      toast.success("Attribution text copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function handleDownload() {
    // Fire Unsplash attribution ping (required by their API) but do NOT navigate away.
    fireUnsplashTracking().catch(() => {});
    const ext = isPhoto ? "jpg" : "mp4";
    const assetId = asset.kind === "photo" ? asset.photo.id : asset.video.id;
    const safeName = photographerName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "postspark";
    const filename = `postspark-${providerLabel.toLowerCase()}-${safeName}-${assetId}.${ext}`;
    // Route through our same-origin proxy so the browser downloads in-app
    // (attachment header) instead of navigating to Unsplash/Pexels.
    const proxied = `/api/public/stock-download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
    try {
      toast.loading("Preparing download…", { id: "stock-dl" });
      const res = await fetch(proxied);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success(`${isPhoto ? "Photo" : "Video"} downloaded — remember to credit ${photographerName}.`, { id: "stock-dl" });
    } catch (e) {
      console.warn("Stock download proxy failed, falling back to direct anchor", e);
      // Same-origin anchor with download attr — still keeps user in-app.
      const a = document.createElement("a");
      a.href = proxied;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Download started", { id: "stock-dl" });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {isPhoto ? (
            <img src={thumbUrl} alt={alt} className="max-h-[55vh] w-full object-contain bg-black" />
          ) : (
            <video
              src={(asset as { kind: "video"; video: StockVideo }).video.previewUrl}
              poster={thumbUrl}
              controls
              autoPlay
              muted
              className="max-h-[55vh] w-full bg-black"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Required attribution
            </p>
            <p className="mt-1 text-sm text-foreground">
              {isPhoto ? "Photo" : "Video"} by{" "}
              <a
                href={photographerUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold text-primary underline"
              >
                {photographerName}
              </a>{" "}
              on{" "}
              <a
                href={providerUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold text-primary underline"
              >
                {providerLabel}
              </a>
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-mono break-all">{sourceUrl}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copySource}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy source link
            </button>
            <button
              type="button"
              onClick={copyAttribution}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy attribution text
            </button>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open on {providerLabel}
            </a>
            <button
              type="button"
              onClick={handleDownload}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {source === "unsplash"
              ? "Downloads are tracked with Unsplash so photographers get view credit — required by their API guidelines."
              : "Attribution is appreciated on Pexels — the credit link above is auto-generated for you."}
          </p>
        </div>
      </div>
    </div>
  );
}
