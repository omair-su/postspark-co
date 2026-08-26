import { AlertTriangle, CheckCircle2, Fingerprint } from "lucide-react";
import type { HumanizeAnalysis, MeaningCheck } from "@/lib/humanizeMetrics";

interface Props {
  before?: HumanizeAnalysis | null;
  after?: HumanizeAnalysis | null;
  meaning?: MeaningCheck | null;
}

function Bar({ label, score, detail, prev }: { label: string; score: number; detail: string; prev?: number }) {
  const tone =
    score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-foreground">{label}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {prev != null && prev !== score && <span className="mr-1 opacity-60">{prev} →</span>}
          {score}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${Math.max(2, score)}%`, transition: "width 700ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </div>
      <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">{detail}</p>
    </div>
  );
}

export function MetricsPanel({ before, after, meaning }: Props) {
  const active = after || before;
  if (!active) {
    return (
      <p className="text-[12px] text-muted-foreground">
        Run the humanizer to see the full signal breakdown.
      </p>
    );
  }

  const prevMap = new Map((before?.subScores || []).map((s) => [s.key, s.score]));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {active.subScores.map((s) => (
          <Bar
            key={s.key}
            label={s.label}
            score={s.score}
            detail={s.detail}
            prev={after ? prevMap.get(s.key) : undefined}
          />
        ))}
      </div>

      {meaning && (
        <div
          className={`rounded-xl border p-3 ${
            meaning.preserved
              ? "border-emerald-500/30 bg-emerald-500/8"
              : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          <div className="flex items-center gap-2">
            {meaning.preserved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className="text-[12px] font-semibold text-foreground">
              Meaning check: {meaning.score}% of detected facts kept
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {meaning.checked === 0
              ? "No numbers, names, or links detected in the source, so there was nothing to verify."
              : meaning.preserved
                ? `All ${meaning.checked} detected facts (numbers, names, links) appear in the output.`
                : `Missing from the output: ${meaning.missing.join(", ")}. Review before publishing.`}
          </p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Fingerprint className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-foreground">
            AI fingerprints {after ? "remaining" : "detected"}
          </span>
        </div>
        {active.fingerprints.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">None of our tracked stock phrases are present.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {active.fingerprints.slice(0, 18).map((f) => (
              <span
                key={f.pattern}
                className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10.5px] text-muted-foreground"
                title={f.category}
              >
                {f.pattern}
                {f.count > 1 && <span className="ml-1 opacity-60">×{f.count}</span>}
              </span>
            ))}
          </div>
        )}
        {before && after && (
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            {before.fingerprints.reduce((a, f) => a + f.count, 0)} tells before →{" "}
            {after.fingerprints.reduce((a, f) => a + f.count, 0)} after.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Words", v: active.wordCount },
          { k: "Sentences", v: active.sentenceCount },
          { k: "Avg length", v: active.avgSentenceLength },
          { k: "Grade level", v: active.signals.gradeLevel },
        ].map((m) => (
          <div key={m.k} className="rounded-xl border border-border bg-muted/30 p-2.5">
            <div className="text-[15px] font-bold tabular-nums text-foreground">{m.v}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
