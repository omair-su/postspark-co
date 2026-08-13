import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Flame, Loader2, Sparkles, ClipboardCopy, Check, Trophy, HelpCircle, BarChart3, Zap,
  BookOpen, FileQuestion, Target, Lightbulb, AlertTriangle, ListOrdered, Eye,
  Bookmark, History, Trash2, Copy, Layers,
} from "lucide-react";
import {
  generateHooks, remixHook, generateHookSeries, saveHookAbPair, getHookWinStats,
} from "@/lib/hookLab.functions";
import { addSwipeItem, listSwipeItems, removeSwipeItem, type SwipeItem } from "@/lib/swipeFile.functions";
import { listToolHistory, type ToolHistoryEntry } from "@/lib/toolHistory.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { ToolHero } from "@/components/dashboard/ToolHero";
import { DriveImportButton } from "@/components/google/DriveImportButton";
import { ExportToGoogleDocs } from "@/components/google/ExportToGoogleDocs";
import {
  StudioCard, StudioLabel, SubLabel, ChoicePill, GhostButton, EmptyHint,
} from "@/components/tools/studio";
import { HookCard, type ScoredHookView } from "@/components/tools/HookCard";
import { SideDrawer } from "@/components/tools/SideDrawer";
import { WinRatePanel, type FrameworkStat } from "@/components/tools/WinRatePanel";

