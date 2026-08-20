import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Sparkles, Download, Copy, Check, ChevronLeft, ChevronRight, Layers,
  Wand2, Image as ImageIcon, FileText, Droplet, Palette as PaletteIcon, Trash2,
  Plus, ArrowUp, ArrowDown, Send, Type as TypeIcon, RefreshCw, X,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { createCarousel, rewriteSlide, refreshCaption } from "@/lib/carousel.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { generateImage, saveImageToLibrary } from "@/lib/image.functions";
import { searchStockPhotos } from "@/lib/stockMedia.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { UsageMeter } from "@/components/image/UsageMeter";
import { LimitReachedModal } from "@/components/image/LimitReachedModal";
import { getWatermarkState, setWatermarkState } from "@/lib/imageWatermark";
import { ModelHealthBadge } from "@/components/image/ModelHealthBadge";
import { CanvaDesignLauncher } from "@/components/canva/CanvaDesignLauncher";
import { CANVA_CAROUSEL_FORMATS } from "@/lib/canvaUrls";
import { HeroArt } from "@/components/dashboard/HeroArt";
import { SlideCanvas } from "@/components/carousel/SlideCanvas";
import { TemplateGallery } from "@/components/carousel/TemplateGallery";
import { SlideInspector } from "@/components/carousel/SlideInspector";
import { PUBLISH_PACK_KEY, type Piece } from "@/lib/pieces";
import {
  CAROUSEL_FONTS_HREF, DEFAULT_DESIGN, hasOverride, mergePalette, mergeTemplate,
  presetByKey, resolvePalette, templateByKey, type Slide, type SlideOverride,
} from "@/lib/carouselDesign";


export const Route = createFileRoute("/dashboard/carousel")({
  head: () => ({
    meta: [
      { title: "Carousel Studio — PostSpark" },
      {
        name: "description",
        content:
          "Generate deep, premium LinkedIn and Instagram carousels with AI copy, designer templates, AI or stock backgrounds, and one-click publishing.",
      },
    ],
    links: [{ rel: "stylesheet", href: CAROUSEL_FONTS_HREF }],
  }),
  component: CarouselPage,
});

interface BrandKit {
  brand_name?: string | null;
  brand_handle?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
}

const TONES = ["authoritative", "playful", "professional", "bold", "educational", "story-driven"] as const;
const SLIDE_ACTIONS = [
  { key: "punchier", label: "Punchier" },
  { key: "expand", label: "Go deeper" },
  { key: "concrete", label: "Add specifics" },
  { key: "shorten", label: "Tighten" },
] as const;

