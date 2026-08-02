import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Download, Copy, Check, ChevronLeft, ChevronRight, Layers, Wand2, Image as ImageIcon, FileText, Droplet } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { createCarousel, rewriteSlide } from "@/lib/carousel.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { UsageMeter } from "@/components/image/UsageMeter";
import { LimitReachedModal } from "@/components/image/LimitReachedModal";
import { getWatermarkState, setWatermarkState } from "@/lib/imageWatermark";
import { SortableSlideList } from "@/components/carousel/SortableSlideList";
import { ModelHealthBadge } from "@/components/image/ModelHealthBadge";

export const Route = createFileRoute("/dashboard/carousel")({
  component: CarouselPage,
});

interface Slide { title: string; body: string; kind: "cover" | "content" | "cta"; }
interface BrandKit { brand_name?: string | null; brand_handle?: string | null; primary_color?: string | null; accent_color?: string | null; logo_url?: string | null; }

const THEMES = {
  brand: { id: "brand", label: "Brand", primary: "", accent: "", text: "#ffffff", subtle: "rgba(255,255,255,0.7)" },
  minimal: { id: "minimal", label: "Minimal", primary: "#fafafa", accent: "#111111", text: "#111111", subtle: "rgba(17,17,17,0.6)" },
  bold: { id: "bold", label: "Bold", primary: "#111111", accent: "#facc15", text: "#ffffff", subtle: "rgba(255,255,255,0.7)" },
  neon: { id: "neon", label: "Neon", primary: "#0b0014", accent: "#22d3ee", text: "#f0f7ff", subtle: "rgba(34,211,238,0.8)" },
} as const;
type ThemeId = keyof typeof THEMES;

const DEFAULTS = { primary: "#1a1a2e", accent: "#7c3aed" };

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "twitter", label: "Twitter / X", icon: "🐦" },
] as const;
type PlatformId = (typeof PLATFORMS)[number]["id"];

const TONES = ["authoritative", "playful", "professional", "bold", "educational", "story-driven"] as const;

