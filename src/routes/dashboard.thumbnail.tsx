import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Download,
  Youtube,
  Twitter,
  FileText,
  Mic,
  Wand2,
  Image as ImageIcon,
  Images,
  Lightbulb,
  Smartphone,
  Check,
  RefreshCw,
  Type,
  Palette,
} from "lucide-react";
import { generateImage } from "@/lib/image.functions";
import { analyzeThumbnailSource, listRecentThumbnails } from "@/lib/thumbnail.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { UsageMeter } from "@/components/image/UsageMeter";
import { LimitReachedModal } from "@/components/image/LimitReachedModal";
import { ModelHealthBadge } from "@/components/image/ModelHealthBadge";
import { getWatermarkState } from "@/lib/imageWatermark";
import { StockPickerDialog } from "@/components/stock/StockPickerDialog";
import { CanvaDesignLauncher } from "@/components/canva/CanvaDesignLauncher";
import { CANVA_FORMATS } from "@/lib/canvaUrls";
import {
  THUMBNAIL_STYLES,
  THUMBNAIL_STARTERS,
  buildFinishedThumbnailPrompt,
  type ThumbnailStyleId,
} from "@/lib/thumbnailStyles";

export const Route = createFileRoute("/dashboard/thumbnail")({
  head: () => ({
    meta: [
      { title: "AI Thumbnail & Cover Generator — PostSpark" },
      {
        name: "description",
        content:
          "Turn a YouTube URL or an idea into click-worthy thumbnails and covers with Claude-engineered prompts and three AI image models.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ThumbnailPage,
});

/* ---------------------------------- data --------------------------------- */

type PresetId = "youtube" | "shorts" | "twitter-header" | "linkedin-banner" | "blog-cover" | "podcast";

type Preset = {
  id: PresetId;
  label: string;
  ratio: string;
  icon: any;
  width: number;
  height: number;
  aspect: "landscape" | "portrait" | "square";
  defaultPrompt: string;
};

const PRESETS: Preset[] = [
  {
    id: "youtube",
    label: "YouTube",
    ratio: "1280 × 720",
    icon: Youtube,
    width: 1280,
    height: 720,
    aspect: "landscape",
    defaultPrompt: "Bold, click-worthy YouTube thumbnail background, dramatic lighting, vivid colors",
  },
  {
    id: "shorts",
    label: "Shorts / Reels",
    ratio: "1080 × 1920",
    icon: Smartphone,
    width: 1080,
    height: 1920,
    aspect: "portrait",
    defaultPrompt: "Vertical short-form cover, punchy subject, high contrast, mobile-first composition",
  },
  {
    id: "twitter-header",
    label: "X header",
    ratio: "1500 × 500",
    icon: Twitter,
    width: 1500,
    height: 500,
    aspect: "landscape",
    defaultPrompt: "Wide cinematic banner background, abstract gradient, premium tech aesthetic",
  },
  {
    id: "linkedin-banner",
    label: "LinkedIn",
    ratio: "1584 × 396",
    icon: FileText,
    width: 1584,
    height: 396,
    aspect: "landscape",
    defaultPrompt: "Professional LinkedIn banner background, soft gradient, clean modern abstract",
  },
  {
    id: "blog-cover",
    label: "Blog cover",
    ratio: "1920 × 1080",
    icon: ImageIcon,
    width: 1920,
    height: 1080,
    aspect: "landscape",
    defaultPrompt: "Editorial blog hero background, soft depth of field, modern minimal",
  },
  {
    id: "podcast",
    label: "Podcast",
    ratio: "1400 × 1400",
    icon: Mic,
    width: 1400,
    height: 1400,
    aspect: "square",
    defaultPrompt: "Podcast cover art background, bold and atmospheric, premium broadcast aesthetic",
  },
];

const MODELS = [
  { id: "gpt", label: "GPT Image 2", note: "Best in-image text" },
  { id: "flux", label: "Flux 1.1 Pro", note: "Most photoreal" },
  { id: "gemini", label: "Gemini Flash", note: "Fastest drafts" },
] as const;
type ModelId = (typeof MODELS)[number]["id"];

const POSITIONS = [
  { id: "bottom-left", label: "Bottom left" },
  { id: "center", label: "Center" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
] as const;
type PositionId = (typeof POSITIONS)[number]["id"];

const COLOR_SWATCHES = ["#ffffff", "#0b1020", "#7c3aed", "#facc15", "#ef4444", "#22d3ee", "#22c55e", "#fb923c"];

type TabId = "youtube" | "idea" | "photo";

/* --------------------------------- helpers -------------------------------- */

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/* ---------------------------------- page --------------------------------- */

function ThumbnailPage() {
  const { session } = useAuth();
  const authHeaders = useMemo(
    () => (session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined),
    [session?.access_token],
  );

  const [tab, setTab] = useState<TabId>("youtube");
  const [presetId, setPresetId] = useState<PresetId>("youtube");
  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId)!, [presetId]);

  // inputs
  const [ytUrl, setYtUrl] = useState("");
  const [idea, setIdea] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [headlineIdeas, setHeadlineIdeas] = useState<string[]>([]);
  const [subheadIdeas, setSubheadIdeas] = useState<string[]>([]);
  const [sourceNote, setSourceNote] = useState<string>("");

  // design
  const [headline, setHeadline] = useState("How I 10x'd My Output");
  const [subhead, setSubhead] = useState("In 30 days, no shortcuts");
  const [visualPrompt, setVisualPrompt] = useState("");
  const [styleId, setStyleId] = useState<ThumbnailStyleId>("mrbeast");
  const [model, setModel] = useState<ModelId>("gpt");
  const [aiRendersText, setAiRendersText] = useState(true);
  const [headlineColor, setHeadlineColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#facc15");
  const [position, setPosition] = useState<PositionId>("bottom-left");
  const [scrim, setScrim] = useState(0.5);

  // output
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [usageKey, setUsageKey] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);

  const stage = useElementWidth<HTMLDivElement>();
  const uploadRef = useRef<HTMLInputElement>(null);
  const wm = getWatermarkState();

  const overlayVisible = !(aiRendersText && model === "gpt");

  const loadRecent = () => {
    if (!authHeaders) return;
    listRecentThumbnails({ headers: authHeaders })
      .then((r: any) => setRecent(r?.items ?? []))
      .catch(() => {});
  };
  useEffect(loadRecent, [session?.access_token]);

  /* ------------------------------- analyze ------------------------------- */

  const analyze = async () => {
    if (!session) return toast.error("Please sign in");
    setAnalyzing(true);
    setSourceNote("");
    try {
      const res: any = await analyzeThumbnailSource({
        data: {
          mode: tab === "youtube" ? "youtube" : "idea",
          url: ytUrl.trim() || undefined,
          idea: idea.trim() || undefined,
          preset: presetId,
        },
        headers: authHeaders,
      });
      if (res?.error) return toast.error(res.error);
      setHeadlineIdeas(res.headlines || []);
      setSubheadIdeas(res.subheads || []);
      if (res.headlines?.[0]) setHeadline(res.headlines[0]);
      if (res.subheads?.[0]) setSubhead(res.subheads[0]);
      if (res.visualPrompt) setVisualPrompt(res.visualPrompt);
      if (res.style) applyStyleColors(res.style);
      if (res.notice) setSourceNote(res.notice);
      else if (res.words) setSourceNote(`Transcript analyzed — ${res.words.toLocaleString()} words`);
      toast.success("Concepts ready");
    } catch (e: any) {
      toast.error(e?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const applyStyleColors = (id: ThumbnailStyleId) => {
    setStyleId(id);
    const s = THUMBNAIL_STYLES.find((t) => t.id === id);
    if (s) {
      setHeadlineColor(s.defaultHeadlineColor);
      setAccentColor(s.defaultAccentColor);
    }
  };

  /* ------------------------------- generate ------------------------------ */

  const generate = async () => {
    if (!session) return toast.error("Please sign in");
    if (!headline.trim()) return toast.error("Add a headline first");
    setLoading(true);
    setBgUrl("");
    try {
      const promptPreset = (presetId === "shorts" ? "youtube" : presetId) as any;
      const finalPrompt = overlayVisible
        ? `${visualPrompt.trim() || preset.defaultPrompt}. Style: ${
            THUMBNAIL_STYLES.find((s) => s.id === styleId)?.visualDirective
          }. Leave clear negative space for a large text overlay. No text, letters or typography in the image.`
        : buildFinishedThumbnailPrompt({
            headline,
            subhead,
            styleId,
            preset: promptPreset,
            userPrompt: visualPrompt.trim() || undefined,
            headlineColor,
            accentColor,
            position,
          });

      const res: any = await withAIProgress(
        generateImage({
          data: {
            prompt: finalPrompt,
            style: "cinematic",
            aspect: preset.aspect,
            template: presetId === "blog-cover" ? "blog-cover" : "thumbnail",
            model,
            quality: "hd",
            originalPrompt: `${headline}${subhead ? ` | ${subhead}` : ""}`,
          },
          headers: authHeaders,
        }),
      );
      if (res?.error === "LIMIT_REACHED") return setLimitOpen(true);
      if (res?.error) return toast.error(res.error);
      if (!res?.imageUrl) return toast.error("No image returned");
      setBgUrl(res.imageUrl);
      setUsageKey((k) => k + 1);
      loadRecent();
      toast.success(overlayVisible ? "Artwork ready — text overlay applied" : "Finished thumbnail ready");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- download ------------------------------ */

  const download = async () => {
    const node = stage.ref.current;
    if (!node || !bgUrl) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        useCORS: true,
        scale: Math.max(1, preset.width / Math.max(1, node.getBoundingClientRect().width)),
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `postspark-${presetId}-${Date.now()}.png`;
      a.click();
      toast.success(`Downloaded ${preset.ratio} PNG`);
    } catch (e) {
      console.error(e);
      toast.error("Download failed — try right-clicking the preview to save");
    } finally {
      setDownloading(false);
    }
  };

  const applyStarter = (s: (typeof THUMBNAIL_STARTERS)[number]) => {
    setPresetId((s.preset === "podcast" ? "podcast" : s.preset) as PresetId);
    applyStyleColors(s.style);
    setHeadline(s.headline);
    setSubhead(s.subhead);
    setVisualPrompt(s.bgPrompt);
    toast.success(`Loaded: ${s.label}`);
  };

  /* --------------------------------- text -------------------------------- */

  const w = stage.width || 640;
  const headlineSize = Math.round(w * (presetId === "shorts" ? 0.1 : presetId === "podcast" ? 0.11 : 0.085));
  const subheadSize = Math.round(headlineSize * 0.36);

  const align =
    position === "center"
      ? "items-center justify-center text-center"
      : position === "top"
        ? "items-start justify-start text-left"
        : position === "bottom"
          ? "items-center justify-end text-center"
          : "items-start justify-end text-left";

  /* --------------------------------- view -------------------------------- */

  return (
    <div className="space-y-8 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Claude 5 prompt engineering
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Thumbnail &amp; Cover Generator
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Paste a YouTube link or describe your idea. PostSpark writes the headlines, engineers the
              image prompt, and renders publish-ready art in every platform size.
            </p>
            <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
              {[
                ["3 AI models", "GPT Image 2 · Flux · Gemini"],
                ["6 formats", "YouTube → Podcast"],
                ["1-click export", "Exact platform pixels"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-sm font-bold text-foreground">{k}</div>
                  <div>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <UsageMeter refreshKey={usageKey} />
            <ModelHealthBadge />
          </div>
        </div>
      </section>

      {/* Input tabs */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { id: "youtube", label: "YouTube URL", icon: Youtube },
              { id: "idea", label: "Describe idea", icon: Lightbulb },
              { id: "photo", label: "Use a photo", icon: Images },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "youtube" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
              <button
                onClick={analyze}
                disabled={analyzing || !ytUrl.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Analyze video
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              We read the title and transcript, then write thumbnail headlines that match the hook.
            </p>
          </div>
        )}

        {tab === "idea" && (
          <div className="space-y-3">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={3}
              placeholder="e.g. A video about quitting my $200k job to build a solo SaaS in 90 days"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
            <button
              onClick={analyze}
              disabled={analyzing || idea.trim().length < 4}
              className="inline-flex items-center gap-2 rounded-xl gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate concepts
            </button>
          </div>
        )}

        {tab === "photo" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStockOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:border-primary/40"
            >
              <Images className="h-4 w-4" /> Pick a stock photo
            </button>
            <button
              onClick={() => uploadRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:border-primary/40"
            >
              <ImageIcon className="h-4 w-4" /> Upload your own
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setBgUrl(String(reader.result));
                  setAiRendersText(false);
                  toast.success("Photo loaded — add your headline");
                };
                reader.readAsDataURL(f);
              }}
            />
            <p className="w-full text-xs text-muted-foreground">
              Your photo becomes the background; the headline is composited on top and flattened on export.
            </p>
          </div>
        )}

        {sourceNote && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Check className="h-3.5 w-3.5" /> {sourceNote}
          </p>
        )}

        {headlineIdeas.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Headline suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {headlineIdeas.map((h) => (
                <button
                  key={h}
                  onClick={() => setHeadline(h)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    headline === h
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            {subheadIdeas.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {subheadIdeas.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubhead(s)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Config + preview */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* controls */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div>
            <Label icon={ImageIcon}>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    presetId === p.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <p.icon className="h-4 w-4 text-primary" />
                  <div className="mt-1 text-xs font-semibold text-foreground">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.ratio}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label icon={Type}>Headline</Label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <input
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              placeholder="Subhead (optional)"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <Label icon={Sparkles}>Style</Label>
            <div className="flex flex-wrap gap-1.5">
              {THUMBNAIL_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applyStyleColors(s.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    styleId === s.id
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span aria-hidden>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label icon={Wand2}>AI model</Label>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                    model === m.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground">{m.label}</span>
                  <span className="text-[11px] text-muted-foreground">{m.note}</span>
                </button>
              ))}
            </div>
            {model === "gpt" && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={aiRendersText}
                  onChange={(e) => setAiRendersText(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--primary)]"
                />
                Let GPT Image 2 render the text inside the artwork
              </label>
            )}
          </div>

          <div>
            <Label icon={Palette}>Colors</Label>
            <ColorRow label="Headline" value={headlineColor} onChange={setHeadlineColor} />
            <ColorRow label="Accent" value={accentColor} onChange={setAccentColor} />
          </div>

          {overlayVisible && (
            <div>
              <Label icon={Type}>Text placement</Label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPosition(p.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      position === p.id
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Darken background</span>
                  <span>{Math.round(scrim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={scrim}
                  onChange={(e) => setScrim(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
            </div>
          )}

          <div>
            <Label icon={Sparkles}>Art direction (optional)</Label>
            <textarea
              value={visualPrompt}
              onChange={(e) => setVisualPrompt(e.target.value)}
              rows={3}
              placeholder={preset.defaultPrompt}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-electric px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Rendering…" : bgUrl ? "Regenerate" : "Generate thumbnail"}
          </button>
        </div>

        {/* preview */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Live preview</h2>
                <p className="text-xs text-muted-foreground">
                  {preset.label} · {preset.ratio}
                </p>
              </div>
              <div className="flex gap-2">
                {bgUrl && (
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary/40 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> New variant
                  </button>
                )}
                <button
                  onClick={download}
                  disabled={!bgUrl || downloading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary/40 disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download PNG
                </button>
              </div>
            </div>

            <div
              ref={stage.ref}
              className="relative w-full overflow-hidden rounded-xl bg-[#0b1020]"
              style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
            >
              {bgUrl ? (
                <img src={bgUrl} alt={headline} crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg,#0b1020,#7c3aed)" }}
                />
              )}

              {overlayVisible && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        position === "top"
                          ? `linear-gradient(180deg, rgba(0,0,0,${scrim + 0.15}), transparent 70%)`
                          : position === "center"
                            ? `rgba(0,0,0,${scrim})`
                            : `linear-gradient(0deg, rgba(0,0,0,${scrim + 0.2}), transparent 70%)`,
                    }}
                  />
                  <div className={`absolute inset-0 flex flex-col gap-[2%] p-[5%] ${align}`}>
                    <div
                      className="font-black uppercase leading-[0.95]"
                      style={{
                        color: headlineColor,
                        fontSize: `${headlineSize}px`,
                        letterSpacing: "-0.02em",
                        textShadow: "0 4px 24px rgba(0,0,0,0.55)",
                        maxWidth: position === "bottom-left" ? "78%" : "100%",
                      }}
                    >
                      {headline}
                    </div>
                    {subhead && (
                      <div
                        className="font-bold"
                        style={{
                          color: accentColor,
                          fontSize: `${subheadSize}px`,
                          textShadow: "0 2px 14px rgba(0,0,0,0.5)",
                        }}
                      >
                        {subhead}
                      </div>
                    )}
                  </div>
                </>
              )}

              {wm.on && wm.text?.trim() && (
                <div
                  className="absolute bottom-[2.5%] right-[3%] text-[1.6cqw] font-semibold"
                  style={{ color: "#fff", opacity: (wm.opacity ?? 60) / 100, fontSize: `${Math.round(w * 0.018)}px` }}
                >
                  {wm.text}
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-xl bg-background/90 px-4 py-2.5 text-sm font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Rendering artwork…
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick start */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground">Quick start templates</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Proven format + style + copy combos. Load one, tweak the headline, generate.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {THUMBNAIL_STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => applyStarter(s)}
                  className="rounded-xl border border-border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="text-sm font-semibold text-foreground">
                    <span aria-hidden>{s.emoji}</span> {s.label}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.headline}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent */}
      {recent.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground">Recent thumbnails</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setBgUrl(r.image_url);
                  toast.success("Loaded into preview");
                }}
                className="group overflow-hidden rounded-xl border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <img src={r.image_url} alt="Generated thumbnail" loading="lazy" className="aspect-video w-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Canva */}
      <CanvaDesignLauncher
        designType="thumbnail"
        formats={CANVA_FORMATS}
        defaultTitle={headline}
        heading="Finish it in Canva"
        description="Prefer your own templates, fonts and brand assets? Create the design in your Canva account and export it straight back into PostSpark."
      />

      <StockPickerDialog
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        initialQuery={headline || "creator"}
        title="Pick a background"
        selectLabel="Use as background"
        onSelectPhoto={(p: any) => {
          setBgUrl(p.url || p.fullUrl || p.thumbUrl);
          setAiRendersText(false);
          setStockOpen(false);
          toast.success("Background set");
        }}
      />

      <LimitReachedModal open={limitOpen} onClose={() => setLimitOpen(false)} feature="thumbnail" />
    </div>
  );
}

/* -------------------------------- subviews ------------------------------- */

function Label({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {children}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-16 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`${label} ${c}`}
            className={`h-6 w-6 rounded-md border-2 transition-transform hover:scale-110 ${
              value === c ? "border-primary" : "border-border"
            }`}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded-md border border-border bg-transparent"
          aria-label={`${label} custom color`}
        />
      </div>
    </div>
  );
}
