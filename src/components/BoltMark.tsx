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
        <linearGradient id={id} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1400E6" />
          <stop offset="50%" stopColor="#7A0BC0" />
          <stop offset="100%" stopColor="#E60012" />
        </linearGradient>
      </defs>
      <path
        d="M10.5 2 20 14h-6l1.5 8L4 9.5h6.8L10.5 2z"
        fill={`url(#${id})`}
        stroke={`url(#${id})`}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BoltMark;
