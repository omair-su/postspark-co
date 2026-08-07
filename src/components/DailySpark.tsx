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
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Daily Spark · {new Date().toLocaleDateString(undefined, { weekday: "long" })}
            </p>
            <p className="text-sm font-semibold text-foreground">{spark.hook}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reroll}
          aria-label="Get another suggestion"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="relative mt-3 text-sm leading-relaxed text-foreground/85">
        "{spark.prompt}"
      </p>

      <div className="relative mt-4 flex flex-wrap items-center gap-3">
        <Link
          to={spark.to as any}
          className="inline-flex items-center gap-2 rounded-lg gradient-electric px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Try it now <ArrowRight className="h-3 w-3" />
        </Link>
        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {spark.format}
        </span>
      </div>
    </div>
  );
}