export const Route = createFileRoute("/dashboard/hook-lab")({
  component: HookLabPage,
});

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "threads", label: "Threads" },
  { id: "facebook", label: "Facebook" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

const NICHES = [
  "SaaS/Tech", "Marketing", "E-commerce", "Finance", "Fitness/Health",
  "Personal Development", "Creator/Media", "Real Estate", "Education",
  "B2B Services", "Coaching", "Other",
];

const FRAMEWORK_OPTIONS = [
  { id: "Question", icon: HelpCircle, label: "Question hook" },
  { id: "Stat", icon: BarChart3, label: "Stat/Data hook" },
  { id: "Bold Claim", icon: Zap, label: "Bold statement" },
  { id: "Story", icon: BookOpen, label: "Story opener" },
  { id: "Contrarian", icon: FileQuestion, label: "Contrarian/Myth" },
  { id: "Specific Outcome", icon: Target, label: "Specific outcome" },
  { id: "Insight Reveal", icon: Lightbulb, label: "Insight reveal" },
  { id: "Warning/Mistake", icon: AlertTriangle, label: "Warning/Mistake" },
  { id: "Numbered List", icon: ListOrdered, label: "Numbered list" },
  { id: "Curiosity Gap", icon: Eye, label: "Curiosity gap" },
];

const TONES = ["Direct/Raw", "Professional", "Casual", "Provocative", "Educational", "Storytelling"];

interface SeriesPost { order: number; hook: string; body: string; cliffhanger: string }

function HookLabPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  // config
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("SaaS/Tech");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<PlatformId>("twitter");
  const [format, setFormat] = useState<"text" | "spoken" | "both">("text");
  const [frameworks, setFrameworks] = useState<string[]>(FRAMEWORK_OPTIONS.map((f) => f.id));
  const [tone, setTone] = useState("Direct/Raw");

  // output
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<ScoredHookView[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [remixes, setRemixes] = useState<Record<number, ScoredHookView[]>>({});
  const [series, setSeries] = useState<{ index: number; posts: SeriesPost[] } | null>(null);

  // A/B
  const [abA, setAbA] = useState<number | null>(null);
  const [abB, setAbB] = useState<number | null>(null);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [savingAb, setSavingAb] = useState(false);
  const [stats, setStats] = useState<FrameworkStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // swipe file + history
  const [swipeOpen, setSwipeOpen] = useState(false);
  const [swipeItems, setSwipeItems] = useState<SwipeItem[]>([]);
  const [swipeQuery, setSwipeQuery] = useState("");
  const [savedTexts, setSavedTexts] = useState<Set<string>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ToolHistoryEntry[]>([]);

  const loadSwipe = useCallback(async () => {
    try {
      const res = await listSwipeItems({ data: { type: "hook", limit: 100 } });
      setSwipeItems(res.items);
      setSavedTexts(new Set(res.items.map((i) => i.content)));
    } catch (e) { console.error(e); }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getHookWinStats({ data: {} });
      setStats(res.stats as FrameworkStat[]);
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    if (!session) return;
    loadSwipe();
    loadStats();
  }, [session, loadSwipe, loadStats]);

  const openHistory = async () => {
    setHistoryOpen(true);
    try {
      const res = await listToolHistory({ data: { tool: "hook_lab", limit: 20 } });
      setHistory(res.entries);
    } catch (e) { console.error(e); }
  };

  const toggleFramework = (id: string) =>
    setFrameworks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic (3+ chars)");
    if (audience.trim().length < 3) return toast.error("Add a target audience");
    if (frameworks.length === 0) return toast.error("Select at least one framework");
    setLoading(true);
    setHooks([]); setRemixes({}); setSeries(null);
    setAbA(null); setAbB(null); setWinner(null);
    try {
      const res: any = await withAIProgress(generateHooks({
        data: {
          topic: topic.trim(), platform, niche, audience: audience.trim(), format, frameworks, tone,
        },
      }));
      if (res.error) toast.error(res.error);
      else if (!res.hooks?.length) toast.error("No hooks generated. Try a different topic.");
      else {
        setHooks(res.hooks as ScoredHookView[]);
        setJobId(res.jobId ?? null);
        toast.success(`${res.hooks.length} viral hooks ready`);
      }
    } catch (e) { console.error(e); toast.error("Generation failed"); }
    finally { setLoading(false); }
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hooks.map((h, i) => `${i + 1}. ${h.text}  (${h.framework})`).join("\n"));
    setCopiedAll(true);
    toast.success("All hooks copied");
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const sendToRepurpose = (text: string) => {
    try { sessionStorage.setItem("postspark.import.text", text); } catch { /* ignore */ }
    toast.success("Hook sent to Repurpose");
    navigate({ to: "/dashboard/repurpose" });
  };

  const toggleSave = async (hook: ScoredHookView) => {
    const existing = swipeItems.find((i) => i.content === hook.text);
    if (existing) {
      const res = await removeSwipeItem({ data: { id: existing.id } });
      if (!res.success) return toast.error("Could not remove");
      setSwipeItems((p) => p.filter((i) => i.id !== existing.id));
      setSavedTexts((p) => { const n = new Set(p); n.delete(hook.text); return n; });
      return toast.success("Removed from swipe file");
    }
    const res = await addSwipeItem({
      data: {
        title: hook.framework || "Hook",
        content: hook.text,
        platform,
        type: "hook",
        metadata: { score: hook.score, framework: hook.framework, trigger: hook.trigger || "", topic },
      },
    });
    if (!res.success || !res.item) return toast.error("Could not save");
    setSwipeItems((p) => [res.item as SwipeItem, ...p]);
    setSavedTexts((p) => new Set(p).add(hook.text));
    toast.success("Saved to swipe file");
  };

  const runRemix = async (idx: number, mode: "remix" | "shorten") => {
    setBusyIdx(idx);
    try {
      const res: any = await withAIProgress(remixHook({
        data: { hook: hooks[idx].text, platform, mode, tone },
      }));
      if (res.error) toast.error(res.error);
      else if (!res.hooks?.length) toast.error("No variants returned");
      else {
        setRemixes((p) => ({ ...p, [idx]: res.hooks as ScoredHookView[] }));
        toast.success(`${res.hooks.length} variants ready`);
      }
    } catch (e) { console.error(e); toast.error("Remix failed"); }
    finally { setBusyIdx(null); }
  };

  const runSeries = async (idx: number) => {
    setBusyIdx(idx);
    try {
      const res: any = await withAIProgress(generateHookSeries({
        data: { hook: hooks[idx].text, platform, topic: topic.trim() },
      }));
      if (res.error) toast.error(res.error);
      else if (!res.posts?.length) toast.error("No series returned");
      else { setSeries({ index: idx, posts: res.posts as SeriesPost[] }); toast.success("5-part arc ready"); }
    } catch (e) { console.error(e); toast.error("Series failed"); }
    finally { setBusyIdx(null); }
  };

  const saveAb = async () => {
    if (abA === null || abB === null) return;
    if (!jobId) return toast.error("Generate hooks first so we can track this test");
    setSavingAb(true);
    try {
      const res = await saveHookAbPair({
        data: {
          jobId,
          variants: [
            { text: hooks[abA].text, framework: hooks[abA].framework },
            { text: hooks[abB].text, framework: hooks[abB].framework },
          ],
          winnerIndex: winner,
        },
      });
      if (!res.success) toast.error("Could not save the test");
      else { toast.success(winner === null ? "A/B pair saved" : "Winner recorded"); loadStats(); }
    } catch (e) { console.error(e); toast.error("Could not save the test"); }
    finally { setSavingAb(false); }
  };

  const filteredHooks = hooks
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => filter === "all" || h.framework.toLowerCase().includes(filter.toLowerCase()));

  const filters = ["all", ...Array.from(new Set(hooks.map((h) => h.framework.split(/[+,/]/)[0].trim())))];

  const filteredSwipe = swipeItems.filter(
    (i) =>
      !swipeQuery.trim() ||
      i.content.toLowerCase().includes(swipeQuery.toLowerCase()) ||
      (i.title || "").toLowerCase().includes(swipeQuery.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-6">
      <ToolHero
        eyebrow="Viral Hook Lab"
        icon={<Flame className="h-3 w-3" />}
        accent="#F97316"
        art="hook"
        title="Hooks that stop the scroll"
        subtitle="Generate 20 scroll-stopping hooks using proven viral frameworks. Scored, ranked, and platform-native."
        steps={["Set topic & niche", "Generate 20 hooks", "Score & A/B test"]}
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <GhostButton icon={<Bookmark className="h-3.5 w-3.5" />} onClick={() => setSwipeOpen(true)}>
          Swipe file ({swipeItems.length})
        </GhostButton>
        <GhostButton icon={<History className="h-3.5 w-3.5" />} onClick={openHistory}>
          History
        </GhostButton>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ============ CONFIG RAIL ============ */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
          <StudioCard>
            <StudioLabel action={<DriveImportButton onImported={(t) => setTopic(t.slice(0, 600))} label="From Drive" />}>
              Your topic
            </StudioLabel>
            <SubLabel>Topic or angle *</SubLabel>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g. Why most SaaS founders fail at pricing"
              className="ps-input w-full"
            />
            <div className="mt-3 space-y-3">
              <div>
                <SubLabel>Your niche / industry *</SubLabel>
                <select value={niche} onChange={(e) => setNiche(e.target.value)} className="ps-input w-full">
                  {NICHES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <SubLabel>Target audience *</SubLabel>
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. early-stage startup founders"
                  className="ps-input w-full"
                />
              </div>
            </div>
          </StudioCard>

          <StudioCard>
            <StudioLabel>Platform & format</StudioLabel>
            <SubLabel>Platform *</SubLabel>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <ChoicePill key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>
                  {p.label}
                </ChoicePill>
              ))}
            </div>
            <SubLabel>Hook format *</SubLabel>
            <div className="grid gap-2">
              {([
                { id: "text", label: "Text hooks", desc: "Posts, captions, threads" },
                { id: "spoken", label: "Spoken hooks", desc: "Video, reels, shorts" },
                { id: "both", label: "Both", desc: "10 text + 10 spoken" },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    format === f.id
                      ? "border-primary/60 bg-primary/[0.06]"
                      : "border-border bg-card/50 hover:border-primary/40"
                  }`}
                >
                  <div className="text-[13px] font-semibold text-foreground">{f.label}</div>
                  <div className="text-[11px] text-muted-foreground">{f.desc}</div>
                </button>
              ))}
            </div>
          </StudioCard>

          <StudioCard>
            <StudioLabel
              action={
                <button
                  onClick={() =>
                    setFrameworks(frameworks.length === FRAMEWORK_OPTIONS.length ? [] : FRAMEWORK_OPTIONS.map((f) => f.id))
                  }
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {frameworks.length === FRAMEWORK_OPTIONS.length ? "Clear" : "Select all"}
                </button>
              }
            >
              Frameworks
            </StudioLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {FRAMEWORK_OPTIONS.map((f) => {
                const Icon = f.icon;
                const active = frameworks.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFramework(f.id)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[12px] transition ${
                      active
                        ? "border-primary/60 bg-primary/[0.06] text-foreground"
                        : "border-border bg-card/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </StudioCard>

          <StudioCard>
            <StudioLabel>Tone</StudioLabel>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <ChoicePill key={t} active={tone === t} onClick={() => setTone(t)}>{t}</ChoicePill>
              ))}
            </div>
          </StudioCard>

          <button onClick={handleGenerate} disabled={loading} className="ps-generate-btn">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Cooking 20 viral hooks…</>
              : <><Sparkles className="h-4 w-4" /> Generate 20 Viral Hooks</>}
          </button>

          <WinRatePanel stats={stats} loading={statsLoading} onRefresh={loadStats} />
        </div>

        {/* ============ OUTPUT CANVAS ============ */}
        <div className="space-y-4">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="lux-flow h-28 rounded-2xl border border-border" />
              ))}
            </div>
          )}

          {!loading && hooks.length === 0 && (
            <EmptyHint
              icon={<Flame className="h-5 w-5" />}
              title="Your hooks land here"
              body="Set a topic, audience and platform on the left, then generate 20 scored hooks with remix, series and A/B tools built in."
            />
          )}

          {hooks.length > 0 && (
            <>
              <StudioCard>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[12px] text-muted-foreground">
                    {hooks.length} hooks for “{topic.slice(0, 60)}” — ranked by viral potential
                  </p>
                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <GhostButton
                      icon={copiedAll ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                      onClick={copyAll}
                    >
                      Copy all
                    </GhostButton>
                    <ExportToGoogleDocs
                      content={hooks.map((h, i) => `${i + 1}. ${h.text}`).join("\n\n")}
                      defaultTitle={`PostSpark — Hooks${topic ? `: ${topic.slice(0, 60)}` : ""}`}
                      sourceTool="Hook Lab"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {filters.slice(0, 8).map((f) => (
                    <ChoicePill key={f} active={filter === f} onClick={() => setFilter(f)}>
                      {f === "all" ? `All (${hooks.length})` : f}
                    </ChoicePill>
                  ))}
                </div>
              </StudioCard>

              <div className="space-y-3">
                {filteredHooks.map(({ h, i }) => (
                  <HookCard
                    key={i}
                    hook={h}
                    index={i}
                    isTop={i === 0}
                    platform={platform}
                    copied={copiedIdx === i}
                    saved={savedTexts.has(h.text)}
                    busy={busyIdx !== null}
                    onCopy={() => copy(h.text, i)}
                    onSave={() => toggleSave(h)}
                    onRemix={() => runRemix(i, "remix")}
                    onShorten={() => runRemix(i, "shorten")}
                    onSeries={() => runSeries(i)}
                    onRepurpose={() => sendToRepurpose(h.text)}
                    abSlot={abA === i ? "A" : abB === i ? "B" : null}
                    onPickA={() => setAbA(abA === i ? null : i)}
                    onPickB={() => setAbB(abB === i ? null : i)}
                  >
                    {remixes[i]?.length ? (
                      <div className="mt-3 space-y-2 rounded-xl border border-primary/25 bg-primary/[0.04] p-3">
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
                          Variants
                        </div>
                        {remixes[i].map((v, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                              {v.score.toFixed(1)}
                            </span>
                            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-foreground">{v.text}</p>
                            <GhostButton icon={<Copy className="h-3 w-3" />} onClick={() => copy(v.text, 1000 + i * 10 + j)} />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {series?.index === i && (
                      <div className="mt-3 space-y-2 rounded-xl border border-border bg-card/60 p-3">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <Layers className="h-3 w-3" /> 5-part series
                        </div>
                        {series.posts.map((p) => (
                          <div key={p.order} className="rounded-lg border border-border bg-card/50 p-2.5">
                            <p className="text-[12.5px] font-semibold text-foreground">
                              {p.order}. {p.hook}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-[12px] text-muted-foreground">{p.body}</p>
                            <p className="mt-1 text-[11.5px] italic text-primary">{p.cliffhanger}</p>
                          </div>
                        ))}
                        <GhostButton
                          icon={<ClipboardCopy className="h-3.5 w-3.5" />}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              series.posts.map((p) => `${p.order}. ${p.hook}\n\n${p.body}\n\n${p.cliffhanger}`).join("\n\n---\n\n"),
                            );
                            toast.success("Series copied");
                          }}
                        >
                          Copy series
                        </GhostButton>
                      </div>
                    )}
                  </HookCard>
                ))}
              </div>

              {/* A/B lab */}
              <StudioCard>
                <StudioLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" /> A/B lab
                  </span>
                </StudioLabel>
                {abA === null || abB === null ? (
                  <p className="text-[12.5px] text-muted-foreground">
                    Tag one hook as <strong className="text-foreground">A</strong> and another as{" "}
                    <strong className="text-foreground">B</strong> using the buttons on each card.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([abA, abB] as number[]).map((idx, slot) => (
                        <button
                          key={slot}
                          onClick={() => setWinner(slot as 0 | 1)}
                          className={`rounded-xl border p-3 text-left transition ${
                            winner === slot ? "border-primary/60 bg-primary/[0.07]" : "border-border bg-card/50 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            <span>Hook {slot === 0 ? "A" : "B"}</span>
                            {winner === slot && <span className="text-primary">Winner</span>}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-foreground">{hooks[idx].text}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{hooks[idx].framework}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <GhostButton
                        icon={savingAb ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        onClick={saveAb}
                        disabled={savingAb}
                      >
                        {winner === null ? "Save A/B pair" : "Record winner"}
                      </GhostButton>
                      <GhostButton
                        icon={<ClipboardCopy className="h-3.5 w-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(`A: ${hooks[abA].text}\n\nB: ${hooks[abB].text}`);
                          toast.success("Both hooks copied");
                        }}
                      >
                        Copy both
                      </GhostButton>
                    </div>
                  </>
                )}
              </StudioCard>
            </>
          )}
        </div>
      </div>

      {/* SWIPE FILE DRAWER */}
      <SideDrawer
        open={swipeOpen}
        onClose={() => setSwipeOpen(false)}
        title="Swipe file"
        subtitle={`${swipeItems.length} saved hooks`}
      >
        <input
          value={swipeQuery}
          onChange={(e) => setSwipeQuery(e.target.value)}
          placeholder="Search saved hooks…"
          className="ps-input mb-3 w-full"
        />
        {filteredSwipe.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">Nothing saved yet. Hit “Swipe file” on any hook.</p>
        ) : (
          <div className="space-y-2">
            {filteredSwipe.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card/50 p-3">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="truncate">{item.title}</span>
                  {item.platform && <span className="rounded-full border border-border px-1.5">{item.platform}</span>}
                  <div className="ml-auto flex items-center gap-1">
                    <GhostButton icon={<Copy className="h-3 w-3" />} onClick={() => { navigator.clipboard.writeText(item.content); toast.success("Copied"); }} />
                    <GhostButton
                      icon={<Trash2 className="h-3 w-3" />}
                      onClick={async () => {
                        const res = await removeSwipeItem({ data: { id: item.id } });
                        if (!res.success) return toast.error("Could not remove");
                        setSwipeItems((p) => p.filter((x) => x.id !== item.id));
                        setSavedTexts((p) => { const n = new Set(p); n.delete(item.content); return n; });
                      }}
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </SideDrawer>

      {/* HISTORY DRAWER */}
      <SideDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} title="Recent hook runs" subtitle="Reopen any past generation">
        {history.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">No past runs yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => {
              const out = Object.entries(h.outputs || {})
                .filter(([k]) => k.startsWith("hook_"))
                .sort((a, b) => Number(a[0].split("_")[1]) - Number(b[0].split("_")[1]));
              return (
                <div key={h.id} className="rounded-xl border border-border bg-card/50 p-3">
                  <p className="text-[12.5px] font-semibold text-foreground">{h.title || h.input_text.slice(0, 70)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(h.created_at).toLocaleString()} · {out.length} hooks
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <GhostButton
                      onClick={() => {
                        setHooks(
                          out.map(([, text]) => ({ framework: "Saved", text: String(text), score: 8, why: "From history" })),
                        );
                        setJobId(h.id);
                        setTopic(h.input_text.slice(0, 300));
                        setRemixes({}); setSeries(null); setAbA(null); setAbB(null); setWinner(null);
                        setHistoryOpen(false);
                        toast.success("Run reopened");
                      }}
                    >
                      Reopen
                    </GhostButton>
                    <GhostButton
                      icon={<Copy className="h-3.5 w-3.5" />}
                      onClick={() => {
                        navigator.clipboard.writeText(out.map(([, t], i) => `${i + 1}. ${t}`).join("\n"));
                        toast.success("Copied");
                      }}
                    >
                      Copy
                    </GhostButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