function CarouselPage() {
  const { session } = useAuth();
  const auth = useMemo(
    () => (session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : {}),
    [session],
  );

  // Brief
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("authoritative");
  const [framework, setFramework] = useState("listicle");
  const [slideCount, setSlideCount] = useState(8);
  const [depth, setDepth] = useState<"standard" | "deep">("deep");

  // Design
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const preset = presetByKey(design.presetKey);
  const template = templateByKey(design.templateKey);

  // Content
  const [slides, setSlides] = useState<Slide[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [active, setActive] = useState(0);

  // Async state
  const [loading, setLoading] = useState(false);
  const [busySlide, setBusySlide] = useState<number | null>(null);
  const [artBusy, setArtBusy] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [stockQuery, setStockQuery] = useState("");
  const [tab, setTab] = useState<"slide" | "design" | "art" | "copy">("slide");

  // Watermark
  const initialWm = getWatermarkState();
  const [watermarkOn, setWatermarkOn] = useState(initialWm.on);
  const [watermarkText, setWatermarkText] = useState(initialWm.text);
  const [watermarkOpacity] = useState(initialWm.opacity);
  const [watermarkPlacement] = useState(initialWm.placement);
  useEffect(() => {
    setWatermarkState(watermarkOn, watermarkText, watermarkOpacity, watermarkPlacement);
  }, [watermarkOn, watermarkText, watermarkOpacity, watermarkPlacement]);

  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!session) return;
    getBrandKit(auth as any)
      .then(({ kit }) => setKit(kit as any))
      .catch(() => {});
  }, [session, auth]);

  useEffect(() => {
    try {
      const t = new URL(window.location.href).searchParams.get("topic");
      if (t) setTopic((prev) => prev || t.slice(0, 2000));
    } catch {
      /* ignore */
    }
  }, []);

  const palette = resolvePalette(template, {
    useBrand: design.useBrand,
    brandPrimary: kit?.primary_color,
    brandAccent: kit?.accent_color,
  });
  const brandName = kit?.brand_name || "PostSpark";
  const handle = kit?.brand_handle || "@postspark";
  const watermark = { on: watermarkOn, text: watermarkText, opacity: watermarkOpacity, placement: watermarkPlacement };

  /** Resolve the effective design for one slide (deck design + its overrides). */
  const resolveFor = (s: Slide) => {
    const ov = s.override;
    const tpl = mergeTemplate(template, ov);
    const basePalette = ov?.templateKey
      ? resolvePalette(tpl, {
          useBrand: design.useBrand,
          brandPrimary: kit?.primary_color,
          brandAccent: kit?.accent_color,
        })
      : palette;
    return {
      template: tpl,
      palette: mergePalette(basePalette, ov),
      fontPairKey: ov?.fontPairKey ?? design.fontPairKey,
    };
  };

  const patchOverride = (idx: number, patch: SlideOverride) =>
    setSlides((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, override: { ...(x.override ?? {}), ...patch } } : x)),
    );

  const resetOverride = (idx: number) =>
    setSlides((prev) => prev.map((x, i) => (i === idx ? { ...x, override: undefined } : x)));



  /* ------------------------------------------------------------ generate */

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 5) return toast.error("Add a topic (at least 5 characters)");
    setLoading(true);
    setSlides([]);
    setActive(0);
    try {
      const res: any = await withAIProgress(
        createCarousel({
          data: {
            topic: topic.trim(),
            audience: audience.trim() || undefined,
            tone,
            framework,
            depth,
            slideCount,
            useBrandVoice: true,
          },
          ...auth,
        } as any),
      );
      if (res.error) {
        if (res.error === "LIMIT_REACHED") setLimitOpen(true);
        else toast.error(res.error);
        return;
      }
      setSlides(res.slides as Slide[]);
      setCaption(res.caption);
      setHashtags(res.hashtags);
      toast.success(`${res.slides.length} slides written`);
    } catch (e: any) {
      toast.error(e?.message || "Carousel generation failed");
    } finally {
      setLoading(false);
    }
  };

  const runSlideAction = async (idx: number, action: (typeof SLIDE_ACTIONS)[number]["key"]) => {
    if (!session) return;
    const s = slides[idx];
    setBusySlide(idx);
    try {
      const r: any = await withAIProgress(
        rewriteSlide({
          data: {
            title: s.title,
            body: s.body,
            kind: s.kind,
            bullets: s.bullets,
            action,
            tone,
            topic: topic.slice(0, 400),
          },
          ...auth,
        } as any),
      );
      if (r.error) {
        r.error === "LIMIT_REACHED" ? setLimitOpen(true) : toast.error(r.error);
        return;
      }
      updateSlide(idx, { title: r.title, body: r.body, bullets: r.bullets ?? s.bullets });
      toast.success("Slide updated");
    } catch (e: any) {
      toast.error(e?.message || "Rewrite failed");
    } finally {
      setBusySlide(null);
    }
  };

  const handleRefreshCaption = async () => {
    if (!session || !slides.length) return;
    setBusySlide(-1);
    try {
      const r: any = await withAIProgress(
        refreshCaption({
          data: {
            topic: topic.trim() || slides[0].title,
            tone,
            slides: slides.map((s) => ({ title: s.title, body: s.body })),
          },
          ...auth,
        } as any),
      );
      if (r.error) return toast.error(r.error);
      setCaption(r.caption);
      setHashtags(r.hashtags);
      toast.success("Caption refreshed");
    } catch (e: any) {
      toast.error(e?.message || "Caption failed");
    } finally {
      setBusySlide(null);
    }
  };

  /* ----------------------------------------------------------------- art */

  const aspectForPreset = () =>
    preset.height > preset.width ? "portrait" : preset.height === preset.width ? "square" : "landscape";

  const generateArt = async (idx: number) => {
    if (!session) return toast.error("Please sign in");
    const s = slides[idx];
    const prompt =
      s.imagePrompt ||
      `Abstract premium background texture for a slide titled "${s.title}" — soft light, depth, no text, no people, no logos.`;
    setArtBusy(true);
    try {
      const r: any = await withAIProgress(
        generateImage({
          data: {
            prompt,
            style: "abstract",
            aspect: aspectForPreset(),
            template: "carousel",
            model: "flux",
            quality: "hd",
          },
          ...auth,
        } as any),
      );
      if (r.error) {
        r.error === "LIMIT_REACHED" ? setLimitOpen(true) : toast.error(r.error);
        return;
      }
      updateSlide(idx, { imageUrl: r.imageUrl, imageCredit: "" });
      toast.success("Background generated");
    } catch (e: any) {
      toast.error(e?.message || "Background generation failed");
    } finally {
      setArtBusy(false);
    }
  };

  const generateArtForAll = async () => {
    for (let i = 0; i < slides.length; i++) {
      // Sequential on purpose — image quota is per-request.
      // eslint-disable-next-line no-await-in-loop
      await generateArt(i);
    }
  };

  const runStockSearch = async () => {
    if (!session || stockQuery.trim().length < 2) return;
    setArtBusy(true);
    try {
      const r: any = await searchStockPhotos({
        data: {
          query: stockQuery.trim(),
          source: "all",
          page: 1,
          orientation: preset.height > preset.width ? "portrait" : "landscape",
        },
        ...auth,
      } as any);
      if (r.error) return toast.error(r.error);
      setStock(r.photos || []);
    } catch (e: any) {
      toast.error(e?.message || "Stock search failed");
    } finally {
      setArtBusy(false);
    }
  };

  /* -------------------------------------------------------- slide edits */

  const updateSlide = (idx: number, patch: Partial<Slide>) =>
    setSlides((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setActive(j);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 3) return toast.error("Keep at least 3 slides");
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActive((a) => Math.max(0, Math.min(a, slides.length - 2)));
  };

  const addSlide = () => {
    setSlides((prev) => {
      const next = [...prev];
      const lastIsCta = next[next.length - 1]?.kind === "cta";
      const at = lastIsCta ? next.length - 1 : next.length;
      next.splice(at, 0, {
        title: "New slide",
        body: "Add the specific insight, number or example that makes this slide worth swiping to.",
        kind: "insight",
      });
      return next;
    });
  };

  /* -------------------------------------------------------------- export */

  const renderSlideBlob = async (idx: number, format: "png" | "jpg"): Promise<Blob | null> => {
    const node = slideRefs.current[idx];
    if (!node) return null;
    const canvas = await html2canvas(node, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      width: preset.width,
      height: preset.height,
      windowWidth: preset.width,
      windowHeight: preset.height,
    });
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), format === "jpg" ? "image/jpeg" : "image/png", 0.95),
    );
  };

  const renderSlideDataUrl = async (idx: number): Promise<string | null> => {
    const node = slideRefs.current[idx];
    if (!node) return null;
    const canvas = await html2canvas(node, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      width: preset.width,
      height: preset.height,
    });
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const downloadOne = async (idx: number, format: "png" | "jpg" = "png") => {
    setExporting(`one-${idx}`);
    try {
      const blob = await renderSlideBlob(idx, format);
      if (!blob) return toast.error("Export failed");
      triggerDownload(blob, `slide-${idx + 1}.${format}`);
      toast.success(`Slide ${idx + 1} downloaded`);
    } finally {
      setExporting(null);
    }
  };

  const downloadZip = async () => {
    if (!slides.length) return;
    setExporting("zip");
    try {
      const zip = new JSZip();
      for (let i = 0; i < slides.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const blob = await renderSlideBlob(i, "png");
        if (blob) zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      triggerDownload(out, `carousel-${Date.now()}.zip`);
      toast.success("All slides exported");
    } catch {
      toast.error("Bulk export failed");
    } finally {
      setExporting(null);
    }
  };

  /** PDF is built from the SAME rendered pixels as the preview — never redrawn. */
  const exportPdf = async () => {
    if (!slides.length) return;
    setExporting("pdf");
    try {
      const doc = new jsPDF({
        unit: "px",
        format: [preset.width, preset.height],
        orientation: preset.width > preset.height ? "landscape" : "portrait",
        compress: true,
      });
      for (let i = 0; i < slides.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const dataUrl = await renderSlideDataUrl(i);
        if (!dataUrl) continue;
        if (i > 0)
          doc.addPage([preset.width, preset.height], preset.width > preset.height ? "landscape" : "portrait");
        doc.addImage(dataUrl, "JPEG", 0, 0, preset.width, preset.height, undefined, "FAST");
      }
      doc.save(`carousel-${Date.now()}.pdf`);
      toast.success("PDF downloaded — pixel-identical to your preview");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExporting(null);
    }
  };

  /** Upload every rendered slide and return public URLs (publishing + Canva). */
  const uploadSlides = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < slides.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await renderSlideDataUrl(i);
      if (!dataUrl) continue;
      // eslint-disable-next-line no-await-in-loop
      const r: any = await saveImageToLibrary({
        data: {
          imageDataUrl: dataUrl,
          prompt: `Carousel slide ${i + 1}: ${slides[i].title}`.slice(0, 300),
          template: "carousel",
          source: "carousel",
          aspect: `${preset.width}x${preset.height}`,
          safetyCheck: false,
        },
        ...auth,
      } as any);
      if (r?.image?.image_url) urls.push(r.image.image_url);
    }
    return urls;
  };

  const sendToPublishing = async () => {
    if (!session) return toast.error("Please sign in");
    if (!slides.length) return;
    setExporting("publish");
    try {
      const urls = await uploadSlides();
      if (!urls.length) throw new Error("Could not upload slides");
      const text = `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`.trim();
      const pieces: Piece[] = [
        {
          id: `carousel-${Date.now()}`,
          format: "carousel",
          platform: preset.platform === "twitter" ? "twitter" : preset.platform,
          index: 0,
          total: 1,
          text,
          media: urls,
          document: false,
        },
      ];
      sessionStorage.setItem(
        PUBLISH_PACK_KEY,
        JSON.stringify({ pieces, createdAt: Date.now(), source: "carousel" }),
      );
      toast.success("Carousel sent to the Publishing Center");
      window.location.href = "/dashboard/publishing";
    } catch (e: any) {
      toast.error(e?.message || "Could not hand off to publishing");
    } finally {
      setExporting(null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  };

  const allText = () => {
    const tags = hashtags.map((h) => `#${h}`).join(" ");
    const body = slides
      .map((s, i) => `Slide ${i + 1} (${s.kind})\n${s.title}\n${s.body}${s.bullets?.length ? `\n• ${s.bullets.join("\n• ")}` : ""}`)
      .join("\n\n");
    return `${caption}\n\n${tags}\n\n---\n\n${body}`;
  };

  /* ----------------------------------------------------------------- ui */

  const previewWidth = 420;
  const scale = previewWidth / preset.width;
  const current = slides[active];

  return (
    <div className="mx-auto max-w-7xl pb-24">
      <section className="ps-tool-hero ps-elev-2 ds-fade-up relative overflow-hidden">
        <span className="ps-ambient" aria-hidden />
        <HeroArt art="carousel" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-electric glow-electric">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Carousel Studio</h1>
              <p className="text-sm text-muted-foreground">
                Deep AI copy, designer templates, AI or stock art — export or publish in one click.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <UsageMeter refreshKey={slides.length} />
            <ModelHealthBadge compact />
          </div>
        </div>
      </section>

      {/* Brief */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5 ps-elev-1">
        <label className="text-sm font-semibold text-foreground">Topic or angle</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Why most founders' LinkedIn posts flop — and the 7 fixes that actually move pipeline"
          className="mt-2 h-24 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Audience (optional)</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="B2B SaaS founders doing $1–10M ARR"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tone</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {TONES.map((v) => (
                <button
                  key={v}
                  onClick={() => setTone(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    tone === v
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">Story framework</label>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FRAMEWORKS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFramework(f.key)}
                className={`rounded-xl border p-3 text-left transition ${
                  framework === f.key
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="text-sm font-semibold text-foreground">{f.label}</div>
                <div className="text-[11px] text-muted-foreground">{f.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Slides: <span className="text-foreground">{slideCount}</span>
            </label>
            <input
              type="range"
              min={5}
              max={12}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="mt-1 block w-48 accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Copy depth</label>
            <div className="mt-1 flex gap-1.5">
              {(["standard", "deep"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                    depth === d
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 rounded-xl gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-electric disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {slides.length ? "Regenerate deck" : "Generate carousel"}
          </button>
        </div>
      </div>

      {slides.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Write your topic above and PostSpark will build the full deck — copy, layout and art.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_460px]">
          {/* LEFT — control tabs */}
          <div className="space-y-4">
            <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1.5">
              {([
                { k: "design", label: "Design", icon: PaletteIcon },
                { k: "art", label: "Art", icon: ImageIcon },
                { k: "copy", label: "Copy", icon: TypeIcon },
              ] as const).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === t.k ? "gradient-electric text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            {tab === "design" ? (
              <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Canvas</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    {CAROUSEL_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setDesign((d) => ({ ...d, presetKey: p.key }))}
                        className={`rounded-xl border p-3 text-left transition ${
                          design.presetKey === p.key
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="text-sm font-semibold text-foreground">{p.label}</div>
                        <div className="text-[11px] text-muted-foreground">{p.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Template</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {CAROUSEL_TEMPLATES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() =>
                          setDesign((d) => ({ ...d, templateKey: t.key, fontPairKey: t.fontPair }))
                        }
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          design.templateKey === t.key
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <span
                          className="h-10 w-10 shrink-0 rounded-lg border border-border"
                          style={{ background: t.surface, boxShadow: `inset 0 -10px 0 ${t.accent}` }}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">{t.label}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{t.blurb}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typography</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {FONT_PAIRS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setDesign((d) => ({ ...d, fontPairKey: f.key }))}
                        style={{ fontFamily: `'${f.heading}', serif` }}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                          design.fontPairKey === f.key
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-input bg-background text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-xs">
                  {([
                    ["useBrand", "Use brand colours"],
                    ["showBrandBar", "Brand bar"],
                    ["showCounter", "Slide counter"],
                    ["showSwipeHint", "Swipe hint"],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="inline-flex cursor-pointer items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={design[k]}
                        onChange={(e) => setDesign((d) => ({ ...d, [k]: e.target.checked }))}
                        className="h-4 w-4 rounded border-input"
                      />
                      {label}
                    </label>
                  ))}
                  <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={watermarkOn}
                      onChange={(e) => setWatermarkOn(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Droplet className="h-3.5 w-3.5 text-primary" /> Watermark
                  </label>
                  {watermarkOn ? (
                    <input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      maxLength={40}
                      placeholder="@yourbrand"
                      className="w-40 rounded-md border border-input bg-background px-2 py-1 text-xs"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === "art" ? (
              <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Backgrounds for slide {active + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      AI art via Flux, or free stock from Unsplash &amp; Pexels. A scrim keeps text readable.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateArt(active)}
                      disabled={artBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {artBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                      AI background
                    </button>
                    <button
                      onClick={generateArtForAll}
                      disabled={artBusy}
                      className="rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
                    >
                      Whole deck
                    </button>
                    {current?.imageUrl ? (
                      <button
                        onClick={() => updateSlide(active, { imageUrl: undefined, imageCredit: undefined })}
                        className="rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-accent"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={stockQuery}
                    onChange={(e) => setStockQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runStockSearch()}
                    placeholder="Search stock photos — e.g. minimal gradient, city night"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={runStockSearch}
                    disabled={artBusy}
                    className="rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
                  >
                    Search
                  </button>
                </div>

                {stock.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {stock.slice(0, 12).map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          updateSlide(active, {
                            imageUrl: p.url || p.src || p.full,
                            imageCredit: p.photographer ? `Photo: ${p.photographer}` : "",
                          })
                        }
                        className="overflow-hidden rounded-lg border border-border hover:border-primary"
                      >
                        <img
                          src={p.thumb || p.preview || p.url}
                          alt={p.alt || "stock"}
                          className="h-20 w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "copy" ? (
              <div className="space-y-3">
                {slides.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border bg-card p-4 transition ${
                      i === active ? "border-primary" : "border-border"
                    }`}
                    onClick={() => setActive(i)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {i + 1} · {s.kind}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => moveSlide(i, -1)} className="rounded p-1.5 hover:bg-accent" title="Move up">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveSlide(i, 1)} className="rounded p-1.5 hover:bg-accent" title="Move down">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteSlide(i)} className="rounded p-1.5 text-destructive hover:bg-accent" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      value={s.title}
                      onChange={(e) => updateSlide(i, { title: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold"
                    />
                    <textarea
                      value={s.body}
                      onChange={(e) => updateSlide(i, { body: e.target.value })}
                      className="mt-2 h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {SLIDE_ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          onClick={() => runSlideAction(i, a.key)}
                          disabled={busySlide === i}
                          className="rounded-full border border-input px-2.5 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
                        >
                          {busySlide === i ? <Loader2 className="h-3 w-3 animate-spin" /> : a.label}
                        </button>
                      ))}
                      <span className="ml-auto text-[11px] text-muted-foreground">{s.body.length} chars</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addSlide}
                  className="w-full rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  <Plus className="mr-1.5 inline h-4 w-4" /> Add slide
                </button>
              </div>
            ) : null}

            {/* Caption */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Caption &amp; hashtags</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleRefreshCaption}
                    disabled={busySlide === -1}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {busySlide === -1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Rewrite
                  </button>
                  <button
                    onClick={() => handleCopy(allText(), "all")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    {copied === "all" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy all
                  </button>
                </div>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-2 h-28 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">{hashtags.map((h) => `#${h}`).join(" ")}</p>
            </div>
          </div>

          {/* RIGHT — sticky preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-4 ps-elev-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {preset.label} · {preset.width}×{preset.height}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActive((a) => Math.max(0, a - 1))}
                    className="rounded-lg border border-input p-1.5 hover:bg-accent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-1 text-xs font-medium">
                    {active + 1} / {slides.length}
                  </span>
                  <button
                    onClick={() => setActive((a) => Math.min(slides.length - 1, a + 1))}
                    className="rounded-lg border border-input p-1.5 hover:bg-accent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scaled preview window */}
              <div
                className="mt-3 overflow-hidden rounded-xl border border-border"
                style={{ width: previewWidth, height: preset.height * scale, maxWidth: "100%" }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  {current ? (
                    <SlideCanvas
                      slide={current}
                      index={active}
                      total={slides.length}
                      preset={preset}
                      template={template}
                      palette={palette}
                      fontPairKey={design.fontPairKey}
                      brandName={brandName}
                      handle={handle}
                      logoUrl={kit?.logo_url}
                      showBrandBar={design.showBrandBar}
                      showCounter={design.showCounter}
                      showSwipeHint={design.showSwipeHint}
                      watermark={watermark}
                    />
                  ) : null}
                </div>
              </div>

              {/* Filmstrip */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-14 w-11 shrink-0 rounded-md border text-[10px] font-bold ${
                      i === active ? "border-primary ring-2 ring-primary/30" : "border-border"
                    }`}
                    style={{ background: s.imageUrl ? `url(${s.imageUrl}) center/cover` : palette.surface, color: palette.text }}
                    title={s.title}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Export actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadOne(active, "png")}
                  disabled={Boolean(exporting)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" /> This slide
                </button>
                <button
                  onClick={downloadZip}
                  disabled={Boolean(exporting)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
                >
                  {exporting === "zip" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  All PNGs
                </button>
                <button
                  onClick={exportPdf}
                  disabled={Boolean(exporting)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
                >
                  {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  PDF
                </button>
                <button
                  onClick={sendToPublishing}
                  disabled={Boolean(exporting)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg gradient-electric px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {exporting === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Publish
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                PDF and PNGs are rendered from this exact preview — what you see ships.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen full-size render targets for export */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
        {slides.map((s, i) => (
          <SlideCanvas
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            slide={s}
            index={i}
            total={slides.length}
            preset={preset}
            template={template}
            palette={palette}
            fontPairKey={design.fontPairKey}
            brandName={brandName}
            handle={handle}
            logoUrl={kit?.logo_url}
            showBrandBar={design.showBrandBar}
            showCounter={design.showCounter}
            showSwipeHint={design.showSwipeHint}
            watermark={watermark}
          />
        ))}
      </div>

      {/* Canva — optional polish step, deliberately secondary */}
      {slides.length > 0 ? (
        <details className="mt-6 rounded-2xl border border-border bg-card p-5">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Optional: polish this deck in Canva
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            PostSpark already designed and exported your carousel. Use Canva only if you want to hand-tune
            typography, layout or add your own template assets.
          </p>
          <div className="mt-4">
            <CanvaDesignLauncher
              designType="carousel"
              formats={CANVA_CAROUSEL_FORMATS}
              defaultTitle={topic || ""}
              slideCount={Math.max(1, slides.length)}
              heading="Fine-tune in Canva"
              description="Create a matching multi-page Canva design, then export the polished slides back here."
            />
          </div>
        </details>
      ) : null}

      <LimitReachedModal open={limitOpen} onClose={() => setLimitOpen(false)} />
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