function CarouselPage() {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("authoritative");
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState<ThemeId>("brand");
  const [platform, setPlatform] = useState<PlatformId>("instagram");
  const [hashtagCount, setHashtagCount] = useState<5 | 8 | 15 | 30>(8);
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [rewritingIdx, setRewritingIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const initialWm = getWatermarkState();
  const [watermarkOn, setWatermarkOn] = useState<boolean>(initialWm.on);
  const [watermarkText, setWatermarkText] = useState<string>(initialWm.text);
  const [watermarkOpacity] = useState<number>(initialWm.opacity);
  const [watermarkPlacement] = useState(initialWm.placement);
  useEffect(() => setWatermarkState(watermarkOn, watermarkText, watermarkOpacity, watermarkPlacement), [watermarkOn, watermarkText, watermarkOpacity, watermarkPlacement]);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!session) return;
    getBrandKit({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(({ kit }) => setKit(kit as any))
      .catch(() => {});
  }, [session]);

  // Prefill topic from URL ?topic=… (e.g. coming from Repurpose)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const t = url.searchParams.get("topic");
      if (t && !topic) setTopic(t.slice(0, 2000));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = THEMES[theme];
  const primary = theme === "brand" ? (kit?.primary_color || DEFAULTS.primary) : t.primary;
  const accent = theme === "brand" ? (kit?.accent_color || DEFAULTS.accent) : t.accent;
  const textColor = theme === "brand" ? "#ffffff" : t.text;
  const subtleColor = theme === "brand" ? "rgba(255,255,255,0.7)" : t.subtle;
  const brandName = kit?.brand_name || "PostSpark";
  const handle = kit?.brand_handle || "@postspark";

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 5) return toast.error("Add a topic (at least 5 characters)");
    setLoading(true); setSlides([]); setActive(0);
    try {
      const res = await withAIProgress(
        createCarousel({
          data: { topic: topic.trim(), audience: audience.trim() || undefined, tone, slideCount },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      );
      if (res.error) {
        if (res.error === "LIMIT_REACHED") setLimitOpen(true);
        else toast.error(res.error);
        return;
      }
      setSlides(res.slides);
      setCaption(res.caption);
      setHashtags(res.hashtags);
      toast.success(`${res.slides.length} slides generated!`);
    } catch { toast.error("Carousel generation failed"); }
    finally { setLoading(false); }
  };

  const handleRewrite = async (idx: number) => {
    if (!session) return;
    const s = slides[idx];
    setRewritingIdx(idx);
    try {
      const r = await withAIProgress(rewriteSlide({
        data: { title: s.title, body: s.body, kind: s.kind, tone },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }));
      if ((r as any).error) toast.error((r as any).error);
      else {
        setSlides((prev) => prev.map((x, i) => i === idx ? { ...x, title: r.title, body: r.body } : x));
        toast.success("Slide rewritten");
      }
    } catch { toast.error("Rewrite failed"); }
    finally { setRewritingIdx(null); }
  };

  const updateSlide = (idx: number, patch: Partial<Slide>) =>
    setSlides((prev) => prev.map((x, i) => i === idx ? { ...x, ...patch } : x));

  const moveSlide = (idx: number, dir: -1 | 1) => {
    setSlides((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setActive((a) => Math.min(slides.length - 1, Math.max(0, a + dir)));
  };
  const deleteSlide = (idx: number) => {
    if (slides.length <= 3) return toast.error("Keep at least 3 slides");
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActive((a) => Math.max(0, Math.min(a, slides.length - 2)));
  };
  const addSlide = () => {
    setSlides((prev) => {
      const next = [...prev];
      // Insert before CTA if last slide is cta, else at end
      const lastIsCta = next[next.length - 1]?.kind === "cta";
      const insertAt = lastIsCta ? next.length - 1 : next.length;
      next.splice(insertAt, 0, { title: "New slide", body: "Add your insight here.", kind: "content" });
      return next;
    });
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const allText = () => {
    const tags = hashtags.map((h) => `#${h}`).join(" ");
    const slideTxt = slides.map((s, i) => `Slide ${i + 1} (${s.kind})\n${s.title}\n${s.body}`).join("\n\n");
    return `${caption}\n\n${tags}\n\n---\n\n${slideTxt}`;
  };

  const exportSlideImage = async (idx: number, format: "png" | "jpg" = "png"): Promise<Blob | null> => {
    const node = slideRefs.current[idx];
    if (!node) return null;
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 3, useCORS: true });
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), format === "jpg" ? "image/jpeg" : "image/png", 0.95),
    );
  };

  const downloadOne = async (idx: number, format: "png" | "jpg" = "png") => {
    const blob = await exportSlideImage(idx, format);
    if (!blob) return toast.error("Export failed");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `slide-${idx + 1}.${format}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Slide ${idx + 1} downloaded`);
  };

  const downloadAllPngs = async () => {
    if (slides.length === 0) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < slides.length; i++) {
        const blob = await exportSlideImage(i, "png");
        if (blob) zip.file(`slide-${i + 1}.png`, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url; a.download = `carousel-${Date.now()}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("All slides exported as PNG");
    } catch { toast.error("Bulk export failed"); }
    finally { setExporting(false); }
  };

  const handleExportPdf = () => {
    if (slides.length === 0) return;
    const SIZE = 1080;
    const doc = new jsPDF({ unit: "px", format: [SIZE, SIZE], orientation: "portrait" });
    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage([SIZE, SIZE], "portrait");
      doc.setFillColor(primary);
      doc.rect(0, 0, SIZE, SIZE, "F");
      doc.setFillColor(accent); doc.rect(0, 0, SIZE, 14, "F");
      doc.setFontSize(20); doc.setTextColor(textColor); doc.setFont("helvetica", "bold");
      doc.text(brandName, 60, 90);
      doc.setFontSize(13); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 200);
      doc.text(handle, 60, 115);
      doc.setFontSize(14); doc.text(`${idx + 1} / ${slides.length}`, SIZE - 60, 90, { align: "right" });
      const titleSize = slide.kind === "cover" ? 64 : 48;
      doc.setFontSize(titleSize); doc.setFont("helvetica", "bold"); doc.setTextColor(textColor);
      const titleLines = doc.splitTextToSize(slide.title, SIZE - 120);
      const titleY = SIZE / 2 - (titleLines.length * titleSize) / 3;
      doc.text(titleLines, 60, titleY);
      doc.setFontSize(24); doc.setFont("helvetica", "normal");
      const bodyLines = doc.splitTextToSize(slide.body, SIZE - 120);
      doc.text(bodyLines, 60, titleY + titleLines.length * titleSize * 0.7 + 50);
      doc.setFillColor(accent); doc.rect(0, SIZE - 8, SIZE, 8, "F");
      if (watermarkOn && watermarkText.trim()) {
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(textColor);
        const wm = watermarkText.trim();
        const pad = 30;
        const yTop = 40, yBot = SIZE - 28;
        const pos = watermarkPlacement;
        let x = SIZE - pad, y = yBot;
        let align: "left" | "right" | "center" = "right";
        if (pos === "bottom-left") { x = pad; align = "left"; }
        else if (pos === "top-right") { y = yTop; }
        else if (pos === "top-left") { x = pad; y = yTop; align = "left"; }
        else if (pos === "center") { x = SIZE / 2; y = SIZE / 2; align = "center"; }
        try { (doc as any).setGState?.(new (doc as any).GState({ opacity: watermarkOpacity / 100 })); } catch {}
        doc.text(wm, x, y, { align });
        try { (doc as any).setGState?.(new (doc as any).GState({ opacity: 1 })); } catch {}
      }
    });
    doc.save(`carousel-${Date.now()}.pdf`);
    toast.success("PDF downloaded");
  };


  return (
    <div className="mx-auto max-w-4xl">
      <section className="ps-tool-hero ps-elev-2 ds-fade-up relative overflow-hidden ">
        <span className="ps-ambient" aria-hidden />
        <HeroArt art="carousel" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-electric glow-electric">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Carousel Generator</h1>
              <p className="text-sm text-muted-foreground">Branded swipeable slides — edit, rewrite, export.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <UsageMeter refreshKey={slides.length} />
            <ModelHealthBadge compact />
          </div>
        </div>
      </section>



      {/* Watermark toggle */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={watermarkOn}
            onChange={(e) => setWatermarkOn(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Droplet className="h-3.5 w-3.5 text-primary" /> Watermark slides & PDF
        </label>
        <input
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          maxLength={40}
          disabled={!watermarkOn}
          placeholder="@yourbrand"
          className="w-44 rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
        />
        <p className="text-[11px] text-muted-foreground">Applies to PNG & PDF exports.</p>
      </div>


      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <label className="text-sm font-semibold text-foreground">Topic or angle</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. 7 mistakes founders make on LinkedIn"
          className="mt-2 h-24 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Audience (optional)</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="solo founders" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Platform</label>
            <div className="mt-1 flex gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${platform === p.id ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}>
                  <span className="mr-1">{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">Tone</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {TONES.map((v) => (
              <button key={v} onClick={() => setTone(v)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${tone === v ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">Slides</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[6, 7, 8, 9, 10].map((n) => (
              <button key={n} onClick={() => setSlideCount(n)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${slideCount === n ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">Theme — preview before generating</label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const previewStyles: Record<ThemeId, React.CSSProperties> = {
                brand: { background: "linear-gradient(135deg,#1a1a2e,#7c3aed)", color: "#fff" },
                minimal: { background: "#fafafa", color: "#111" },
                bold: { background: "#000", color: "#facc15" },
                neon: { background: "#0b0014", color: "#22d3ee", textShadow: "0 0 8px rgba(34,211,238,0.8)" },
              };
              return (
                <button key={id} onClick={() => setTheme(id)}
                  className={`overflow-hidden rounded-xl border-2 transition ${theme === id ? "border-primary" : "border-input hover:border-primary/40"}`}>
                  <div className="flex h-14 items-center justify-center text-[11px] font-bold" style={previewStyles[id]}>
                    {THEMES[id].label}
                  </div>
                  <div className="bg-background px-2 py-1 text-center text-[11px] font-semibold text-foreground">{THEMES[id].label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-electric px-6 py-3 text-sm font-bold text-primary-foreground glow-electric transition-all hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Designing your carousel…</> : <><Sparkles className="h-4 w-4" /> Generate Carousel</>}
        </button>
      </div>

      {slides.length > 0 && (
        <div className="mt-6 animate-fade-in space-y-4">
          {/* Preview */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Preview · slide {active + 1} of {slides.length}</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => downloadOne(active, "png")} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <ImageIcon className="h-3.5 w-3.5" /> PNG
                </button>
                <button onClick={() => downloadOne(active, "jpg")} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <ImageIcon className="h-3.5 w-3.5" /> JPG
                </button>
                <button onClick={downloadAllPngs} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60">
                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} All PNGs (zip)
                </button>
                <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={() => setActive((i) => Math.max(0, i - 1))} disabled={active === 0} className="rounded-full border border-border bg-background p-2 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Render all slides offscreen so html2canvas can grab any of them; only active visible. */}
              <div className="relative w-full max-w-[420px]">
                {slides.map((s, i) => (
                  <div
                    key={i}
                    style={i === active ? {} : { position: "absolute", left: -99999, top: 0 }}
                    aria-hidden={i !== active}
                  >
                    <SlideCanvas
                      ref={(el) => { slideRefs.current[i] = el; }}
                      slide={s}
                      index={i}
                      total={slides.length}
                      primary={primary}
                      accent={accent}
                      textColor={textColor}
                      subtleColor={subtleColor}
                      brandName={brandName}
                      handle={handle}
                      logoUrl={kit?.logo_url || null}
                      watermark={watermarkOn ? watermarkText.trim() : ""}
                      watermarkOpacity={watermarkOpacity / 100}
                      watermarkPlacement={watermarkPlacement}
                    />
                  </div>
                ))}
              </div>

              <button onClick={() => setActive((i) => Math.min(slides.length - 1, i + 1))} disabled={active === slides.length - 1} className="rounded-full border border-border bg-background p-2 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-2.5 rounded-full transition-all ${i === active ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground"}`} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>

          {/* Caption + hashtags */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Suggested caption</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Hashtags:</span>
                {[5, 8, 15, 30].map((n) => (
                  <button key={n} onClick={() => setHashtagCount(n as 5 | 8 | 15 | 30)}
                    className={`rounded-md border px-2 py-0.5 font-semibold transition ${hashtagCount === n ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-accent"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{caption}</p>
            <p className="mt-3 text-xs text-primary">{hashtags.slice(0, hashtagCount).map((h) => `#${h}`).join(" ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => handleCopy(caption, "cap")} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent">
                {copied === "cap" ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy caption</>}
              </button>
              <button onClick={() => handleCopy(hashtags.slice(0, hashtagCount).map((h) => `#${h}`).join(" "), "tags")} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent">
                {copied === "tags" ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy hashtags</>}
              </button>
              <button onClick={() => handleCopy(allText(), "all")} className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-2.5 py-1 text-xs font-bold text-primary-foreground hover:opacity-90">
                {copied === "all" ? <><Check className="h-3 w-3" /> Copied All</> : <><Copy className="h-3 w-3" /> Copy All</>}
              </button>
            </div>
          </div>


          {/* All slides — inline editing */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Edit slides</h3>
              <button onClick={addSlide} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10">
                + Add slide
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Drag the handle (⋮⋮) to reorder slides — covers and CTAs included.
            </p>
            <div className="mt-3">
              <SortableSlideList
                items={slides}
                getId={(_, i) => `slide-${i}`}
                onReorder={(next) => {
                  setSlides(next);
                  setActive(0);
                }}
                renderItem={(s, i, handle) => (
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {handle}
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {s.kind} · slide {i + 1}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditingIdx(editingIdx === i ? null : i)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent">
                          {editingIdx === i ? "Done" : "Edit"}
                        </button>
                        <button onClick={() => handleRewrite(i)} disabled={rewritingIdx === i} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-60">
                          {rewritingIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} AI rewrite
                        </button>
                        <button onClick={() => handleCopy(`${s.title}\n\n${s.body}`, `s${i}`)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent">
                          {copied === `s${i}` ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                        </button>
                        <button onClick={() => deleteSlide(i)} disabled={slides.length <= 3}
                          className="rounded-md border border-destructive/40 bg-destructive/5 px-1.5 py-1 text-[11px] text-destructive hover:bg-destructive/10 disabled:opacity-30"
                          aria-label="Delete slide">×</button>
                      </div>
                    </div>
                    {editingIdx === i ? (
                      <div className="mt-2 space-y-2">
                        <input
                          value={s.title}
                          onChange={(e) => updateSlide(i, { title: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Slide title"
                        />
                        <textarea
                          value={s.body}
                          onChange={(e) => updateSlide(i, { body: e.target.value })}
                          rows={3}
                          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Slide body"
                        />
                        <select
                          value={s.kind}
                          onChange={(e) => updateSlide(i, { kind: e.target.value as Slide["kind"] })}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="cover">Cover</option>
                          <option value="content">Content</option>
                          <option value="cta">CTA</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <p className="mt-1 text-sm font-bold text-foreground">{s.title}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{s.body}</p>
                      </>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      )}
      <LimitReachedModal open={limitOpen} onClose={() => setLimitOpen(false)} feature="carousel" />
    </div>
  );
}


import { forwardRef } from "react";
import { HeroArt } from "@/components/dashboard/HeroArt";
const SlideCanvas = forwardRef<HTMLDivElement, {
  slide: Slide;
  index: number;
  total: number;
  primary: string;
  accent: string;
  textColor: string;
  subtleColor: string;
  brandName: string;
  handle: string;
  logoUrl: string | null;
  watermark?: string;
  watermarkOpacity?: number;
  watermarkPlacement?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
}>(function SlideCanvas({ slide, index, total, primary, accent, textColor, subtleColor, brandName, handle, logoUrl, watermark, watermarkOpacity = 0.9, watermarkPlacement = "bottom-right" }, ref) {
  return (
    <div
      ref={ref}
      className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: primary, color: textColor }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: accent }} />

      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" crossOrigin="anonymous" className="h-7 w-7 rounded-md object-contain" style={{ background: "rgba(255,255,255,0.1)" }} />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold" style={{ background: accent, color: primary }}>
              {brandName.charAt(0)}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-xs font-bold" style={{ color: textColor }}>{brandName}</div>
            <div className="text-[10px]" style={{ color: subtleColor }}>{handle}</div>
          </div>
        </div>
        <div className="text-[10px] font-medium" style={{ color: subtleColor }}>{index + 1} / {total}</div>
      </div>

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center">
        <h3 className={`font-extrabold leading-tight ${slide.kind === "cover" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`} style={{ color: textColor }}>
          {slide.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: subtleColor }}>{slide.body}</p>
      </div>

      {slide.kind === "cta" && (
        <div className="absolute bottom-5 left-0 right-0 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: subtleColor }}>
          Swipe back · Save · Share
        </div>
      )}
      {watermark ? (
        <div
          className={`absolute rounded-md px-2 py-1 text-[10px] font-semibold ${
            watermarkPlacement === "bottom-left" ? "bottom-3 left-3" :
            watermarkPlacement === "top-right" ? "top-3 right-3" :
            watermarkPlacement === "top-left" ? "top-3 left-3" :
            watermarkPlacement === "center" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :
            "bottom-3 right-3"
          }`}
          style={{ background: `rgba(0,0,0,${watermarkOpacity * 0.55})`, color: "#fff", opacity: watermarkOpacity }}
        >
          {watermark}
        </div>
      ) : null}
    </div>
  );
});
