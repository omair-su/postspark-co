/** Circular usage/progress gauge built from existing brand gradients. */
export function StatRing({
  value,
  max,
  size = 64,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  label?: string;
}) {
  const pct = max <= 0 ? 1 : Math.min(1, value / max);
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ps-ring-gauge" aria-hidden>
        <defs>
          <linearGradient id="ps-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke}
          stroke="currentColor" className="text-[color:var(--ds-border)]"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke="url(#ps-ring-grad)"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color: "var(--ds-text)" }}>
        {label ?? `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}
