/** Smooth SVG sparkline with a draw-in animation. */
export function Sparkline({
  points,
  height = 44,
  className,
}: {
  points: number[];
  height?: number;
  className?: string;
}) {
  const data = points.length ? points : [0, 0, 0, 0];
  const max = Math.max(1, ...data);
  const w = 100;
  const step = w / Math.max(1, data.length - 1);
  const path = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(height - (v / max) * (height - 6) - 3).toFixed(2)}`)
    .join(" ");
  const area = `${path} L${w},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={`ps-sparkline w-full ${className || ""}`}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id="ps-spark-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="ps-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ps-spark-fill)" stroke="none" />
      <path d={path} fill="none" stroke="url(#ps-spark-line)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
