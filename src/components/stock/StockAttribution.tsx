import type { StockPhoto } from "@/lib/stockMedia.server";

const UTM = "utm_source=postspark&utm_medium=referral";

interface Props {
  photo: Pick<StockPhoto, "source" | "photographerName" | "photographerUrl" | "sourceUrl">;
  variant?: "overlay" | "inline";
  className?: string;
}

/**
 * Attribution required by Unsplash's API guidelines and shown for Pexels too
 * for parity. Renders "Photo by <Name> on <Provider>" with both parts as
 * links opening in new tabs. On photo cards it overlays the bottom-left
 * with a subtle dark gradient so it's always readable and never cropped.
 */
export function StockAttribution({ photo, variant = "overlay", className = "" }: Props) {
  const providerLabel = photo.source === "unsplash" ? "Unsplash" : "Pexels";
  const providerUrl =
    photo.source === "unsplash"
      ? `https://unsplash.com/?${UTM}`
      : "https://www.pexels.com";

  const linkClass =
    variant === "overlay"
      ? "underline decoration-white/40 hover:decoration-white text-white/95"
      : "underline decoration-black/30 hover:decoration-black text-black/70";

  const content = (
    <span style={{ fontSize: 11, lineHeight: "14px" }}>
      Photo by{" "}
      <a
        href={photo.photographerUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={linkClass}
      >
        {photo.photographerName}
      </a>{" "}
      on{" "}
      <a
        href={providerUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={linkClass}
      >
        {providerLabel}
      </a>
    </span>
  );

  if (variant === "inline") {
    return (
      <div
        className={className}
        style={{ color: "rgba(0,0,0,0.6)", fontSize: 11 }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 px-2 py-1.5 ${className}`}
      style={{
        background:
          "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0) 100%)",
      }}
    >
      <div className="pointer-events-auto" style={{ color: "rgba(255,255,255,0.9)" }}>
        {content}
      </div>
    </div>
  );
}
