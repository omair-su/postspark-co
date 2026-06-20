import { AlertCircle, Zap } from "lucide-react";

export function PainSection() {
  const Item = ({ children, color }: { children: React.ReactNode; color: string }) => (
    <li className="flex items-start gap-3 text-sm sm:text-base" style={{ color: "#334155", lineHeight: 1.6 }}>
      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {children}
    </li>
  );

  return (
    <section style={{ background: "#FFFFFF" }} className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            The Content Trap
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            You Create Great Content.
            <br />
            <span className="text-violet-600">Reformatting It Kills Your Week.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Most creators spend 80% of their time on manual re-writing and only 20% on actual creation. We flipped the script.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Manual Way */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 sm:p-10"
            style={{
              background: "#FFFFFF",
              border: "1px solid #F1F5F9",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
            }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <AlertCircle size={120} className="text-red-600" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">The Manual Grind</h3>
            </div>

            <ul className="mt-8 space-y-4">
              <Item color="#EF4444">Write blog post: <strong>90 minutes</strong></Item>
              <Item color="#EF4444">Rewrite as tweets: <strong>45 minutes</strong></Item>
              <Item color="#EF4444">Rewrite for LinkedIn: <strong>60 minutes</strong></Item>
              <Item color="#EF4444">Write newsletter version: <strong>45 minutes</strong></Item>
              <Item color="#EF4444">Write video script: <strong>60 minutes</strong></Item>
            </ul>

            <div className="mt-10 rounded-2xl bg-red-50/50 p-6 border border-red-100">
              <p className="text-base font-semibold text-red-900">
                Total: 5+ hours of soul-crushing manual work. Same ideas, different boxes.
              </p>
            </div>
          </div>

          {/* PostSpark Way */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 sm:p-10"
            style={{
              background: "linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)",
              border: "2px solid #DDD6FE",
              boxShadow: "0 20px 40px -15px rgba(124, 58, 237, 0.15)",
            }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Zap size={120} className="text-violet-600" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">The PostSpark Flow</h3>
            </div>

            <ul className="mt-8 space-y-4">
              <Item color="#7C3AED">Paste your content: <strong>30 seconds</strong></Item>
              <Item color="#7C3AED">Select your formats: <strong>10 seconds</strong></Item>
              <Item color="#7C3AED">Click Generate: <strong>1 click</strong></Item>
              <Item color="#7C3AED">Get 30 pieces of content: <strong>60 seconds</strong></Item>
            </ul>

            <div className="mt-10 rounded-2xl bg-violet-600 p-6 text-white shadow-xl shadow-violet-200">
              <p className="text-base font-bold">
                Total: Under 2 minutes. Your voice. Every platform. Complete dominance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
