import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Download,
  Type,
  Palette,
  Youtube,
  Twitter,
  FileText,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import { generateImage } from "@/lib/image.functions";
import { withAIProgress } from "@/lib/aiProgress";

export const Route = createFileRoute("/dashboard/thumbnail")({
  component: ThumbnailPage,
});

type Preset = {
  id: string;
  label: string;
  icon: any;
  width: number;
  height: number;
  aspect: "landscape" | "portrait" | "square";
  defaultPrompt: string;
};

const PRESETS: Preset[] = [
  {
    id: "youtube",
    label: "YouTube Thumbnail",
    icon: Youtube,
    width: 1280,
    height: 720,
    aspect: "landscape",
    defaultPrompt: "Bold, click-worthy YouTube thumbnail background, dramatic lighting, vivid colors",
  },
  {
    id: "twitter-header",
    label: "Twitter / X Header",
    icon: Twitter,
    width: 1500,
    height: 500,
    aspect: "landscape",
    defaultPrompt: "Wide cinematic banner background, abstract gradient, premium tech aesthetic",
  },
  {
    id: "linkedin-banner",
    label: "LinkedIn Banner",
    icon: FileText,
    width: 1584,
    height: 396,
    aspect: "landscape",
    defaultPrompt: "Professional LinkedIn banner background, soft gradient, clean modern abstract",
  },
  {
    id: "blog-cover",
    label: "Blog Cover",
    icon: FileText,
    width: 1920,
    height: 1080,
    aspect: "landscape",
    defaultPrompt: "Editorial blog hero background, soft depth of field, modern minimal",
  },
  {
    id: "podcast",
    label: "Podcast Cover",
    icon: Mic,
    width: 1400,
    height: 1400,
    aspect: "square",
    defaultPrompt: "Podcast cover art background, bold and atmospheric, premium broadcast aesthetic",
  },
];

const POSITIONS = [
  { id: "center", label: "Center" },
  { id: "bottom", label: "Bottom" },
  { id: "top", label: "Top" },
  { id: "bottom-left", label: "Bottom-left" },
] as const;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

type ModelId = "flux" | "gpt" | "gemini";
type FontFamily = "display" | "sans" | "serif" | "mono" | "condensed" | "slab" | "handwritten";
type FontWeight = 300 | 500 | 700 | 900;

const COLOR_SWATCHES = ["#ffffff", "#000000", "#7c3aed", "#facc15", "#ef4444", "#059669", "#1da1f2", "#f97316"];
const FONT_FAMILIES: { id: FontFamily; label: string; css: string }[] = [
  { id: "display", label: "Display", css: '"Inter", system-ui, sans-serif' },
  { id: "sans", label: "Sans", css: '"Inter", system-ui, sans-serif' },
  { id: "serif", label: "Serif", css: '"Instrument Serif", Georgia, serif' },
  { id: "mono", label: "Mono", css: '"JetBrains Mono", Menlo, monospace' },
  { id: "condensed", label: "Condensed", css: '"Arial Narrow", "Inter", sans-serif' },
  { id: "slab", label: "Slab", css: 'Rockwell, "Roboto Slab", serif' },
  { id: "handwritten", label: "Hand", css: '"Caveat", "Brush Script MT", cursive' },
];

