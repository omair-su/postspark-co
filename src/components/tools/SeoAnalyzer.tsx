import { Check, X, Gauge } from "lucide-react";
import { analyzeArticle, scoreArticle } from "@/lib/articleAnalysis";
import { Meter, ScoreRing, StatChip, StudioLabel } from "@/components/tools/studio";

/** Live on-page SEO analysis for the drafted article. */
export function SeoAnalyzer({
  markdown,
  keyword,
  title,
  metaDescription,
  wordTarget,
}: {
  markdown: string;
  keyword: string;
  title: string;
  metaDescription: string;
  wordTarget: number;
}) {
  const stats = analyzeArticle(markdown, keyword, title);
  const { score, checks } = scoreArticle(stats, wordTarget, metaDescription);

  const densityTone = stats.density >= 0.5 && stats.density <= 2.5 ? "good" : stats.density > 2.5 ? "bad" : "warn";
  const lengthPct = wordTarget ? Math.round((stats.words / wordTarget) * 100) : 0;
  const lengthTone = lengthPct >= 85 && lengthPct <= 115 ? "good" : lengthPct < 60 ? "bad" : "warn";
  const titleTone = title.length > 0 && title.length <= 60 ? "good" : "warn";
  const metaTone =
    metaDescription.length >= 140 && metaDescription.length <= 165 ? "good" : "warn";

  return (
    <div className="pw-surface p-5">
      <StudioLabel action={<ScoreRing score={score} label="On-page score" />}>
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" /> SEO analyzer
        </span>
      </StudioLabel>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatChip label="Words" value={stats.words.toLocaleString()} />
        <StatChip label="Read time" value={`${stats.readingMinutes} min`} />
        <StatChip label="Keyword uses" value={stats.keywordCount} />
        <StatChip label="Density" value={`${stats.density}%`} tone={densityTone as any} />
        <StatChip label="H2 / H3" value={`${stats.h2Count} / ${stats.h3Count}`} />
        <StatChip label="Links" value={`${stats.internalLinks} int · ${stats.externalLinks} ext`} />
        <StatChip label="Avg sentence" value={`${stats.avgSentenceWords}w`} />
        <StatChip label="FAQ blocks" value={stats.faqCount} />
      </div>

      <div className="mt-4 space-y-3">
        <MeterRow label={`Length ${stats.words} / ~${wordTarget}`} value={lengthPct} tone={lengthTone as any} />
        <MeterRow
          label={`Keyword density ${stats.density}% (target 0.5-2.5%)`}
          value={Math.min(100, (stats.density / 2.5) * 100)}
          tone={densityTone as any}
        />
        <MeterRow
          label={`Title ${title.length} / 60 chars`}
          value={Math.min(100, (title.length / 60) * 100)}
          tone={titleTone as any}
        />
        <MeterRow
          label={`Meta description ${metaDescription.length} / 160 chars`}
          value={Math.min(100, (metaDescription.length / 160) * 100)}
          tone={metaTone as any}
        />
      </div>

      <div className="mt-5 grid gap-1.5 sm:grid-cols-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
            title={c.hint}
          >
            <span
              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                c.ok ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
              }`}
            >
              {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-foreground">{c.label}</p>
              {!c.ok && <p className="text-[11.5px] text-muted-foreground">{c.hint}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MeterRow({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" | "bad" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11.5px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <Meter value={value} tone={tone} />
    </div>
  );
}
