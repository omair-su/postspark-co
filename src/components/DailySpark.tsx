import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

type Spark = {
  hook: string;
  prompt: string;
  format: string;
  to: string;
};

// Curated rotating prompt bank. Seeded by date so every user sees the same
// "today's spark" but it changes daily — no AI call needed on dashboard load.
const BANK: Spark[] = [
  { hook: "Steal this hook", prompt: "I used to think X. Then Y happened. Here's what changed my mind…", format: "X thread", to: "/dashboard/hook-lab" },
  { hook: "Today's repurpose", prompt: "Take your most-read blog post and turn it into a 5-tweet thread + 1 LinkedIn carousel.", format: "Repurpose", to: "/dashboard/repurpose" },
  { hook: "Try a contrarian take", prompt: "Pick one industry 'best practice' you secretly disagree with and write a 200-word LinkedIn post.", format: "LinkedIn post", to: "/dashboard/repurpose" },
  { hook: "Frame a customer win", prompt: "Pick one recent customer outcome. Write the before / during / after as a 4-tweet mini-case study.", format: "Case study", to: "/dashboard/repurpose" },
  { hook: "Ship a teaching post", prompt: "Pick one mistake you made this year. Write the lesson as a 'what I'd do differently' post.", format: "Reflection", to: "/dashboard/repurpose" },
  { hook: "Quote-card a lesson", prompt: "Pull your sharpest one-liner from your last newsletter and design a quote card in Image Studio.", format: "Quote card", to: "/dashboard/image-studio" },
  { hook: "Hooks for your next launch", prompt: "Generate 20 hooks for your next product launch and save the top 3 to your swipe file.", format: "Hook batch", to: "/dashboard/hook-lab" },
  { hook: "YouTube → Twitter", prompt: "Drop a YouTube link into Repurpose and pick the 'Tweet thread' format.", format: "Repurpose", to: "/dashboard/repurpose" },
];

function pickForToday(): Spark {
  const d = new Date();
  // YYYYMMDD as a stable seed
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return BANK[key % BANK.length];
}

export function DailySpark() {
  const initial = useMemo(pickForToday, []);
  const [spark, setSpark] = useState<Spark>(initial);

  const reroll = () => {
    let next = spark;
    while (next === spark && BANK.length > 1) {
      next = BANK[Math.floor(Math.random() * BANK.length)];
    }
    setSpark(next);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}
    >
      {/* sparkle particles */}
      <span aria-hidden className="psx-spark-dot" style={{ top: "14%", left: "78%", animationDelay: "0s" }} />
      <span aria-hidden className="psx-spark-dot" style={{ top: "62%", left: "88%", animationDelay: "0.8s" }} />
      <span aria-hidden className="psx-spark-dot" style={{ top: "40%", left: "8%", animationDelay: "1.6s" }} />
      <span aria-hidden className="psx-spark-dot" style={{ top: "78%", left: "22%", animationDelay: "2.4s" }} />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
        style={{ background: "rgba(124,58,237,0.35)" }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
              Daily Spark · {new Date().toLocaleDateString(undefined, { weekday: "long" })}
            </p>
            <p className="text-sm font-semibold text-white">{spark.hook}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reroll}
          aria-label="Get another suggestion"
          className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="relative mt-3 text-base font-medium italic leading-relaxed text-white/90">
        "{spark.prompt}"
      </p>

      <div className="relative mt-4 flex flex-wrap items-center gap-3">
        <Link
          to={spark.to as any}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-transform hover:scale-[1.02]"
          style={{ background: "#fbbf24", color: "#1e1b4b" }}
        >
          Try it now <ArrowRight className="h-3 w-3" />
        </Link>
        <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80">
          {spark.format}
        </span>
      </div>
    </div>
  );
}
