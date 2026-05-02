import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import {
  generateImage,
  generateImageVariations,
  editUploadedImage,
  saveImageToLibrary,
  listLibraryImages,
  deleteLibraryImage,
} from "@/server/image.functions";

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
    desc: "Instagram swipe slide",
    aspect: "square" as const,
    promptStarter:
      "Carousel slide 1 of 5 about [topic], bold heading, modern minimal layout",
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

type Tab = "generate" | "templates" | "edit" | "variations" | "library";
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

  // library
  const [library, setLibrary] = useState<LibImage[]>([]);
  const [libLoading, setLibLoading] = useState(false);

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "portrait"
        ? "aspect-[9/16]"
        : "aspect-video";

  const loadLibrary = async () => {
    setLibLoading(true);
    try {
      const res = await listLibraryImages();
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
      const res = await generateImage({
        data: { prompt: prompt.trim(), style, aspect, template },
      });
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
      const res = await generateImageVariations({
        data: { prompt: prompt.trim(), style, aspect, template, count: 4 },
      });
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

  const download = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `postspark-${Date.now()}.png`;
    a.click();
  };

  const save = async (url: string, src = "generate") => {
    if (!url.startsWith("data:")) return toast.error("Already saved");
    const t = toast.loading("Saving to library...");
    try {
      const res = await saveImageToLibrary({
        data: {
          imageDataUrl: url,
          prompt: prompt || editInstruction || "Untitled",
          style,
          aspect,
          template,
          source: src,
        },
      });
      toast.dismiss(t);
      if (res.error) toast.error(res.error);
      else toast.success("Saved to library");
    } catch (e) {
      toast.dismiss(t);
      toast.error("Save failed");
    }
  };

  const removeFromLibrary = async (id: string) => {
    const res = await deleteLibraryImage({ data: { id } });
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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "templates", label: "Templates", icon: Layers },
    { id: "variations", label: "Variations", icon: Wand2 },
    { id: "edit", label: "Edit", icon: Upload },
    { id: "library", label: "Library", icon: Library },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
        <div className="rounded-2xl border border-border bg-card p-5">
          {libLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : library.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Library className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No saved images yet</p>
              <p className="mt-1 text-xs">Generate an image and click "Save to library"</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {library.map((img) => (
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
