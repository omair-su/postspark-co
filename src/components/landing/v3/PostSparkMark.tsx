import iconSrc from "@/assets/postspark-icon.png";

interface Props {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * The official PostSpark brand mark — luxury glass prism spark.
 * Renders the premium PNG asset with an optional halo glow.
 * Use everywhere in place of a "P" placeholder icon.
 */
export function PostSparkMark({ size = 32, className = "", glow = true }: Props) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {glow && (
        <span
          className="absolute inset-0 rounded-full blur-md opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(6,182,212,0.35) 45%, transparent 75%)",
          }}
        />
      )}
      <img
        src={iconSrc}
        alt=""
        width={size}
        height={size}
        className="relative block h-full w-full object-contain"
        style={{ filter: "drop-shadow(0 6px 14px rgba(124,58,237,0.45))" }}
        decoding="async"
      />
    </span>
  );
}

/**
 * Wordmark: brand mark + "PostSpark" text using Instrument Serif display font.
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
        className="font-display-lux"
        style={{
          color,
          fontSize: size * 0.78,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}
      >
        PostSpark
      </span>
    </span>
  );
}
