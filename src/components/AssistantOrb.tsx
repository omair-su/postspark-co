/**
 * AssistantOrb — the "living" Spark identity.
 * A layered animated gradient orb (rotating core + breathing rings + orbiting
 * particles) used everywhere Spark shows up: the floating trigger, the panel
 * header, and each assistant message avatar.
 */
type Props = {
  size?: number;
  className?: string;
  /** Faster pulse / glow while Spark is generating a reply. */
  thinking?: boolean;
  /** Disable rings/particles for very small avatar usages. */
  minimal?: boolean;
};

export function AssistantOrb({ size = 28, className = "", thinking = false, minimal = false }: Props) {
  return (
    <div
      className={`psx-orb ${thinking ? "psx-orb-thinking" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="psx-orb-core" />
      {!minimal && (
        <>
          <div className="psx-orb-ring psx-orb-ring-1" />
          <div className="psx-orb-ring psx-orb-ring-2" />
          <div className="psx-orb-particles">
            <span className="psx-orb-particle p1" />
            <span className="psx-orb-particle p2" />
            <span className="psx-orb-particle p3" />
          </div>
        </>
      )}
    </div>
  );
}
