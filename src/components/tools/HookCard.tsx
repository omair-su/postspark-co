import type { ReactNode } from "react";
import { Copy, Check, Trophy, Repeat, Shuffle, Layers, Bookmark, BookmarkCheck, Scissors } from "lucide-react";
import { Meter, GhostButton } from "@/components/tools/studio";
import { cn } from "@/lib/utils";

export interface ScoredHookView {
  framework: string;
  text: string;
  score: number;
  why: string;
  trigger?: string;
  subscores?: { pattern: number; specificity: number; platformFit: number };
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 210,
  instagram: 125,
  tiktok: 150,
  youtube: 70,
  threads: 150,
  facebook: 100,
};

const TRIGGER_TONE: Record<string, string> = {
  curiosity: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  controversy: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  relatability: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  aspiration: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  fomo: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

function tone(v: number): "good" | "warn" | "bad" {
  return v >= 8 ? "good" : v >= 6 ? "warn" : "bad";
}

export function HookScoreBars({ hook }: { hook: ScoredHookView }) {
  const s = hook.subscores;
  if (!s) return null;
  const rows: [string, number][] = [
    ["Pattern", s.pattern],
    ["Specificity", s.specificity],
    ["Platform fit", s.platformFit],
  ];
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {rows.map(([label, v]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            <span>{label}</span>
            <span className="tabular-nums">{Number(v || 0).toFixed(1)}</span>
          </div>
          <Meter value={(Number(v || 0) / 10) * 100} tone={tone(Number(v || 0))} />
        </div>
      ))}
    </div>
  );
}

export function HookCard({
  hook,
  index,
  isTop,
  platform,
  copied,
  saved,
  busy,
  onCopy,
  onSave,
  onRemix,
  onShorten,
  onSeries,
  onRepurpose,
  abSlot,
  onPickA,
  onPickB,
  children,
}: {
  hook: ScoredHookView;
  index: number;
  isTop?: boolean;
  platform: string;
  copied?: boolean;
  saved?: boolean;
  busy?: boolean;
  onCopy: () => void;
  onSave: () => void;
  onRemix: () => void;
  onShorten: () => void;
  onSeries: () => void;
  onRepurpose: () => void;
  abSlot?: "A" | "B" | null;
  onPickA: () => void;
  onPickB: () => void;
  children?: ReactNode;
}) {
  const limit = PLATFORM_LIMITS[platform] ?? 280;
  const len = hook.text.length;
  const over = len > limit;
  const scoreTone = hook.score >= 9 ? "text-emerald-400" : hook.score >= 8 ? "text-sky-400" : "text-amber-400";
  const trig = (hook.trigger || "").toLowerCase();

  return (
    <div
      className={cn(
        "pw-surface p-4 transition hover:border-primary/40",
        isTop && "border-primary/50 shadow-[0_18px_50px_-30px_hsl(var(--primary)/0.8)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-bold text-muted-foreground">#{index + 1}</span>
        <span className={cn("text-[12px] font-bold tabular-nums", scoreTone)}>{hook.score.toFixed(1)}/10</span>
        {isTop && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Trophy className="h-2.5 w-2.5" /> Top hook
          </span>
        )}
        {trig && (
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", TRIGGER_TONE[trig] || "border-border bg-card/60 text-muted-foreground")}>
            {trig}
          </span>
        )}
        <span className={cn("ml-auto text-[10.5px] tabular-nums", over ? "text-red-400" : "text-muted-foreground")}>
          {len}/{limit} chars
        </span>
      </div>

      <p className="my-3 text-[14.5px] leading-relaxed text-foreground">{hook.text}</p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-border bg-card/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {hook.framework}
        </span>
        <span className="text-[11px] italic text-muted-foreground">{hook.why}</span>
      </div>

      <HookScoreBars hook={hook} />

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <GhostButton icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} onClick={onCopy}>
          Copy
        </GhostButton>
        <GhostButton
          icon={saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          onClick={onSave}
          className={saved ? "border-primary/60 text-primary" : ""}
        >
          {saved ? "Saved" : "Swipe file"}
        </GhostButton>
        <GhostButton icon={<Shuffle className="h-3.5 w-3.5" />} onClick={onRemix} disabled={busy}>
          Remix
        </GhostButton>
        <GhostButton icon={<Scissors className="h-3.5 w-3.5" />} onClick={onShorten} disabled={busy}>
          Shorten
        </GhostButton>
        <GhostButton icon={<Layers className="h-3.5 w-3.5" />} onClick={onSeries} disabled={busy}>
          Series
        </GhostButton>
        <GhostButton icon={<Repeat className="h-3.5 w-3.5" />} onClick={onRepurpose}>
          Repurpose
        </GhostButton>
        <div className="ml-auto flex items-center gap-1.5">
          <GhostButton onClick={onPickA} className={abSlot === "A" ? "border-primary/60 text-primary" : ""}>
            A
          </GhostButton>
          <GhostButton onClick={onPickB} className={abSlot === "B" ? "border-primary/60 text-primary" : ""}>
            B
          </GhostButton>
        </div>
      </div>

      {children}
    </div>
  );
}
