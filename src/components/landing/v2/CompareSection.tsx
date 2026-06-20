import { Check, X, Info } from "lucide-react";

export function CompareSection() {
  type CellValue = "yes" | "no" | "limited" | string;

  const rows: { feature: string; postspark: CellValue; repurpose: CellValue; hootsuite: CellValue }[] = [
    {
      feature: "AI writes in your voice",
      postspark: "yes",
      repurpose: "limited",
      hootsuite: "no",
    },
    {
      feature: "30 outputs in <60 seconds",
      postspark: "yes",
      repurpose: "limited",
      hootsuite: "no",
    },
    {
      feature: "Native Shorts/Reels script + voiceover",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Brand voice training (free)",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Founding Lifetime plan",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Free plan with real AI access",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
    {
      feature: "Built-in client approval flow",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "limited",
    },
    {
      feature: "Powered by Claude Sonnet 4.5",
      postspark: "yes",
      repurpose: "no",
      hootsuite: "no",
    },
  ];

  function Cell({ value, isPostSpark }: { value: CellValue; isPostSpark?: boolean }) {
    if (value === "yes") {
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isPostSpark ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-emerald-100 text-emerald-600'}`}>
          <Check size={18} strokeWidth={3} />
        </div>
      );
    }
    if (value === "no") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <X size={18} strokeWidth={3} />
        </div>
      );
    }
    if (value === "limited") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
          Limited
        </span>
      );
    }
    return <span className="text-sm font-bold text-slate-600">{value}</span>;
  }

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            Market Comparison
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Why Creators Choose <span className="text-violet-600">PostSpark</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            See how we stack up against traditional tools that weren't built for the AI era.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
          {/* Table Header */}
          <div className="grid grid-cols-4 items-center bg-slate-50/50 border-b border-slate-200">
            <div className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Features</div>
            <div className="p-6 text-center border-x border-slate-200 bg-white">
              <span className="text-sm font-black text-violet-600 uppercase tracking-wider">PostSpark</span>
            </div>
            <div className="p-6 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">Repurpose.io</div>
            <div className="p-6 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">Hootsuite</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.feature} className="grid grid-cols-4 items-center transition-colors hover:bg-slate-50/30">
                <div className="p-6 text-sm font-bold text-slate-900 flex items-center gap-2">
                  {row.feature}
                  <Info size={14} className="text-slate-300 cursor-help" />
                </div>
                <div className="p-6 flex justify-center border-x border-slate-100 bg-violet-50/10">
                  <Cell value={row.postspark} isPostSpark />
                </div>
                <div className="p-6 flex justify-center">
                  <Cell value={row.repurpose} />
                </div>
                <div className="p-6 flex justify-center">
                  <Cell value={row.hootsuite} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <Info size={14} />
          <span>Comparison based on publicly listed features as of June 2026. PostSpark is the only tool with native Claude 4.5 integration.</span>
        </div>
      </div>
    </section>
  );
}
