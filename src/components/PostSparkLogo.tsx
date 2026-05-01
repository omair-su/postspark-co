/**
 * PostSpark animated brand logo.
 * Variants:
 *  - "icon"        → just the rounded square with the spark (square)
 *  - "wordmark"    → icon + "PostSpark" text horizontally
 *  - "stacked"     → icon above PostSpark + tagline
 *  - "badge"       → circular outlined badge
 *
 * All variants share the same animated spark + orbiting glow dots.
 */

type Variant = "icon" | "wordmark" | "stacked" | "badge";

interface PostSparkLogoProps {
  variant?: Variant;
  size?: number;
  className?: string;
  animated?: boolean;
  /** Force light/dark text. Defaults to inherit from theme. */
  tone?: "auto" | "light" | "dark";
}

/**
 * The core spark mark — the rounded square + lightning bolt + orbiting glow dots.
 * Rendered as a self-contained SVG so it scales cleanly anywhere.
 */
function SparkMark({
  size,
  filled = false,
  rounded = "square",
  animated = true,
}: {
  size: number;
  /** filled = solid purple bg with white bolt; otherwise dark slate bg with purple bolt */
  filled?: boolean;
  rounded?: "square" | "circle";
  animated?: boolean;
}) {
  const bg = filled ? "#7C3AED" : "#1E293B";
  const bolt = filled ? "#F1F5F9" : "#7C3AED";
  const radius = rounded === "circle" ? 50 : 22;
  const stroke = rounded === "circle" ? "#7C3AED" : "none";
  const strokeWidth = rounded === "circle" ? 2 : 0;

  const animClass = animated ? "ps-spark-anim" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${animClass}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ps-bg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={filled ? "#8B5CF6" : "#1E293B"} />
          <stop offset="100%" stopColor={filled ? "#6D28D9" : "#0F172A"} />
        </linearGradient>
        <linearGradient id="ps-bolt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={filled ? "#FFFFFF" : "#A78BFA"} />
          <stop offset="100%" stopColor={filled ? "#E9D5FF" : "#7C3AED"} />
        </linearGradient>
        <radialGradient id="ps-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Container */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx={radius}
        fill="url(#ps-bg-grad)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Soft inner glow that pulses */}
      <circle cx="50" cy="50" r="38" fill="url(#ps-glow)" className="ps-pulse" />

      {/* Lightning bolt — translated to be visually centered */}
      <g className="ps-bolt-wrap">
        <polygon
          points="58,18 34,52 50,52 38,82 70,48 52,48"
          fill="url(#ps-bolt-grad)"
        />
      </g>

      {/* Orbiting glow dots */}
      <circle cx="80" cy="22" r="3" fill="#C4B5FD" className="ps-dot ps-dot-1" />
      <circle cx="18" cy="28" r="2.5" fill="#A78BFA" className="ps-dot ps-dot-2" />
      <circle cx="82" cy="78" r="2.5" fill="#DDD6FE" className="ps-dot ps-dot-3" />
      <circle cx="20" cy="80" r="2" fill="#C4B5FD" className="ps-dot ps-dot-4" />
    </svg>
  );
}

export function PostSparkLogo({
  variant = "wordmark",
  size = 32,
  className = "",
  animated = true,
  tone = "auto",
}: PostSparkLogoProps) {
  const textColor =
    tone === "light"
      ? "text-[#F1F5F9]"
      : tone === "dark"
        ? "text-[#0F172A]"
        : "text-foreground";

  if (variant === "icon") {
    return (
      <span className={`inline-flex ${className}`}>
        <SparkMark size={size} filled animated={animated} />
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <span className={`inline-flex ${className}`}>
        <SparkMark size={size} rounded="circle" animated={animated} />
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <SparkMark size={size} filled animated={animated} />
        <div className="flex flex-col items-center">
          <span
            className={`font-extrabold tracking-tight ${textColor}`}
            style={{ fontSize: size * 0.55, lineHeight: 1 }}
          >
            Post<span className="text-[#A78BFA]">Spark</span>
          </span>
          <span
            className="mt-1 text-[#64748B]"
            style={{ fontSize: Math.max(10, size * 0.18) }}
          >
            One piece of content. Endless reach.
          </span>
        </div>
      </div>
    );
  }

  // wordmark (default)
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SparkMark size={size} filled animated={animated} />
      <span
        className={`font-extrabold tracking-tight ${textColor}`}
        style={{ fontSize: size * 0.6, lineHeight: 1 }}
      >
        Post<span className="text-[#A78BFA]">Spark</span>
      </span>
    </span>
  );
}

export default PostSparkLogo;
