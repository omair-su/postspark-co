import iconAsset from "@/assets/postspark-icon-v2.png.asset.json";

interface Props {
  size?: number;
  className?: string;
  /** Kept for API compatibility — the new mark ships without a halo. */
  glow?: boolean;
}

/**
 * Official PostSpark brand mark — v2 solid squircle style
 * (Claude / Perplexity / Gemini / Apple family). No glass, no glow.
 */
export function PostSparkMark({ size = 32, className = "" }: Props) {
  return (
    <img
      src={iconAsset.url}
      alt=""
      width={size}
      height={size}
      className={`block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
      decoding="async"
      aria-hidden
    />
  );
}

/**
 * Wordmark: mark + "PostSpark" text using the display font.
 */
export function PostSparkWordmark({
  size = 28,
  tone = "light",
  className = "",
}: {
  size?: number;
  tone?: "light" | "dark";
  className?: string;
}) {
  const color = tone === "light" ? "#FAFAF9" : "#0F172A";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PostSparkMark size={size} />
      <span
        className="font-display font-semibold"
        style={{
          color,
          fontSize: size * 0.78,
          lineHeight: 1,
          letterSpacing: "-0.025em",
        }}
      >
        PostSpark
      </span>
    </span>
  );
}
