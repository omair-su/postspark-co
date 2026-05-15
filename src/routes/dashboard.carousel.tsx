import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Download, Copy, Check, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import jsPDF from "jspdf";
import { createCarousel } from "@/lib/carousel.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { withAIProgress } from "@/lib/aiProgress";

export const Route = createFileRoute("/dashboard/carousel")({
  component: CarouselPage,
});

interface Slide {
  title: string;
  body: string;
  kind: "cover" | "content" | "cta";
}

interface BrandKit {
  brand_name?: string | null;
  brand_handle?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
}

const DEFAULTS = {
  primary: "#1a1a2e",
  accent: "#7c3aed",
};

function CarouselPage() {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("authoritative");
  const [slideCount, setSlideCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [kit, setKit] = useState<BrandKit | null>(null);

  useEffect(() => {
    if (!session) return;
    getBrandKit({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(({ kit }) => setKit(kit as any))
      .catch(() => {});
  }, [session]);

  const primary = kit?.primary_color || DEFAULTS.primary;
  const accent = kit?.accent_color || DEFAULTS.accent;
  const brandName = kit?.brand_name || "PostSpark";
  const handle = kit?.brand_handle || "@postspark";

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 5) return toast.error("Add a topic (at least 5 characters)");
    setLoading(true);
    setSlides([]);
    setActive(0);
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
    } catch {
      toast.error("Carousel generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleExportPdf = () => {
    if (slides.length === 0) return;
    const SIZE = 1080; // square slides
    const doc = new jsPDF({ unit: "px", format: [SIZE, SIZE], orientation: "portrait" });

    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage([SIZE, SIZE], "portrait");
      // Background
      doc.setFillColor(primary);
      doc.rect(0, 0, SIZE, SIZE, "F");

      // Accent bar top
      doc.setFillColor(accent);
      doc.rect(0, 0, SIZE, 14, "F");

      // Brand mark top-right
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(brandName, 60, 90);
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 220, 230);
      doc.text(handle, 60, 115);

      // Slide number
      doc.setFontSize(14);
      doc.setTextColor(180, 180, 200);
      doc.text(`${idx + 1} / ${slides.length}`, SIZE - 60, 90, { align: "right" });

      // Title
      const titleSize = slide.kind === "cover" ? 64 : 48;
      doc.setFontSize(titleSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      const titleLines = doc.splitTextToSize(slide.title, SIZE - 120);
      const titleY = SIZE / 2 - (titleLines.length * titleSize) / 3;
      doc.text(titleLines, 60, titleY);

      // Body
      doc.setFontSize(24);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(225, 225, 235);
      const bodyLines = doc.splitTextToSize(slide.body, SIZE - 120);
      doc.text(bodyLines, 60, titleY + titleLines.length * titleSize * 0.7 + 50);

      // Footer accent
      doc.setFillColor(accent);
      doc.rect(0, SIZE - 8, SIZE, 8, "F");
    });

    doc.save(`carousel-${Date.now()}.pdf`);
    toast.success("Carousel PDF downloaded");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-electric glow-electric">
          <Layers className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carousel Generator</h1>
          <p className="text-sm text-muted-foreground">AI writes 6–10 swipeable slides — branded, ready to post.</p>
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
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="solo founders"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {["authoritative", "playful", "professional", "bold", "educational", "story-driven"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Slides</label>
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {[6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} slides</option>
              ))}
            </select>
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Preview · slide {active + 1} of {slides.length}</h2>
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setActive((i) => Math.max(0, i - 1))}
                disabled={active === 0}
                className="rounded-full border border-border bg-background p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <SlideCanvas
                slide={slides[active]}
                index={active}
                total={slides.length}
                primary={primary}
                accent={accent}
                brandName={brandName}
                handle={handle}
                logoUrl={kit?.logo_url || null}
              />

              <button
                onClick={() => setActive((i) => Math.min(slides.length - 1, i + 1))}
                disabled={active === slides.length - 1}
                className="rounded-full border border-border bg-background p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Thumb strip */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2.5 rounded-full transition-all ${i === active ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground"}`}
                  aria-label={`Slide ${i + 1}`}
                />
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
              <button
                onClick={() => handleCopy(`${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`, "cap")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
              >
                {copied === "cap" ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
            </div>
          </div>

          {/* All slides text */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">All slides (text)</h3>
            <ol className="mt-3 space-y-3">
              {slides.map((s, i) => (
                <li key={i} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.kind} · slide {i + 1}</span>
                    <button
                      onClick={() => handleCopy(`${s.title}\n\n${s.body}`, `s${i}`)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied === `s${i}` ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <p className="mt-1 text-sm font-bold text-foreground">{s.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideCanvas({
  slide, index, total, primary, accent, brandName, handle, logoUrl,
}: {
  slide: Slide;
  index: number;
  total: number;
  primary: string;
  accent: string;
  brandName: string;
  handle: string;
  logoUrl: string | null;
}) {
  return (
    <div
      className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: primary }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: accent }} />

      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-7 w-7 rounded-md object-contain bg-white/10" />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ background: accent }}
            >
              {brandName.charAt(0)}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-xs font-bold text-white">{brandName}</div>
            <div className="text-[10px] text-white/60">{handle}</div>
          </div>
        </div>
        <div className="text-[10px] font-medium text-white/60">{index + 1} / {total}</div>
      </div>

      {/* Body */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center">
        <h3
          className={`font-extrabold leading-tight text-white ${slide.kind === "cover" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
        >
          {slide.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/80">{slide.body}</p>
      </div>

      {/* Footer */}
      {slide.kind === "cta" && (
        <div className="absolute bottom-5 left-0 right-0 text-center text-[11px] font-semibold uppercase tracking-wide text-white/70">
          Swipe back · Save · Share
        </div>
      )}
    </div>
  );
}
