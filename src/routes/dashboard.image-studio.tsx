import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Download,
  Upload,
  Wand2,
  Layers,
  Library,
  Save,
  Trash2,
  Quote,
  Youtube,
  GalleryHorizontal,
  FileText,
  Package,
  Zap,
  Search,
  ShieldCheck,
  Droplet,
  Package as PackageIcon,
} from "lucide-react";
import {
  generateImage,
  generateImageVariations,
  generateCarousel,
  editUploadedImage,
  saveImageToLibrary,
  listLibraryImages,
  deleteLibraryImage,
  getImageUsage,
  captionForImage,
} from "@/lib/image.functions";
import { withAIProgress } from "@/lib/aiProgress";
import JSZip from "jszip";

export const Route = createFileRoute("/dashboard/image-studio")({
  component: ImageStudioPage,
});

const STYLES = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "3d-render", label: "3D Render" },
  { id: "illustration", label: "Illustration" },
  { id: "minimal", label: "Minimal" },
  { id: "cinematic", label: "Cinematic" },
  { id: "cyberpunk", label: "Cyberpunk" },
] as const;

const ASPECTS = [
  { id: "square", label: "Square 1:1", hint: "Instagram / Facebook" },
  { id: "portrait", label: "Portrait 9:16", hint: "Stories / Reels / TikTok" },
  { id: "landscape", label: "Landscape 16:9", hint: "Twitter / Blog / YouTube" },
] as const;

const TEMPLATES = [
  {
    id: "quote-card",
    icon: Quote,
    label: "Quote Card",
    desc: "Elegant typography quote",
    aspect: "square" as const,
    promptStarter: 'A quote card with the text: "Your quote here". Soft gradient background.',
  },
  {
    id: "thumbnail",
    icon: Youtube,
    label: "YouTube Thumbnail",
    desc: "Bold click-worthy cover",
    aspect: "landscape" as const,
    promptStarter:
      "A YouTube thumbnail about [topic], bold text overlay, dramatic lighting, surprised face",
  },
  {
    id: "carousel",
    icon: GalleryHorizontal,
    label: "Carousel Slide",
    desc: "Single Instagram slide",
    aspect: "square" as const,
    promptStarter:
      "Carousel slide about [topic], bold heading, modern minimal layout",
  },
  {
    id: "blog-cover",
    icon: FileText,
    label: "Blog Cover",
    desc: "Editorial article hero",
    aspect: "landscape" as const,
    promptStarter: "Blog cover image about [topic], editorial style, clean and modern",
  },
  {
    id: "product-mockup",
    icon: Package,
    label: "Product Mockup",
    desc: "Premium marketing shot",
    aspect: "square" as const,
    promptStarter: "Premium product mockup of [product], studio lighting, clean background",
  },
];

type Tab = "generate" | "templates" | "edit" | "variations" | "carousel" | "library";
type LibImage = {
  id: string;
  image_url: string;
  prompt: string;
  style?: string | null;
  aspect?: string | null;
  template?: string | null;
  source?: string | null;
  created_at: string;
};

// Apply a watermark to an image data URL via canvas. Returns a new data URL.
async function applyWatermark(dataUrl: string, text: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.max(14, Math.round(canvas.width * 0.025));
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      const padding = Math.round(fontSize * 0.6);
      const metrics = ctx.measureText(text);
      const w = metrics.width + padding * 2;
      const h = fontSize + padding;
      const x = canvas.width - w - padding;
      const y = canvas.height - h - padding;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + padding, y + h / 2);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function fetchAsBlob(url: string): Promise<Blob | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.blob();
  } catch {
    return null;
  }
}

function safeFilename(s: string, max = 40) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, max) || "image"
  );
}

function ImageStudioPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("generate");

  // shared
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("photorealistic");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["id"]>("square");
  const [template, setTemplate] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [variations, setVariations] = useState<string[]>([]);

  // edit
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editedUrl, setEditedUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // carousel
  const [carouselTopic, setCarouselTopic] = useState("");
  const [carouselSlides, setCarouselSlides] = useState<
    { url: string; title: string; body: string }[]
  >([]);

  // library
  const [library, setLibrary] = useState<LibImage[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libQuery, setLibQuery] = useState("");
  const [libTemplate, setLibTemplate] = useState<string>("all");
  const [libSort, setLibSort] = useState<"newest" | "oldest">("newest");
  const [zipping, setZipping] = useState(false);

  // usage
  const [usage, setUsage] = useState<{
    plan: string;
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  const authHeaders = useMemo(
    () =>
      session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    [session?.access_token],
  );

  // settings (persisted)
  const [watermarkOn, setWatermarkOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ps_watermark_on") === "1";
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    if (typeof window === "undefined") return "@yourbrand";
    return localStorage.getItem("ps_watermark_text") || "@yourbrand";
  });
  const [safetyOn, setSafetyOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("ps_safety_on") !== "0";
  });

  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("ps_watermark_on", watermarkOn ? "1" : "0");
  }, [watermarkOn]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("ps_watermark_text", watermarkText);
  }, [watermarkText]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("ps_safety_on", safetyOn ? "1" : "0");
  }, [safetyOn]);

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "portrait"
        ? "aspect-[9/16]"
        : "aspect-video";

  const refreshUsage = async () => {
    if (!authHeaders) return;
    try {
      const u = await getImageUsage({ headers: authHeaders });
      setUsage(u);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (session) refreshUsage();
  }, [session]);

  const loadLibrary = async () => {
    if (!authHeaders) return;
    setLibLoading(true);
    try {
      const res = await listLibraryImages({ headers: authHeaders });
      setLibrary((res.images as LibImage[]) || []);
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "library" && session) loadLibrary();
  }, [tab, session]);

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (prompt.trim().length < 3) return toast.error("Describe your image (3+ chars)");
    setLoading(true);
    setImageUrl("");
    try {
      const res = await withAIProgress(generateImage({
        data: { prompt: prompt.trim(), style, aspect, template },
        headers: authHeaders,
      }));
      if (res.error) toast.error(res.error);
      else if (!res.imageUrl) toast.error("No image returned");
      else {
        setImageUrl(res.imageUrl);
        toast.success("Image ready");
      }
    } catch (e) {
      console.error(e);
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVariations = async () => {
    if (!session) return toast.error("Please sign in");
    if (prompt.trim().length < 3) return toast.error("Describe your image (3+ chars)");
    setLoading(true);
    setVariations([]);
    try {
      const res = await withAIProgress(generateImageVariations({
        data: { prompt: prompt.trim(), style, aspect, template, count: 4 },
        headers: authHeaders,
      }));
      if (res.error) {
        toast.error(res.error);
      } else {
        const urls = (res.results || []).map((r: any) => r.imageUrl).filter(Boolean);
        if (!urls.length) toast.error("No variations returned");
        else {
          setVariations(urls);
          toast.success(`${urls.length} variations ready`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCarousel = async () => {
    if (!session) return toast.error("Please sign in");
    if (carouselTopic.trim().length < 3) return toast.error("Enter a topic (3+ chars)");
    setLoading(true);
    setCarouselSlides([]);
    try {
      const res: any = await withAIProgress(generateCarousel({
        data: { topic: carouselTopic.trim(), style },
        headers: authHeaders,
      }));
      if (res.error) {
        toast.error(res.error);
      } else {
        const slides = (res.results || []).map((r: any, i: number) => ({
          url: r.imageUrl,
          title: res.slides?.[i]?.title || `Slide ${i + 1}`,
          body: res.slides?.[i]?.body || "",
        }));
        const ok = slides.filter((s: any) => s.url);
        if (!ok.length) toast.error("No slides returned");
        else {
          setCarouselSlides(ok);
          toast.success(`${ok.length} slides ready`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const onUpload = (file: File) => {
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedUrl(String(reader.result || ""));
      setEditedUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!uploadedUrl) return toast.error("Upload an image first");
    if (editInstruction.trim().length < 3) return toast.error("Describe the edit");
    setLoading(true);
    setEditedUrl("");
    try {
      const res = await editUploadedImage({
        data: { imageDataUrl: uploadedUrl, instruction: editInstruction.trim() },
        headers: authHeaders,
      });
      if (res.error) toast.error(res.error);
      else if (!res.imageUrl) toast.error("No image returned");
      else {
        setEditedUrl(res.imageUrl);
        toast.success("Edit complete");
      }
    } catch (e) {
      console.error(e);
      toast.error("Edit failed");
    } finally {
      setLoading(false);
    }
  };

  const download = (url: string, name?: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name || `postspark-${Date.now()}.png`;
    a.click();
  };

  const save = async (url: string, src = "generate", overridePrompt?: string) => {
    if (!url.startsWith("data:")) return toast.error("Already saved");
    let finalUrl = url;
    if (watermarkOn && watermarkText.trim()) {
      try {
        finalUrl = await applyWatermark(url, watermarkText.trim());
      } catch {
        // fall back to original
      }
    }
    const t = toast.loading("Saving to library...");
    try {
      const res = await saveImageToLibrary({
        data: {
          imageDataUrl: finalUrl,
          prompt: overridePrompt || prompt || editInstruction || "Untitled",
          style,
          aspect,
          template,
          source: src,
          safetyCheck: safetyOn,
        },
        headers: authHeaders,
      });
      toast.dismiss(t);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved to library");
        refreshUsage();
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error("Save failed");
    }
  };

  const removeFromLibrary = async (id: string) => {
    if (!authHeaders) return toast.error("Please sign in");
    const res = await deleteLibraryImage({ data: { id }, headers: authHeaders });
    if (res.error) return toast.error(res.error);
    setLibrary((l) => l.filter((i) => i.id !== id));
    toast.success("Deleted");
  };

  const pickTemplate = (t: (typeof TEMPLATES)[number]) => {
    setTemplate(t.id);
    setAspect(t.aspect);
    setPrompt(t.promptStarter);
    setTab("generate");
    toast.success(`Template loaded: ${t.label}`);
  };

  // Filtered + sorted library
  const filteredLibrary = useMemo(() => {
    const q = libQuery.trim().toLowerCase();
    let arr = library.filter((i) => {
      if (libTemplate !== "all" && (i.template || "none") !== libTemplate) return false;
      if (q && !i.prompt.toLowerCase().includes(q)) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return libSort === "newest" ? db - da : da - db;
    });
    return arr;
  }, [library, libQuery, libTemplate, libSort]);

  const templateOptions = useMemo(() => {
    const set = new Set<string>();
    library.forEach((i) => set.add(i.template || "none"));
    return ["all", ...Array.from(set)];
  }, [library]);

  // Bulk ZIP export of filtered library with caption files
  const exportZip = async () => {
    if (!filteredLibrary.length) return toast.error("Nothing to export");
    setZipping(true);
    const t = toast.loading(`Building ZIP (${filteredLibrary.length} assets)...`);
    try {
      const zip = new JSZip();
      const captionsFolder = zip.folder("captions");
      const imagesFolder = zip.folder("images");
      let i = 0;
      for (const item of filteredLibrary) {
        i++;
        const blob = await fetchAsBlob(item.image_url);
        if (!blob) continue;
        const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
        const base = `${String(i).padStart(2, "0")}-${safeFilename(item.prompt)}`;
        imagesFolder?.file(`${base}.${ext}`, blob);

        let caption = item.prompt;
        try {
          const c = await captionForImage({ data: { prompt: item.prompt }, headers: authHeaders });
          caption = c.caption || item.prompt;
        } catch {
          // fallback to prompt
        }
        const text = `${caption}\n\n---\nSource prompt: ${item.prompt}\nTemplate: ${item.template || "—"}\nStyle: ${item.style || "—"}\nAspect: ${item.aspect || "—"}\nGenerated: ${new Date(item.created_at).toISOString()}\n`;
        captionsFolder?.file(`${base}.txt`, text);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `postspark-library-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(t);
      toast.success("ZIP downloaded");
    } catch (e) {
      console.error(e);
      toast.dismiss(t);
      toast.error("ZIP export failed");
    } finally {
      setZipping(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "templates", label: "Templates", icon: Layers },
    { id: "carousel", label: "Carousel (5)", icon: GalleryHorizontal },
    { id: "variations", label: "Variations", icon: Wand2 },
    { id: "edit", label: "Edit", icon: Upload },
    { id: "library", label: "Library", icon: Library },
  ];

  const usagePct = usage ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
            <ImageIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Image Studio Pro</h1>
            <p className="text-sm text-muted-foreground">
              Generate, edit, vary, and save share-worthy social visuals.
            </p>
          </div>
        </div>

        {/* Usage indicator */}
        {usage && (
          <div className="min-w-[240px] rounded-xl border border-border bg-card p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-medium">
                <Zap className="h-3.5 w-3.5 text-primary" /> This month
              </span>
              <span className="text-muted-foreground">
                {usage.used}/{usage.limit}{" "}
                <span className="uppercase tracking-wide">{usage.plan}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full gradient-electric transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {usage.remaining} remaining
            </p>
          </div>
        )}
      </div>

      {/* Settings strip: watermark + safety */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={watermarkOn}
            onChange={(e) => setWatermarkOn(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Droplet className="h-3.5 w-3.5 text-primary" /> Watermark
        </label>
        <input
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          maxLength={40}
          disabled={!watermarkOn}
          placeholder="@yourbrand"
          className="w-40 rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
        />
        <span className="mx-1 h-4 w-px bg-border" />
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={safetyOn}
            onChange={(e) => setSafetyOn(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Safety check before save
        </label>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-accent text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "templates" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => pickTemplate(t)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary hover:shadow-glow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-electric">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{t.label}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
                <span className="mt-auto text-xs text-primary group-hover:underline">
                  Use template →
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(tab === "generate" || tab === "variations") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            {template && (
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-xs">
                <span>
                  Template: <strong>{TEMPLATES.find((t) => t.id === template)?.label}</strong>
                </span>
                <button
                  onClick={() => setTemplate(undefined)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium">Describe your image</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. A laptop on a sunlit desk with coffee, soft morning light"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      style === s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Aspect ratio</label>
              <div className="space-y-2">
                {ASPECTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAspect(a.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                      aspect === a.id
                        ? "border-primary bg-primary/10"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    <span>{a.label}</span>
                    <span className="text-muted-foreground">{a.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {tab === "generate" ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate image
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleVariations}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating 4 variations...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Generate 4 variations
                  </>
                )}
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            {tab === "generate" && (
              <>
                <div
                  className={`relative ${aspectClass} w-full overflow-hidden rounded-xl bg-muted`}
                >
                  {loading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Generated"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="mb-2 h-10 w-10 opacity-40" />
                      <p className="text-xs">Your image will appear here</p>
                    </div>
                  )}
                </div>
                {imageUrl && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => download(imageUrl)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button
                      onClick={() => save(imageUrl, "generate")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Save className="h-4 w-4" /> Save to library
                    </button>
                  </div>
                )}
              </>
            )}

            {tab === "variations" && (
              <div>
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : variations.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {variations.map((url, i) => (
                      <div key={i} className="space-y-2">
                        <div
                          className={`${aspectClass} w-full overflow-hidden rounded-lg bg-muted`}
                        >
                          <img
                            src={url}
                            alt={`Variation ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => download(url)}
                            className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
                          >
                            <Download className="mx-auto h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => save(url, "variation")}
                            className="flex-1 rounded-md gradient-electric px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
                          >
                            <Save className="mx-auto h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                    <Wand2 className="mb-2 h-10 w-10 opacity-40" />
                    <p className="text-xs">4 variations will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "carousel" && (
        <div className="space-y-6">
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-[2fr,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium">Carousel topic</label>
              <textarea
                value={carouselTopic}
                onChange={(e) => setCarouselTopic(e.target.value)}
                rows={3}
                placeholder='e.g. "5 morning habits that 10x your productivity"'
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Generates a cohesive 5-slide Instagram set with matching typography &amp; layout.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCarousel}
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Designing 5 slides...
                  </>
                ) : (
                  <>
                    <GalleryHorizontal className="h-4 w-4" /> Generate carousel
                  </>
                )}
              </button>
            </div>
          </div>

          {carouselSlides.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{carouselSlides.length} slides ready</h3>
                <button
                  onClick={async () => {
                    for (const s of carouselSlides) {
                      await save(s.url, "carousel", `${carouselTopic} — ${s.title}`);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <Save className="h-3.5 w-3.5" /> Save all to library
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {carouselSlides.map((s, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      <img
                        src={s.url}
                        alt={`Slide ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Slide {i + 1} of {carouselSlides.length}
                      </p>
                      <p className="line-clamp-1 text-sm font-semibold">{s.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {s.body}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            download(s.url, `slide-${i + 1}-${safeFilename(s.title)}.png`)
                          }
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
                        >
                          <Download className="mx-auto h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            save(s.url, "carousel", `${carouselTopic} — ${s.title}`)
                          }
                          className="flex-1 rounded-md gradient-electric px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
                        >
                          <Save className="mx-auto h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "edit" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Upload image</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                }}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background py-10 text-sm text-muted-foreground hover:bg-accent"
              >
                <Upload className="h-6 w-6" />
                {uploadedUrl ? "Replace image" : "Click to upload (max 8MB)"}
              </button>
              {uploadedUrl && (
                <div className="mt-3 overflow-hidden rounded-lg border border-border">
                  <img src={uploadedUrl} alt="Uploaded" className="max-h-64 w-full object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Edit instruction</label>
              <textarea
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                rows={3}
                placeholder="e.g. Make the sky purple at sunset, add a floating moon"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleEdit}
              disabled={loading || !uploadedUrl}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Editing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Apply edit
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {loading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : editedUrl ? (
                <img src={editedUrl} alt="Edited" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                  <Wand2 className="mb-2 h-10 w-10 opacity-40" />
                  <p className="text-xs">Edited image will appear here</p>
                </div>
              )}
            </div>
            {editedUrl && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => download(editedUrl)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => save(editedUrl, "edit")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Save className="h-4 w-4" /> Save to library
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "library" && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                placeholder="Search by prompt..."
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm"
              />
            </div>
            <select
              value={libTemplate}
              onChange={(e) => setLibTemplate(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
            >
              {templateOptions.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All templates" : t}
                </option>
              ))}
            </select>
            <select
              value={libSort}
              onChange={(e) => setLibSort(e.target.value as any)}
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button
              onClick={exportZip}
              disabled={zipping || !filteredLibrary.length}
              className="inline-flex items-center gap-2 rounded-md gradient-electric px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {zipping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PackageIcon className="h-3.5 w-3.5" />
              )}
              Export ZIP + captions
            </button>
          </div>

          {libLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Library className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">
                {library.length === 0 ? "No saved images yet" : "No matches for these filters"}
              </p>
              {library.length === 0 && (
                <p className="mt-1 text-xs">Generate an image and click "Save to library"</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLibrary.map((img) => (
                <div
                  key={img.id}
                  className="group overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    <img
                      src={img.image_url}
                      alt={img.prompt}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs text-muted-foreground" title={img.prompt}>
                      {img.prompt}
                    </p>
                    {img.template && (
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {img.template}
                      </span>
                    )}
                    <div className="mt-2 flex gap-2">
                      <a
                        href={img.image_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-center text-xs hover:bg-accent"
                      >
                        <Download className="mx-auto h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => removeFromLibrary(img.id)}
                        className="flex-1 rounded-md border border-destructive/40 bg-background px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mx-auto h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
