import { BoltMark } from "@/components/BoltMark";

interface Props {
  size?: number;
  className?: string;
  /** Kept for API compatibility — the mark ships without a halo. */
  glow?: boolean;
}

/** Official PostSpark brand mark — gradient spark bolt. */
export function PostSparkMark({ size = 32, className = "" }: Props) {
  return <BoltMark size={size} className={className} />;
}

/** Wordmark: mark + "PostSpark" text using the display font. */
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
        className="font-display font-bold"
        style={{
          color,
          fontSize: size * 0.78,
          lineHeight: 1,
          letterSpacing: "-0.025em",
        }}
      >
        Post
        <span
          style={{
            background: "linear-gradient(135deg, #A78BFA 0%, #60A5FA 100%)",
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
