import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Download, Copy, Check, ChevronLeft, ChevronRight, Layers, Wand2, Image as ImageIcon, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { createCarousel, rewriteSlide } from "@/lib/carousel.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { withAIProgress } from "@/lib/aiProgress";

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

function CarouselPage() {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("authoritative");
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState<ThemeId>("brand");
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
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!session) return;
    getBrandKit({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(({ kit }) => setKit(kit as any))
      .catch(() => {});
  }, [session]);

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
        toast.error(res.error === "LIMIT_REACHED" ? "Monthly limit reached. Upgrade to Pro." : res.error);
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
    });
    doc.save(`carousel-${Date.now()}.pdf`);
    toast.success("PDF downloaded");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-electric glow-electric">
          <Layers className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carousel Generator</h1>
          <p className="text-sm text-muted-foreground">Branded swipeable slides — edit, rewrite, export.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <label className="text-sm font-semibold text-foreground">Topic or angle</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. 7 mistakes founders make on LinkedIn"
          className="mt-2 h-24 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Audience (optional)</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="solo founders" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {["authoritative", "playful", "professional", "bold", "educational", "story-driven"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Slides</label>
            <select value={slideCount} onChange={(e) => setSlideCount(parseInt(e.target.value, 10))} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} slides</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">Theme</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${theme === id ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}
              >
                {THEMES[id].label}
              </button>
            ))}
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Suggested caption</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{caption}</p>
                <p className="mt-3 text-xs text-primary">{hashtags.map((h) => `#${h}`).join(" ")}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => handleCopy(caption, "cap")} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent">
                {copied === "cap" ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy caption</>}
              </button>
              <button onClick={() => handleCopy(hashtags.map((h) => `#${h}`).join(" "), "tags")} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent">
                {copied === "tags" ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy hashtags</>}
              </button>
              <button onClick={() => handleCopy(allText(), "all")} className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-2.5 py-1 text-xs font-bold text-primary-foreground hover:opacity-90">
                {copied === "all" ? <><Check className="h-3 w-3" /> Copied All</> : <><Copy className="h-3 w-3" /> Copy All</>}
              </button>
            </div>
          </div>

          {/* All slides — inline editing */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Edit slides</h3>
            <ol className="mt-3 space-y-3">
              {slides.map((s, i) => (
                <li key={i} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.kind} · slide {i + 1}</span>
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
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

import { forwardRef } from "react";
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
}>(function SlideCanvas({ slide, index, total, primary, accent, textColor, subtleColor, brandName, handle, logoUrl }, ref) {
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
    </div>
  );
});
