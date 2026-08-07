/**
 * AssistantOrb — distinctive Spark Copilot avatar/icon.
 * A small gradient orb with an inner spark mark, used in the FAB,
 * conversation header, and the assistant message avatar so users
 * immediately recognize "this is the AI assistant" (Claude/ChatGPT style).
 */
type Props = {
  size?: number;
  className?: string;
  glow?: boolean;
};

export function AssistantOrb({ size = 28, className = "", glow = true }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      style={glow ? { filter: "drop-shadow(0 2px 10px rgba(124,58,237,0.45))" } : undefined}
    >
      <defs>
        <radialGradient id="ao-bg" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#f5d7b6" />
          <stop offset="35%" stopColor="#c4b5fd" />
          <stop offset="75%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </radialGradient>
        <radialGradient id="ao-hi" cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="ao-spark" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#f5d7b6" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#ao-bg)" />
      <circle cx="20" cy="20" r="18" fill="url(#ao-hi)" />
      <path
        d="M20 9 L22.6 17.4 L31 20 L22.6 22.6 L20 31 L17.4 22.6 L9 20 L17.4 17.4 Z"
        fill="url(#ao-spark)"
        opacity="0.95"
      />
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
    </svg>
  );
}
