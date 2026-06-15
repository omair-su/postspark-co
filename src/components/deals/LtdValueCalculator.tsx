import { useState } from "react";

export function LtdValueCalculator() {
  const [years, setYears] = useState(3);
  const monthly = 24;
  const lifetime = 97;
  const saved = monthly * 12 * years - lifetime;
  const paybackMonths = Math.ceil(lifetime / monthly);

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8">
      <h3 className="text-lg font-bold text-[#1A1A2E]">The 60-second math</h3>
      <p className="mt-1 text-sm text-[#6B7280]">
        Pro is $24/month. Lifetime is one payment of $97. Drag the slider to see your savings.
      </p>

      <div className="mt-6 flex items-center justify-between text-sm font-medium text-[#1A1A2E]">
        <span>Use PostSpark for</span>
        <span className="text-[#7C3AED] font-bold">{years} {years === 1 ? "year" : "years"}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        className="mt-2 w-full accent-[#7C3AED]"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Pro monthly cost" value={`$${monthly * 12 * years}`} sub={`$${monthly}/mo × ${years * 12} months`} />
        <Stat label="Lifetime cost" value={`$${lifetime}`} sub="one-time, forever" highlight />
        <Stat label="You save" value={`$${saved}`} sub={`pays back in ${paybackMonths} months`} accent />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, highlight, accent }: { label: string; value: string; sub: string; highlight?: boolean; accent?: boolean }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: accent ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : highlight ? "#1A1A2E" : "white",
        borderColor: accent || highlight ? "transparent" : "#E5E7EB",
        color: accent || highlight ? "white" : "#1A1A2E",
      }}
    >
      <div className="text-[11px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-[11px] opacity-70">{sub}</div>
    </div>
  );
}
