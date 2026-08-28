import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Wand2, Loader2, Copy, Check, Save, Repeat, Sliders, X, History as HistoryIcon,
  Sparkles, GaugeCircle, GitCompare, FileText, Layers, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { withAIProgress } from "@/lib/aiProgress";
import { humanizeRun, rerollSentence, listHumanizerRuns, listRunVersions, deleteHumanizerRun } from "@/lib/humanize.functions";
import { addSwipeItem } from "@/lib/swipeFile.functions";
import {
  analyzeText, alignSentences, assembleFromDiff, chunkForHumanize, countWords, splitSentences,
  type HumanizeAnalysis, type MeaningCheck, type SentenceDiff,
} from "@/lib/humanizeMetrics";
import type { HumanizerRunRow } from "@/lib/humanizeTypes";
import { ScoreDial } from "@/components/humanizer/ScoreDial";
import { MetricsPanel } from "@/components/humanizer/MetricsPanel";
import { DiffView } from "@/components/humanizer/DiffView";
import { HistoryRail } from "@/components/humanizer/HistoryRail";
import { DriveImportButton } from "@/components/google/DriveImportButton";
import { ExportToGoogleDocs } from "@/components/google/ExportToGoogleDocs";

export const Route = createFileRoute("/dashboard/humanizer")({
  component: HumanizerPage,
  head: () => ({
    meta: [
      { title: "AI Humanizer — Rewrite AI Text in Your Voice | PostSpark" },
      {
        name: "description",
        content:
          "Multi-pass AI humanizer with a real signal breakdown: burstiness, word unpredictability, stock-phrase detection, sentence-level control and meaning checks.",
      },
    ],
  }),
});

const PURPOSES = ["Blog/Article", "LinkedIn Post", "Email", "Tweet/Thread", "Marketing Copy", "Academic/Formal", "General text"];
const STYLES = ["Conversational", "Professional", "Storytelling", "Direct/punchy", "Educational"];
const PRESERVE_OPTS = ["Original meaning", "Key facts/data", "Brand voice", "Formal register", "Technical terms", "All statistics"];
const INTENSITIES = [
  { id: "light" as const, name: "Light", desc: "Subtle polish, keeps your phrasing" },
  { id: "medium" as const, name: "Balanced", desc: "Full rewrite, same register" },
  { id: "strong" as const, name: "Deep", desc: "Aggressive rhythm rebuild" },
];
const MAX_WORDS = 20000;
const LONGFORM_WORDS = 1200;

type View = "output" | "diff" | "metrics";

