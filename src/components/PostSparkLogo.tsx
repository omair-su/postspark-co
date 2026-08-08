/**
 * PostSpark brand logo — v2 (million-dollar AI style).
 * Solid, confident squircle mark inspired by Claude / Perplexity / Gemini / Apple.
 * No glow, no orbiting dots, no glassmorphism. Just a premium, iconic brand mark.
 *
 * Variants:
 *  - "icon"      → just the squircle mark
 *  - "wordmark"  → mark + "PostSpark" (horizontal)
 *  - "stacked"   → mark above name + tagline
 *  - "badge"     → alias of icon (kept for API compatibility)
 */

import { BoltMark } from "@/components/BoltMark";

type Variant = "icon" | "wordmark" | "stacked" | "badge";

interface PostSparkLogoProps {
  variant?: Variant;
  size?: number;
  className?: string;
  /** Kept for API compatibility — new mark is intentionally still, not animated. */
  animated?: boolean;
  tone?: "auto" | "light" | "dark";
}

function Mark({ size }: { size: number }) {
  return <BoltMark size={size} />;
}


export function PostSparkLogo({
  variant = "wordmark",
  size = 32,
  className = "",
  tone = "auto",
}: PostSparkLogoProps) {
  const textColor =
    tone === "light"
      ? "text-[#F5F5F4]"
      : tone === "dark"
        ? "text-[#0F172A]"
        : "text-foreground";

  if (variant === "icon" || variant === "badge") {
    return (
      <span className={`inline-flex ${className}`}>
        <Mark size={size} />
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`inline-flex flex-col items-center gap-2.5 ${className}`}>
        <Mark size={size} />
        <div className="flex flex-col items-center">
          <span
            className={`font-display font-semibold tracking-tight ${textColor}`}
            style={{ fontSize: size * 0.5, lineHeight: 1 }}
          >
            PostSpark
          </span>
          <span
            className="mt-1 text-muted-foreground"
            style={{ fontSize: Math.max(10, size * 0.17) }}
          >
            One piece of content. Endless reach.
          </span>
        </div>
      </div>
    );
  }

  // wordmark (default)
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={size} />
      <span
        className={`font-display font-bold tracking-tight ${textColor}`}
        style={{ fontSize: size * 0.58, lineHeight: 1, letterSpacing: "-0.02em" }}
      >
        Post
        <span
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Spark
        </span>
      </span>
    </span>
  );
}


export default PostSparkLogo;
