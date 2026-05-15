import { useEffect, useRef, useState } from "react";

const METRICS = [
  { value: 30, suffix: "+", label: "Posts per input" },
  { value: 10, suffix: "s", label: "Average generation" },
  { value: 92, suffix: "%", label: "On-brand accuracy" },
  { value: 4.9, suffix: "/5", label: "Creator rating", decimals: 1 },
];

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const dur = 1600;
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{n.toFixed(decimals)}</span>;
}

export function AnimatedMetrics() {
  return (
    <section className="relative bg-[#06060f] py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.3em] text-violet-300/70">
          The numbers
        </p>
        <h2
          className="mx-auto mb-16 max-w-3xl text-center font-serif text-4xl font-light leading-tight text-white sm:text-6xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Built for creators who refuse <span className="italic text-violet-300">to be average.</span>
        </h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md md:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-[#06060f]/60 p-8 text-center">
              <div
                className="font-serif text-5xl font-light text-white sm:text-6xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                <CountUp to={m.value} decimals={m.decimals ?? 0} />
                <span className="text-violet-300">{m.suffix}</span>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/50">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