function HumanizerPage() {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [baseOutput, setBaseOutput] = useState("");
  const [rows, setRows] = useState<SentenceDiff[]>([]);
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  const [before, setBefore] = useState<HumanizeAnalysis | null>(null);
  const [after, setAfter] = useState<HumanizeAnalysis | null>(null);
  const [meaning, setMeaning] = useState<MeaningCheck | null>(null);
  const [brandApplied, setBrandApplied] = useState(false);

  const [intensity, setIntensity] = useState<"light" | "medium" | "strong">("medium");
  const [purpose, setPurpose] = useState("Blog/Article");
  const [style, setStyle] = useState("Conversational");
  const [preserve, setPreserve] = useState<string[]>(["Original meaning", "Key facts/data", "Brand voice"]);
  const [useBrandVoice, setUseBrandVoice] = useState(true);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [rerolling, setRerolling] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<View>("output");
  const [advanced, setAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [runs, setRuns] = useState<HumanizerRunRow[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [versions, setVersions] = useState<HumanizerRunRow[] | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* -------------------- derived -------------------- */

  const inputWords = useMemo(() => countWords(input), [input]);
  const inputPreview = useMemo(
    () => (inputWords >= 40 ? analyzeText(input) : null),
    [input, inputWords],
  );
  const output = useMemo(
    () => (rows.length ? assembleFromDiff(rows, accepted) : baseOutput),
    [rows, accepted, baseOutput],
  );
  const finalAnalysis = useMemo(
    () => (output ? analyzeText(output) : null),
    [output],
  );
  const chunks = useMemo(() => (inputWords > LONGFORM_WORDS ? chunkForHumanize(input, LONGFORM_WORDS) : []), [input, inputWords]);

  /* -------------------- history -------------------- */

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const r = await listHumanizerRuns({ data: { limit: 25 } });
      setRuns(r.runs || []);
    } catch {
      /* history is non-critical */
    } finally {
      setRunsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
    try {
      const imported = sessionStorage.getItem("postspark.import.text");
      if (imported) {
        setInput(imported);
        sessionStorage.removeItem("postspark.import.text");
      }
    } catch { /* ignore */ }
  }, [loadRuns]);

  /* -------------------- run -------------------- */

  const settingsPayload = {
    intensity, purpose, style, preserve, useBrandVoice,
  };

  const applyResult = (source: string, out: string, b?: HumanizeAnalysis, a?: HumanizeAnalysis, m?: MeaningCheck) => {
    setBaseOutput(out);
    setRows(alignSentences(source, out));
    setAccepted({});
    setBefore(b ?? analyzeText(source));
    setAfter(a ?? analyzeText(out));
    setMeaning(m ?? null);
  };

  async function run() {
    if (inputWords < 8) return toast.error("Paste at least a couple of sentences.");
    if (inputWords > MAX_WORDS) return toast.error(`Limit is ${MAX_WORDS.toLocaleString()} words per run.`);

    setLoading(true);
    setBaseOutput("");
    setRows([]);
    setAccepted({});
    setAfter(null);
    setMeaning(null);
    setView("output");

    try {
      if (chunks.length > 1) {
        // Long-form batch: sequential passes, streamed into the editor.
        setProgress({ done: 0, total: chunks.length });
        const pieces: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
          const r = await withAIProgress(
            humanizeRun({
              data: {
                text: chunks[i].text,
                ...settingsPayload,
                chunkIndex: i,
                chunkTotal: chunks.length,
                persist: i === chunks.length - 1,
              },
            }),
          );
          if (r.error) {
            handleError(r.error);
            if (pieces.length) {
              const partial = pieces.join("\n\n");
              applyResult(chunks.slice(0, pieces.length).map((c) => c.text).join("\n\n"), partial);
            }
            return;
          }
          pieces.push(r.output);
          setBaseOutput(pieces.join("\n\n"));
          setProgress({ done: i + 1, total: chunks.length });
          if (r.brandVoiceApplied) setBrandApplied(true);
        }
        const joinedSource = chunks.map((c) => c.text).join("\n\n");
        const joinedOut = pieces.join("\n\n");
        applyResult(joinedSource, joinedOut);
        toast.success(`Humanized ${chunks.length} sections`);
      } else {
        const r = await withAIProgress(humanizeRun({ data: { text: input, ...settingsPayload } }));
        if (r.error) return handleError(r.error);
        applyResult(input, r.output, r.before, r.after, r.meaning);
        setActiveRunId(r.runId ?? null);
        setBrandApplied(Boolean(r.brandVoiceApplied));
        toast.success(
          `Humanized in ${r.passes ?? 2} passes${r.repaired ? " (auto-repaired)" : ""}`,
        );
      }
      void loadRuns();
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function handleError(err: string) {
    if (err === "LIMIT_REACHED") {
      toast.error("Monthly free limit reached — upgrade to Pro for unlimited runs.");
      return;
    }
    if (err === "LONGFORM_PRO_ONLY") {
      toast.error("Long-form batch mode is a Pro feature. Shorten the text or upgrade.");
      return;
    }
    toast.error(err);
  }

  async function reroll(index: number) {
    const row = rows[index];
    if (!row) return;
    setRerolling(index);
    try {
      const beforeCtx = rows.slice(Math.max(0, index - 2), index).map((r) => r.rewritten || r.original).join(" ");
      const afterCtx = rows.slice(index + 1, index + 3).map((r) => r.rewritten || r.original).join(" ");
      const r = await withAIProgress(
        rerollSentence({
          data: {
            sentence: row.rewritten || row.original,
            original: row.original,
            before: beforeCtx,
            afterCtx,
            avoid: [row.rewritten].filter(Boolean).slice(0, 3),
            ...settingsPayload,
          },
        }),
      );
      if (r.error || !r.text) return toast.error(r.error || "Re-roll failed");
      setRows((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          rewritten: r.text,
          changed: r.text.trim() !== next[index].original.trim(),
        };
        return next;
      });
      setAccepted((prev) => {
        const n = { ...prev };
        delete n[index];
        return n;
      });
    } finally {
      setRerolling(null);
    }
  }

  async function copyOut() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveToSwipe() {
    if (!output) return;
    try {
      const r = await addSwipeItem({
        data: {
          title: `Humanized: ${input.trim().replace(/\s+/g, " ").slice(0, 60)}`,
          content: output,
          type: "humanized",
          metadata: { intensity, purpose, style, humanScore: finalAnalysis?.humanScore ?? null },
        } as any,
      });
      if ((r as any)?.success === false) throw new Error("save failed");
      toast.success("Saved to Swipe File");
    } catch {
      toast.error("Could not save to Swipe File");
    }
  }

  const sendToRepurpose = () => {
    if (!output) return;
    try { sessionStorage.setItem("postspark.import.text", output); } catch { /* ignore */ }
    toast.success("Sent to Repurpose");
    navigate({ to: "/dashboard/repurpose" });
  };

  async function openRun(r: HumanizerRunRow) {
    setInput(r.input_text);
    applyResult(
      r.input_text,
      r.output_text,
      (r.metrics_before as HumanizeAnalysis) || undefined,
      (r.metrics_after as HumanizeAnalysis) || undefined,
      (r.meaning as MeaningCheck) || undefined,
    );
    setActiveRunId(r.id);
    if (r.settings?.intensity) setIntensity(r.settings.intensity);
    if (r.settings?.purpose) setPurpose(r.settings.purpose);
    if (r.settings?.style) setStyle(r.settings.style);
    if (r.settings?.preserve) setPreserve(r.settings.preserve);
    setView("output");
  }

  async function openVersions(r: HumanizerRunRow) {
    const res = await listRunVersions({ data: { sourceHash: r.source_hash } });
    setVersions(res.runs || []);
  }

  async function removeRun(r: HumanizerRunRow) {
    const res = await deleteHumanizerRun({ data: { id: r.id } });
    if (res.success) {
      setRuns((prev) => prev.filter((x) => x.id !== r.id));
      if (activeRunId === r.id) setActiveRunId(null);
      toast.success("Run deleted");
    } else toast.error("Could not delete run");
  }

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!loading) void run();
      } else if (e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        void copyOut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, input, output, chunks.length]);

  const changedCount = rows.filter((r) => r.changed).length;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 pb-24 pt-5 sm:px-6">
      {/* TOOLBAR */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Wand2 className="h-4.5 w-4.5" />
            </span>
            <div className="leading-tight">
              <h1 className="m-0 text-[15px] font-bold tracking-tight text-foreground">AI Humanizer</h1>
              <p className="m-0 text-[11px] text-muted-foreground">
                Multi-pass rewrite · measured signals · sentence-level control
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-muted/40 p-0.5">
              {INTENSITIES.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setIntensity(i.id)}
                  title={i.desc}
                  className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                    intensity === i.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {i.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAdvanced(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-[11.5px] font-semibold text-foreground transition hover:bg-muted"
            >
              <Sliders className="h-3.5 w-3.5" /> Advanced
            </button>
            <button
              onClick={() => setShowHistory((s) => !s)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11.5px] font-semibold transition ${
                showHistory ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <HistoryIcon className="h-3.5 w-3.5" /> History
            </button>
            <button
              onClick={() => void run()}
              disabled={loading || inputWords < 8}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading
                ? progress
                  ? `Section ${progress.done}/${progress.total}`
                  : "Humanizing…"
                : output
                  ? "Re-run"
                  : "Humanize"}
            </button>
          </div>
        </div>
        {loading && <div className="lux-progress mt-3 !h-[3px] !rounded-full" />}
      </div>

      <div className={`grid gap-4 ${showHistory ? "xl:grid-cols-[1fr_1fr_300px]" : "lg:grid-cols-2"}`}>
        {/* INPUT */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Your AI text
            </h2>
            <div className="flex items-center gap-2">
              <DriveImportButton onImported={(t) => setInput(t)} />
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {inputWords.toLocaleString()} words
              </span>
            </div>
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste ChatGPT, Claude, Gemini or Jasper output here. Up to 20,000 words — long documents are humanized section by section."
            className="min-h-[46vh] w-full resize-y rounded-xl border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground outline-none transition focus:border-primary"
          />

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {inputPreview && (
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5">
                Source reads {inputPreview.aiLikelihood}% machine-written
              </span>
            )}
            {chunks.length > 1 && (
              <span className="rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 text-primary">
                Long-form: {chunks.length} sections
              </span>
            )}
            {brandApplied && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                Brand Voice applied
              </span>
            )}
            <span className="ml-auto hidden sm:inline">⌘↵ humanize · ⌘⇧C copy</span>
          </div>
        </section>

        {/* OUTPUT */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-xl border border-border bg-muted/40 p-0.5">
              {([
                { id: "output" as View, label: "Output", icon: FileText },
                { id: "diff" as View, label: `Diff${changedCount ? ` (${changedCount})` : ""}`, icon: GitCompare },
                { id: "metrics" as View, label: "Signals", icon: GaugeCircle },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                    view === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>

            {output && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => void copyOut()} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
                </button>
                <button onClick={() => void saveToSwipe()} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button onClick={sendToRepurpose} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted">
                  <Repeat className="h-3.5 w-3.5" /> Repurpose
                </button>
                <ExportToGoogleDocs content={output} defaultTitle="Humanized text" sourceTool="humanizer" />
              </div>
            )}
          </div>

          {!output && !loading && (
            <div className="flex min-h-[46vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
              <Wand2 className="mb-3 h-7 w-7 text-muted-foreground/50" />
              <p className="m-0 text-[13px] font-semibold text-foreground">Nothing humanized yet</p>
              <p className="m-0 mt-1 max-w-[320px] text-[11.5px] leading-relaxed text-muted-foreground">
                Paste your text and hit Humanize. You get the rewrite, a per-sentence diff you can
                edit, and an honest signal breakdown.
              </p>
            </div>
          )}

          {loading && !output && (
            <div className="min-h-[46vh] space-y-2.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="ps-skel h-3.5 rounded-full bg-muted" style={{ width: `${60 + ((i * 13) % 38)}%` }} />
              ))}
            </div>
          )}

          {output && (
            <>
              <div className="mb-4 rounded-xl border border-border bg-muted/25 p-3.5">
                <ScoreDial
                  after={(finalAnalysis ?? after)?.aiLikelihood ?? null}
                  before={before?.aiLikelihood ?? null}
                  verdict={(finalAnalysis ?? after)?.verdict}
                />
              </div>

              {view === "output" && (
                <div className="max-h-[58vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3.5 text-[13.5px] leading-[1.75] text-foreground">
                  {output}
                </div>
              )}

              {view === "diff" && (
                <div className="max-h-[58vh] overflow-y-auto pr-1">
                  {rows.length ? (
                    <DiffView
                      rows={rows}
                      accepted={accepted}
                      rerolling={rerolling}
                      onAccept={(i) => setAccepted((p) => ({ ...p, [i]: true }))}
                      onRevert={(i) => setAccepted((p) => ({ ...p, [i]: false }))}
                      onReroll={(i) => void reroll(i)}
                    />
                  ) : (
                    <p className="text-[12px] text-muted-foreground">No sentence map available for this run.</p>
                  )}
                </div>
              )}

              {view === "metrics" && (
                <div className="max-h-[58vh] overflow-y-auto pr-1">
                  <MetricsPanel before={before} after={finalAnalysis ?? after} meaning={meaning} />
                </div>
              )}
            </>
          )}
        </section>

        {/* HISTORY */}
        {showHistory && (
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <HistoryRail
              runs={runs}
              loading={runsLoading}
              activeId={activeRunId}
              onOpen={(r) => void openRun(r)}
              onCompare={(r) => void openVersions(r)}
              onDelete={(r) => void removeRun(r)}
            />
          </aside>
        )}
      </div>

      {/* ADVANCED SLIDE-OVER */}
      {advanced && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm" onClick={() => setAdvanced(false)}>
          <div
            className="h-full w-full max-w-[380px] overflow-y-auto border-l border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-[14px] font-bold text-foreground">Advanced controls</h3>
              <button onClick={() => setAdvanced(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Field label="Content purpose">
              <div className="flex flex-wrap gap-1.5">
                {PURPOSES.map((p) => (
                  <Pill key={p} active={purpose === p} onClick={() => setPurpose(p)}>{p}</Pill>
                ))}
              </div>
            </Field>

            <Field label="Target style">
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <Pill key={s} active={style === s} onClick={() => setStyle(s)}>{s}</Pill>
                ))}
              </div>
            </Field>

            <Field label="Must preserve">
              <div className="flex flex-wrap gap-1.5">
                {PRESERVE_OPTS.map((p) => (
                  <Pill
                    key={p}
                    active={preserve.includes(p)}
                    onClick={() =>
                      setPreserve((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
                    }
                  >
                    {p}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Brand Voice">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3">
                <input
                  type="checkbox"
                  checked={useBrandVoice}
                  onChange={(e) => setUseBrandVoice(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-[11.5px] leading-relaxed text-muted-foreground">
                  Rewrite in my trained Brand Voice and honour my active Brand Kit tone. Falls back to
                  the target style when no voice is trained.
                </span>
              </label>
            </Field>

            <Field label="Rewrite depth">
              <div className="space-y-2">
                {INTENSITIES.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setIntensity(i.id)}
                    className={`w-full rounded-xl border p-2.5 text-left transition ${
                      intensity === i.id ? "border-primary/50 bg-primary/[0.06]" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-[12px] font-semibold text-foreground">{i.name}</div>
                    <div className="text-[11px] text-muted-foreground">{i.desc}</div>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
      )}

      {/* VERSION COMPARE */}
      {versions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" onClick={() => setVersions(null)}>
          <div
            className="max-h-[85vh] w-full max-w-[1000px] overflow-y-auto rounded-2xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-2 text-[14px] font-bold text-foreground">
                <Layers className="h-4 w-4 text-primary" /> Versions of this source ({versions.length})
              </h3>
              <button onClick={() => setVersions(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {versions.map((v) => {
                const ai = (v.metrics_after as any)?.aiLikelihood;
                return (
                  <div key={v.id} className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">v{v.version}</span>
                      {typeof ai === "number" && (
                        <span className="text-[10.5px] text-muted-foreground">{100 - ai} human · {v.settings?.intensity}</span>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => { void openRun(v); setVersions(null); }}
                        className="rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground hover:bg-muted"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => void removeRun(v).then(() => setVersions((prev) => prev?.filter((x) => x.id !== v.id) ?? null))}
                        className="rounded-lg border border-border px-1.5 py-0.5 text-destructive hover:bg-destructive/10"
                        aria-label="Delete version"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="max-h-52 overflow-y-auto whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
                      {v.output_text.slice(0, 1600)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        active
          ? "border-primary/50 bg-primary/12 text-primary"
          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/** Sentence count helper kept for parity with the metrics module. */
export const __sentenceCount = splitSentences;