function ThumbnailPage() {
  const { session } = useAuth();
  const [presetId, setPresetId] = useState<string>("youtube");
  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId)!, [presetId]);

  const [headline, setHeadline] = useState("How I 10x'd My Output");
  const [subhead, setSubhead] = useState("In 30 days, no shortcuts");
  const [bgPrompt, setBgPrompt] = useState("");
  const [headlineColor, setHeadlineColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#facc15");
  const [position, setPosition] = useState<(typeof POSITIONS)[number]["id"]>("bottom-left");
  const [overlayStrength, setOverlayStrength] = useState(0.55);
  const [fontFamily, setFontFamily] = useState<FontFamily>("display");
  const [fontWeight, setFontWeight] = useState<FontWeight>(900);
  const [fontScale, setFontScale] = useState(1.0); // multiplier of base size
  const [letterSpacing, setLetterSpacing] = useState(0); // px
  const [allCaps, setAllCaps] = useState(false);
  const [textShadow, setTextShadow] = useState(true);
  const [shadowBlur, setShadowBlur] = useState(0.15);
  const [textOutline, setTextOutline] = useState(false);
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [outlineWidth, setOutlineWidth] = useState(2);
  const [model, setModel] = useState<ModelId>("gpt");

  const [bgUrl, setBgUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const authHeaders = useMemo(
    () => (session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined),
    [session?.access_token],
  );

  const generateBackground = async () => {
    if (!session) return toast.error("Please sign in");
    setLoading(true);
    setBgUrl("");
    try {
      const finalPrompt = (bgPrompt.trim() || preset.defaultPrompt) + ". Leave clear empty space for large text overlay. No text in image.";
      const res = await withAIProgress(
        generateImage({
          data: {
            prompt: finalPrompt,
            style: "cinematic",
            aspect: preset.aspect,
            template: preset.id === "blog-cover" ? "blog-cover" : "thumbnail",
          },
          headers: authHeaders,
        }),
      );
      if (res.error) toast.error(res.error);
      else if (!res.imageUrl) toast.error("No background returned");
      else {
        setBgUrl(res.imageUrl);
        toast.success("Background ready — text overlay applied");
      }
    } catch (e) {
      console.error(e);
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Draw whenever inputs change
  const draw = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    if (bgUrl) {
      try {
        const img = await loadImg(bgUrl);
        // cover-fit
        const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      } catch {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#1a1a2e");
      grad.addColorStop(1, "#7c3aed");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Dark overlay for text legibility
    ctx.fillStyle = `rgba(0,0,0,${overlayStrength})`;
    if (position === "bottom" || position === "bottom-left") {
      const grad = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${Math.min(1, overlayStrength + 0.2)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (position === "top") {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
      grad.addColorStop(0, `rgba(0,0,0,${Math.min(1, overlayStrength + 0.2)})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Text
    const padding = canvas.width * 0.05;
    const maxTextWidth = canvas.width - padding * 2;
    const baseFontSize = Math.round(canvas.height * 0.11);
    const families: Record<string, string> = {
      display: '"Inter", system-ui, sans-serif',
      serif: '"Instrument Serif", Georgia, serif',
      mono: '"JetBrains Mono", Menlo, monospace',
    };
    ctx.fillStyle = headlineColor;
    ctx.font = `900 ${baseFontSize}px ${families[fontFamily]}`;
    const lines = wrapText(ctx, headline, maxTextWidth);
    const lineHeight = baseFontSize * 1.05;

    const subSize = Math.round(baseFontSize * 0.42);
    ctx.font = `900 ${baseFontSize}px ${families[fontFamily]}`;
    const totalH = lines.length * lineHeight + (subhead ? subSize * 1.5 : 0);

    let yStart: number;
    let textAlign: CanvasTextAlign = "left";
    let x = padding;
    if (position === "center") {
      yStart = (canvas.height - totalH) / 2 + lineHeight * 0.8;
      textAlign = "center";
      x = canvas.width / 2;
    } else if (position === "top") {
      yStart = padding + lineHeight * 0.8;
    } else if (position === "bottom") {
      yStart = canvas.height - padding - totalH + lineHeight * 0.8;
      textAlign = "center";
      x = canvas.width / 2;
    } else {
      yStart = canvas.height - padding - totalH + lineHeight * 0.8;
    }
    ctx.textAlign = textAlign;
    ctx.textBaseline = "alphabetic";

    // Headline with shadow
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = baseFontSize * 0.15;
    ctx.shadowOffsetY = baseFontSize * 0.04;
    lines.forEach((line, i) => {
      ctx.fillStyle = headlineColor;
      ctx.font = `900 ${baseFontSize}px ${families[fontFamily]}`;
      ctx.fillText(line, x, yStart + i * lineHeight);
    });
    ctx.shadowColor = "transparent";

    // Subhead with accent strip
    if (subhead) {
      ctx.fillStyle = accentColor;
      ctx.font = `700 ${subSize}px ${families[fontFamily]}`;
      const subY = yStart + lines.length * lineHeight + subSize * 0.6;
      ctx.fillText(subhead, x, subY);
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl, headline, subhead, headlineColor, accentColor, position, overlayStrength, fontFamily, presetId]);

  const downloadAs = (format: "png" | "jpg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    canvas.toBlob(
      (blob) => {
        if (!blob) return toast.error("Export failed");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${preset.id}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(`Downloaded ${format.toUpperCase()}`);
      },
      mime,
      format === "jpg" ? 0.92 : undefined,
    );
  };
  const download = () => downloadAs("png");

  const previewAspect =
    preset.aspect === "square"
      ? "aspect-square"
      : `aspect-[${preset.width}/${preset.height}]`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thumbnail &amp; Cover Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI background + crisp text overlay. Optimized sizes for YouTube, X, LinkedIn, blog &amp; podcast.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    presetId === p.id
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  <p.icon className="h-3.5 w-3.5" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {preset.width} × {preset.height}px
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Headline</label>
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              rows={2}
              maxLength={120}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Subheadline (optional)</label>
            <input
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              maxLength={80}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Background prompt</label>
            <textarea
              value={bgPrompt}
              onChange={(e) => setBgPrompt(e.target.value)}
              rows={2}
              placeholder={preset.defaultPrompt}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={generateBackground}
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating background…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate AI background</>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Headline color</label>
              <input
                type="color"
                value={headlineColor}
                onChange={(e) => setHeadlineColor(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Accent color</label>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Text position</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPosition(p.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    position === p.id
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Font</label>
            <div className="grid grid-cols-3 gap-2">
              {(["display", "serif", "mono"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                    fontFamily === f
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">
              Overlay darkness: {Math.round(overlayStrength * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={90}
              value={overlayStrength * 100}
              onChange={(e) => setOverlayStrength(Number(e.target.value) / 100)}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className={`relative w-full overflow-hidden rounded-xl bg-muted ${previewAspect}`}>
            <canvas
              ref={canvasRef}
              className="h-full w-full object-contain"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {!bgUrl && !loading && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-white/70">
                <ImageIcon className="mb-2 h-10 w-10 opacity-60" />
                <p className="text-xs">Click "Generate AI background" to start</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              <Type className="mr-1 inline h-3.5 w-3.5" /> Live preview · text rendered crisply at full export size
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadAs("png")}
                className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
              >
                <Download className="h-4 w-4" /> PNG
              </button>
              <button
                onClick={() => downloadAs("jpg")}
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                <Download className="h-4 w-4" /> JPG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
