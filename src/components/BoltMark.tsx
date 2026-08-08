/**
 * Official PostSpark brand mark (2026) — the gradient spark bolt used on the
 * landing page hero/footer. Single source of truth for the icon so the app,
 * sidebar, auth screens and favicon all stay in sync.
 */
let uid = 0;

export function BoltMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = `psbolt-${++uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M13.5 2 4 14h6l-1.5 8L20 9.5h-6.8L13.5 2z" fill={`url(#${id})`} />
    </svg>
  );
}

export default BoltMark;
