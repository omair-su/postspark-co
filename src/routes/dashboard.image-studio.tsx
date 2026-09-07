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
  Star,
  Info,
  CheckSquare,
  X,
} from "lucide-react";
import { applyWatermark, getWatermarkState, type WatermarkPlacement } from "@/lib/imageWatermark";
import { classifyImageError, type StudioError } from "@/lib/imageErrors";
import { toSameOriginUrl } from "@/lib/sameOriginImage";
import { StudioErrorCard, StreamingTile, type TileJob } from "@/components/image/studio/StudioError";
import {
  generateImage,
  generateImageVariations,
  generateCarousel,
  editUploadedImage,
  inpaintImage,

  saveImageToLibrary,
  listLibraryImages,
  deleteLibraryImage,
  getImageUsage,
  captionForImage,
  removeImageBackground,
  upscaleUploadedImage,
  enhancePrompt as enhancePromptFn,
} from "@/lib/image.functions";
import { withAIProgress } from "@/lib/aiProgress";
import JSZip from "jszip";
import { LimitReachedModal } from "@/components/image/LimitReachedModal";
import { EnhancePromptModal } from "@/components/image/EnhancePromptModal";
import { ModelHealthBadge } from "@/components/image/ModelHealthBadge";
import { StockPickerDialog } from "@/components/stock/StockPickerDialog";
import { useServerFn } from "@tanstack/react-start";
import { trackUnsplashUse } from "@/lib/stockMedia.functions";
import type { StockPhoto } from "@/lib/stockMedia.server";
import { Images } from "lucide-react";
import { StyleIcon } from "@/components/BrandIcon";
import { HeroArt } from "@/components/dashboard/HeroArt";
import {
  StudioCard,
  StudioTabs,
  ModelPicker,
  StylePicker,
  AspectPicker,
  BatchPicker,
  ChipRow,
  ImageTile,
  TileSkeleton,
  Inspector,
  InspirationWall,
  Lightbox,
  PROMPT_CHIPS,
  INSPIRATION_PROMPTS,
  NEGATIVE_CHIPS,
  type Recipe,
} from "@/components/image/studio/StudioUI";
import {
  SeedControl,
  ReferencePanel,
  BrandLockPanel,
  InpaintDialog,
  CaptionPanel,
  ExportPackPanel,
  FeaturedRecipeRail,
  LibraryRecipeDrawer,
  type FeaturedRecipe,
} from "@/components/image/studio/StudioPro";
import { EXPORT_PACK, resizeCover, padToAspect, compositeLogo, randomSeed, type ExportSize } from "@/lib/studioCanvas";
import { streamImage } from "@/lib/streamImage";
import { getBrandKit } from "@/lib/brandKit.functions";



export const Route = createFileRoute("/dashboard/image-studio")({
  component: ImageStudioPage,
});

type ModelId = "flux" | "gpt" | "gemini";
const MODELS: { id: ModelId; name: string; badge: string; desc: string; bestFor: string; cost: string; color: string }[] = [
  { id: "flux", name: "Flux Pro 1.1", badge: "⚡ Photorealistic", desc: "Photos, art & portraits", bestFor: "Product shots, portraits, concept art", cost: "$0.04 / image", color: "#F97316" },
  { id: "gpt",  name: "GPT Image 2",  badge: "✦ Text Perfect",   desc: "Thumbnails & graphics with text", bestFor: "Text in image, thumbnails, carousels", cost: "$0.04 / image", color: "#059669" },
  { id: "gemini", name: "Gemini Flash", badge: "◈ Fast & Smart", desc: "Fast iteration & exploration", bestFor: "Quick iterations, diverse styles", cost: "Free tier", color: "#1DA1F2" },
];

const STYLES = [
  { id: "photorealistic", label: "Photorealistic", icon: "📸" },
  { id: "3d-render", label: "3D Render", icon: "🎮" },
  { id: "illustration", label: "Illustration", icon: "🎨" },
  { id: "minimal", label: "Minimal", icon: "◻️" },
  { id: "cinematic", label: "Cinematic", icon: "🎬" },
  { id: "cyberpunk", label: "Cyberpunk", icon: "💜" },
  { id: "oil-painting", label: "Oil Painting", icon: "🖼️" },
  { id: "anime", label: "Anime", icon: "🌸" },
  { id: "architectural", label: "Architectural", icon: "📐" },
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
  model?: string | null;
  seed?: number | null;
  negative_prompt?: string | null;
  reference_url?: string | null;
  is_favorite?: boolean | null;
};


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
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("photorealistic");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["id"]>("square");
  /** Aspect of the images currently on the board (frozen at render time). */
  const [boardAspect, setBoardAspect] = useState<(typeof ASPECTS)[number]["id"]>("square");
  const [template, setTemplate] = useState<string | undefined>(undefined);
  const [model, setModel] = useState<ModelId>("flux");
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [enhancing, setEnhancing] = useState(false);

  const [loading, setLoading] = useState(false);
  // Streaming preview + cancelable jobs + in-session render cache
  const [streamPreview, setStreamPreview] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const jobRef = useRef(0);
  /** URLs the server already persisted (streamed tiles) — never re-upload these. */
  const autoSavedRef = useRef<Set<string>>(new Set());

  const [imageUrl, setImageUrl] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const [enhanceOpen, setEnhanceOpen] = useState(false);
  const [enhancedDraft, setEnhancedDraft] = useState("");
  const [enhanceBefore, setEnhanceBefore] = useState("");
  const [limitOpen, setLimitOpen] = useState(false);

  // batch board + recipe inspector
  const [batch, setBatch] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [lockedSettings, setLockedSettings] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  /** Structured failure for the canvas area (never a bare toast). */
  const [genError, setGenError] = useState<StudioError | null>(null);
  /** Per-tile progress for multi-image batches. */
  const [tileJobs, setTileJobs] = useState<TileJob[]>([]);
  /** Seed each board tile was rendered with, for copy / re-roll / remix. */
  const [resultSeeds, setResultSeeds] = useState<number[]>([]);

  // seed / reference / brand lock / caption / export
  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [seedLocked, setSeedLocked] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [refStrength, setRefStrength] = useState(60);
  const [savedRefs, setSavedRefs] = useState<{ id: string; name: string; url: string }[]>([]);
  const [brandLock, setBrandLock] = useState(false);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [logoOn, setLogoOn] = useState(false);
  const [logoPlacement, setLogoPlacement] = useState<any>("bottom-right");
  const [caption, setCaption] = useState<string | null>(null);
  const [captionBusy, setCaptionBusy] = useState(false);
  const [packBusy, setPackBusy] = useState(false);
  const [inpaintSrc, setInpaintSrc] = useState<string | null>(null);
  const [inpaintBusy, setInpaintBusy] = useState(false);
  const [drawerItem, setDrawerItem] = useState<LibImage | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [libStyle, setLibStyle] = useState<string>("all");
  const [libFavOnly, setLibFavOnly] = useState(false);
  const [libModel, setLibModel] = useState<string>("all");
  const [libRange, setLibRange] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [scheduling, setScheduling] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSavedRefs(JSON.parse(localStorage.getItem("ps_studio_refs") || "[]"));
    } catch {
      /* ignore */
    }
  }, []);


  const persistRefs = (refs: { id: string; name: string; url: string }[]) => {
    setSavedRefs(refs);
    try {
      localStorage.setItem("ps_studio_refs", JSON.stringify(refs));
    } catch {
      toast.error("Reference too large to store locally");
    }
  };

  /** Favorites are stored on the row, so they follow the user to any device. */
  const toggleFavorite = async (id: string) => {
    const next = !favorites.includes(id);
    setFavorites((f) => (next ? [...f, id] : f.filter((x) => x !== id)));
    setLibrary((l) => l.map((i) => (i.id === id ? { ...i, is_favorite: next } : i)));
    if (!authHeaders) return;
    const res = await setImageFavorite({ data: { id, favorite: next }, headers: authHeaders } as any);
    if (!res?.success) {
      setFavorites((f) => (next ? f.filter((x) => x !== id) : [...f, id]));
      toast.error("Could not save favorite");
    }
  };


  const brandColors: string[] = useMemo(() => {
    const k = brandKit;
    if (!k) return [];
    return [k.primary_color, k.secondary_color, k.accent_color, k.neutral_color, k.background_color].filter(
      (c: any) => typeof c === "string" && c.startsWith("#"),
    );
  }, [brandKit]);

  const pushHistory = (p: string) =>
    setPromptHistory((h) => [p, ...h.filter((x) => x !== p)].slice(0, 8));

  /** Prompt actually sent to the model — layers in seed + brand lock. */
  const effectivePrompt = (base: string) => {
    const parts = [base];
    if (brandLock && brandColors.length)
      parts.push(`Strictly use this brand palette: ${brandColors.join(", ")}`);
    if (brandLock && brandKit?.font_heading) parts.push(`Typography feel similar to ${brandKit.font_heading}`);
    return parts.join(". ");
  };

  const currentRecipe = (): Recipe => ({
    seed,
    prompt: prompt.trim(),
    negativePrompt: negativePrompt.trim() || undefined,
    style,
    aspect,
    model,
    quality,
    template,
  });

  /** Cancel the in-flight render (streaming or RPC) without burning quota. */
  const cancelJob = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    jobRef.current += 1;
    setLoading(false);
    setStreamPreview(null);
    toast.message("Render canceled");
  };

  // modelOverride lets "Try another engine" pass the NEW engine explicitly —
  // relying on setModel state would race (the closure keeps the old value).
  const handleBatch = async (count = batch, modelOverride?: ModelId) => {
    const activeModel = modelOverride ?? model;
    if (!session) return toast.error("Please sign in");
    if (prompt.trim().length < 3) return toast.error("Describe your image (3+ chars)");
    // No result caching: identical settings must still produce a fresh render,
    // otherwise "generate again" silently replays the previous image.
    const r = currentRecipe();

    // Supersede any in-flight render so rapid iterations never race.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const job = ++jobRef.current;
    const stale = () => job !== jobRef.current;

    setLoading(true);
    setGenError(null);
    setResults([]);
    setResultSeeds([]);
    setTileJobs([]);
    setImageUrl("");
    setStreamPreview(null);
    setStockAttribution(null);
    // Seeds actually sent to the engine: locked seed reproduces the exact frame,
    // unlocked rolls a fresh one per tile so a batch gives real variety.
    const seeds = Array.from({ length: count }, (_, i) =>
      seedLocked ? seed : i === 0 ? seed : randomSeed(),
    );
    try {
      const sent = effectivePrompt(r.prompt);
      if (referenceUrl) {
        // Reference-guided (img2img) render — one image per run.
        const res = await withAIProgress(
          editUploadedImage({
            data: {
              imageDataUrl: referenceUrl,
              instruction: `${sent}. Use the supplied image as a visual reference at roughly ${refStrength}% influence — keep its subject identity, materials and palette, restyle everything else to match the description.`,
            },
            headers: authHeaders,
            signal: controller.signal,
          } as any),
        );
        if (stale()) return;
        if ((res.error as string) === "LIMIT_REACHED") return setLimitOpen(true);
        if (res.error) throw new Error(res.error as string);
        if (!res.imageUrl) throw new Error("No image returned");
        setResults([res.imageUrl]);
        setResultSeeds([seeds[0]]);
        setImageUrl(res.imageUrl);
      } else if (count === 1) {
        // Streaming render — progressive previews, cancelable, quota counted
        // server-side once the final tile is persisted. Only Gemini has an SSE
        // surface; Flux and GPT go straight to the non-streaming call below.
        let streamed: string | null = null;
        if (activeModel === "gemini") {
          const out = await streamImage(
            "/api/studio-stream",
            {
              prompt: sent,
              style,
              aspect,
              template,
              negativePrompt: r.negativePrompt,
              quality,
              seed: seeds[0],
            },
            (frame, isFinal) => {
              if (stale()) return;
              if (!isFinal) setStreamPreview(frame);
            },
            { headers: authHeaders, signal: controller.signal },
          );
          if (stale()) return;
          if (out.error === "LIMIT_REACHED") {
            setLimitOpen(true);
            return;
          }
          if (out.error && !out.imageUrl) throw new Error(out.error);
          streamed = out.imageUrl;
        }

        if (streamed) {
          // The streaming route already persisted this tile to the library and
          // counted it once — mark it so Save never re-uploads it.
          autoSavedRef.current.add(streamed);
          setResults([streamed]);
          setResultSeeds([seeds[0]]);
          setImageUrl(streamed);
          loadLibrary();
          refreshUsage();
          toast.success("Saved to your library");
        } else {
          const res = await withAIProgress(
            generateImage({
              data: {
                prompt: sent,
                style,
                aspect,
                template,
                model: activeModel,
                quality,
                negativePrompt: r.negativePrompt,
                originalPrompt: originalPrompt || r.prompt,
                seed: seeds[0],
              },
              headers: authHeaders,
              signal: controller.signal,
            } as any),
          );
          if (stale()) return;
          if (res.error === "LIMIT_REACHED") return setLimitOpen(true);
          if (res.error) throw new Error(res.error);
          if (!res.imageUrl) throw new Error("No image returned");
          setResults([res.imageUrl]);
          setResultSeeds([seeds[0]]);
          setImageUrl(res.imageUrl);
        }
      } else if (activeModel === "gemini") {
        // Batch with per-tile streaming: every tile renders its own blur-to-sharp
        // preview in parallel instead of a frozen grid of skeletons.
        setTileJobs(seeds.map((sd) => ({ preview: null, status: "pending", seed: sd })));
        const patch = (i: number, next: Partial<TileJob>) =>
          setTileJobs((jobs) => jobs.map((j, idx) => (idx === i ? { ...j, ...next } : j)));

        const settled = await Promise.all(
          seeds.map(async (sd, i) => {
            try {
              patch(i, { status: "streaming" });
              const out = await streamImage(
                "/api/studio-stream",
                {
                  prompt: sent,
                  style,
                  aspect,
                  template,
                  negativePrompt: r.negativePrompt,
                  quality,
                  seed: sd,
                },
                (frame, isFinal) => {
                  if (stale()) return;
                  patch(i, { preview: frame, status: isFinal ? "done" : "streaming" });
                },
                { headers: authHeaders, signal: controller.signal },
              );
              if (out.error === "LIMIT_REACHED") {
                patch(i, { status: "error", message: "Out of images" });
                return { limit: true as const };
              }
              if (!out.imageUrl) throw new Error(out.error || "No image returned");
              patch(i, { status: "done", url: out.imageUrl });
              return { url: out.imageUrl, seed: sd };
            } catch (e: any) {
              if (e?.name === "AbortError" || controller.signal.aborted) return null;
              patch(i, { status: "error", message: classifyImageError(e).title });
              return { failed: e };
            }
          }),
        );
        if (stale()) return;
        const ok = settled.filter((x): x is { url: string; seed: number } => !!x && "url" in x);
        if (settled.some((x) => x && "limit" in x) && !ok.length) {
          setLimitOpen(true);
          return;
        }
        if (!ok.length) {
          const firstFail = settled.find((x) => x && "failed" in x) as { failed: unknown } | undefined;
          throw firstFail ? firstFail.failed : new Error("No images returned");
        }
        ok.forEach((t) => autoSavedRef.current.add(t.url));
        setResults(ok.map((t) => t.url));
        setResultSeeds(ok.map((t) => t.seed));
        setImageUrl(ok[0].url);
        loadLibrary();
      } else {
        // Flux / GPT batches render server-side in one call, so every tile shows
        // its own live status + seed instead of one anonymous grid of skeletons.
        setTileJobs(seeds.map((sd) => ({ preview: null, status: "streaming", seed: sd })));
        const res: any = await withAIProgress(
          generateImageVariations({
            data: { prompt: sent, style, aspect, template, count: count as 2 | 3 | 4, model: activeModel, quality },
            headers: authHeaders,
            signal: controller.signal,
          } as any),
        );
        if (stale()) return;
        if (res.error === "LIMIT_REACHED") return setLimitOpen(true);
        if (res.error) throw new Error(res.error);
        const urls = (res.results || []).map((x: any) => x.imageUrl).filter(Boolean);
        if (!urls.length) throw new Error("No images returned");
        setTileJobs((jobs) =>
          jobs.map((j, i) => (urls[i] ? { ...j, status: "done", preview: urls[i] } : { ...j, status: "error" })),
        );
        setResults(urls);
        setResultSeeds(seeds.slice(0, urls.length));
        setImageUrl(urls[0]);
      }


      if (!seedLocked) setSeed(randomSeed());
      setCaption(null);
      setRecipe(r);
      setBoardAspect(r.aspect as typeof aspect);
      pushHistory(r.prompt);
      toast.success(count === 1 ? "Image ready" : `${count} images ready`);
      refreshUsage();
    } catch (e: any) {
      if (e?.name === "AbortError" || controller.signal.aborted) return;
      console.error(e);
      // Structured, actionable failure in the canvas instead of a bare toast.
      setGenError(classifyImageError(e));
    } finally {
      if (!stale()) {
        setLoading(false);
        setStreamPreview(null);
        setTileJobs([]);
        if (abortRef.current === controller) abortRef.current = null;
      }
    }
  };

  /** Swap to the next engine and re-render — used by the failure card. */
  const retryWithOtherModel = () => {
    const order: ModelId[] = ["gemini", "flux", "gpt"];
    const next = order[(order.indexOf(model) + 1) % order.length];
    setModel(next);
    setGenError(null);
    toast.message(`Switched to ${MODELS.find((m) => m.id === next)?.name}`);
    setTimeout(() => handleBatch(batch, next), 0);
  };

  const reuseRecipe = () => {
    if (!recipe) return;
    setPrompt(recipe.prompt);
    setNegativePrompt(recipe.negativePrompt || "");
    setStyle(recipe.style as any);
    setAspect(recipe.aspect as any);
    setModel(recipe.model as any);
    setQuality((recipe.quality as any) || "standard");
    setTemplate(recipe.template);
    toast.success("Recipe loaded into the composer");
  };

  const copyRecipe = async () => {
    if (!recipe) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
      toast.success("Recipe copied");
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  const useAsEditSource = (url: string) => {
    setUploadedUrl(url);
    setEditedUrl("");
    setTab("edit");
    toast.success("Loaded into the editor");
  };

  /* ------------------------------ pro actions ----------------------------- */

  const forkRecipe = (r: FeaturedRecipe) => {
    setPrompt(r.prompt);
    setStyle(r.style as any);
    setAspect(r.aspect);
    setModel(r.model);
    setTemplate(undefined);
    setOriginalPrompt(null);
    setTab("generate");
    toast.success(`Forked "${r.title}"`);
  };

  const upscaleResult = async (url: string, scale: 2 | 4 = 2) => {
    setLoading(true);
    try {
      const res = await withAIProgress(
        upscaleUploadedImage({ data: { imageDataUrl: url, scale }, headers: authHeaders }),
      );
      if (res.error) return toast.error(res.error);
      if (!res.imageUrl) return toast.error("No image returned");
      setResults((r) => r.map((u) => (u === url ? res.imageUrl : u)));
      toast.success(`Upscaled ${scale}x`);
    } catch {
      toast.error("Upscale failed");
    } finally {
      setLoading(false);
    }
  };

  const runInpaint = async (imageDataUrl: string, maskDataUrl: string, instruction: string) => {
    setInpaintBusy(true);
    try {
      const res = await inpaintImage({
        data: { imageDataUrl, maskDataUrl, instruction },
        headers: authHeaders,
      } as any);
      if (res.error === "LIMIT_REACHED") {
        setInpaintSrc(null);
        return setLimitOpen(true);
      }
      if (res.error) return toast.error(res.error);
      if (!res.imageUrl) return toast.error("No image returned");

      setResults((r) => (r.length ? [res.imageUrl, ...r.slice(1)] : [res.imageUrl]));
      setImageUrl(res.imageUrl);
      setInpaintSrc(null);
      toast.success("Masked area regenerated");
    } catch {
      toast.error("Inpaint failed");
    } finally {
      setInpaintBusy(false);
    }
  };

  const expandCanvas = async (target: "square" | "portrait" | "landscape") => {
    const src = results[0] || imageUrl;
    if (!src) return toast.error("Generate an image first");
    setLoading(true);
    try {
      const padded = await padToAspect(src, target);
      const res = await withAIProgress(
        editUploadedImage({
          data: {
            imageDataUrl: padded,
            instruction: `Outpaint: fill the flat grey margins around the original image with a seamless, photorealistic continuation of the existing scene. Keep the original centre area untouched and deliver a clean ${target} composition.`,
          },
          headers: authHeaders,
        }),
      );
      if (res.error) return toast.error(res.error);
      if (!res.imageUrl) return toast.error("No image returned");
      setResults([res.imageUrl]);
      setImageUrl(res.imageUrl);
      setAspect(target);
      toast.success(`Expanded to ${target}`);
    } catch {
      toast.error("Expand failed");
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async () => {
    const base = recipe?.prompt || prompt.trim();
    if (base.length < 3) return toast.error("Generate an image first");
    setCaptionBusy(true);
    try {
      const c = await captionForImage({ data: { prompt: base }, headers: authHeaders });
      setCaption(c.caption || null);
      if (!c.caption) toast.error("No caption returned");
    } catch {
      toast.error("Caption failed");
    } finally {
      setCaptionBusy(false);
    }
  };

  const sendCaptionToPublishing = () => {
    const url = results[0] || imageUrl;
    if (!caption) return;
    try {
      localStorage.setItem(
        "ps_publish_draft",
        JSON.stringify({ text: caption, mediaUrl: url, source: "image-studio", at: Date.now() }),
      );
    } catch {
      /* ignore */
    }
    toast.success("Draft handed to Publishing Center");
    window.location.assign("/dashboard/publishing");
  };

  const exportPack = async (sizes: ExportSize[]) => {
    const src = results[0] || imageUrl;
    if (!src) return toast.error("Generate an image first");
    setPackBusy(true);
    const t = toast.loading("Building platform pack…");
    try {
      let base = src;
      if (logoOn && brandKit?.logo_url) {
        try {
          base = await compositeLogo(base, brandKit.logo_url, logoPlacement);
        } catch (e) {
          toast.dismiss(t);
          setPackBusy(false);
          return toast.error(`Brand logo could not be applied: ${classifyImageError(e).message}`);
        }
      }
      const zip = new JSZip();
      for (const s of sizes) {
        const dataUrl = await resizeCover(base, s.w, s.h);
        zip.file(`${s.id}-${s.w}x${s.h}.png`, dataUrl.split(",")[1], { base64: true });
      }
      if (caption) zip.file("caption.txt", caption);
      const blob = await zip.generateAsync({ type: "blob" });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `postspark-platform-pack-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast.dismiss(t);
      toast.success("Platform pack downloaded");
    } catch (e) {
      console.error(e);
      toast.dismiss(t);
      toast.error(classifyImageError(e).message);
    } finally {
      setPackBusy(false);
    }
  };



  const addChip = (v: string) => {
    setPrompt((p) => (p.trim() ? `${p.replace(/,\s*$/, "")}, ${v}` : v));
    setOriginalPrompt(null);
  };
  const addNegativeChip = (v: string) =>
    setNegativePrompt((p) => (p.trim() ? (p.includes(v) ? p : `${p.replace(/,\s*$/, "")}, ${v}`) : v));


  // edit
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editedUrl, setEditedUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Stock library picker
  const [stockOpen, setStockOpen] = useState<null | "generate" | "edit">(null);
  const [stockAttribution, setStockAttribution] = useState<{
    name: string;
    profileUrl: string;
    source: "unsplash" | "pexels";
    sourceUrl: string;
  } | null>(null);
  const trackUnsplashDownload = useServerFn(trackUnsplashUse);

  async function applyStockPhoto(photo: StockPhoto, target: "generate" | "edit") {
    // Compliance: ping Unsplash download_location on every "use".
    if (photo.source === "unsplash" && photo.downloadLocation) {
      try {
        await trackUnsplashDownload({ data: { downloadLocation: photo.downloadLocation } });
      } catch (e) {
        console.warn("Unsplash tracking failed", e);
      }
    }
    // Hotlinked provider URL — never re-hosted.
    if (target === "generate") setImageUrl(photo.regularUrl);
    else setUploadedUrl(photo.regularUrl);
    setStockAttribution({
      name: photo.photographerName,
      profileUrl: photo.photographerUrl,
      source: photo.source,
      sourceUrl: photo.sourceUrl,
    });
    toast.success(`Photo by ${photo.photographerName} applied`);
  }

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
  const [watermarkOn, setWatermarkOn] = useState<boolean>(() => getWatermarkState().on);
  const [watermarkText, setWatermarkText] = useState<string>(() => getWatermarkState().text);
  const [watermarkOpacity] = useState<number>(() => getWatermarkState().opacity);
  const [watermarkPlacement] = useState<WatermarkPlacement>(() => getWatermarkState().placement);
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

  /**
   * Tiles must use the aspect that actually produced the images on the board,
   * not the live composer value — otherwise changing the aspect picker crops
   * already-rendered results.
   */
  const ratioClass = (a: typeof aspect) =>
    a === "square" ? "aspect-square" : a === "portrait" ? "aspect-[9/16]" : "aspect-video";
  const aspectClass = ratioClass(boardAspect);
  const composerAspectClass = ratioClass(aspect);

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

  useEffect(() => {
    if (!authHeaders) return;
    getBrandKit({ headers: authHeaders })
      .then((r: any) => setBrandKit(r?.kit || r?.data?.kit || null))
      .catch(() => {});
  }, [authHeaders]);



  const loadLibrary = async () => {
    if (!authHeaders) return;
    setLibLoading(true);
    try {
      const res = await listLibraryImages({ headers: authHeaders });
      const rows = (res.images as LibImage[]) || [];
      setLibrary(rows);
      setFavorites(rows.filter((r) => r.is_favorite).map((r) => r.id));
    } finally {
      setLibLoading(false);
    }
  };

  /**
   * One click from a render to a real scheduled post: the picture becomes the
   * post's media and its recipe travels along as the draft copy.
   */
  const scheduleFromLibrary = async (img: LibImage) => {
    if (!authHeaders) return;
    setScheduling(img.id);
    try {
      const when = new Date();
      when.setDate(when.getDate() + 1);
      when.setHours(9, 0, 0, 0);
      const recipeLines = [
        img.prompt,
        "",
        `Recipe — ${img.model || "gemini"}${img.style ? ` · ${img.style}` : ""}${img.aspect ? ` · ${img.aspect}` : ""}${
          img.seed != null ? ` · seed ${img.seed}` : ""
        }`,
        img.negative_prompt ? `Avoided: ${img.negative_prompt}` : "",
      ].filter(Boolean);
      const res = await createScheduledPost({
        data: {
          title: img.prompt.replace(/\s+/g, " ").slice(0, 70) || "Generated image",
          content: recipeLines.join("\n"),
          platform: "instagram",
          scheduled_for: when.toISOString(),
          media_url: img.image_url,
          media_type: "image" as const,
          tool: "image-studio",
        },
        headers: authHeaders,
      } as any);
      if (!res?.success) return toast.error(res?.error || "Could not schedule this image");
      toast.success("Scheduled for tomorrow 9:00 AM — open the Calendar to adjust");
    } catch {
      toast.error("Could not schedule this image");
    } finally {
      setScheduling(null);
    }
  };


  useEffect(() => {
    if (tab === "library" && session) loadLibrary();
  }, [tab, session]);

  const handleEnhance = async () => {
    if (!session) return toast.error("Please sign in");
    if (prompt.trim().length < 3) return toast.error("Add a basic prompt first");
    const before = prompt.trim();
    setEnhanceBefore(before);
    setEnhancedDraft("");
    setEnhanceOpen(true);
    setEnhancing(true);
    try {
      const r = await enhancePromptFn({
        data: { prompt: before, model, style },
        headers: authHeaders,
      });
      if (r.error) toast.error(r.error);
      setEnhancedDraft(r.prompt || "");
    } catch {
      toast.error("Enhancer failed");
      setEnhanceOpen(false);
    } finally {
      setEnhancing(false);
    }
  };

  const applyEnhanced = () => {
    if (!enhancedDraft) return;
    setOriginalPrompt(enhanceBefore);
    setPrompt(enhancedDraft);
    setEnhanceOpen(false);
    toast.success("Enhanced prompt applied — original preserved");
  };



  const handleCarousel = async () => {
    if (!session) return toast.error("Please sign in");
    if (carouselTopic.trim().length < 3) return toast.error("Enter a topic (3+ chars)");
    setLoading(true);
    setCarouselSlides([]);
    try {
      const res: any = await withAIProgress(generateCarousel({
        data: { topic: carouselTopic.trim(), style, model: "gpt" },
        headers: authHeaders,
      }));
      if ((res.error as string) === "LIMIT_REACHED") setLimitOpen(true);
      else if (res.error) {
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
          refreshUsage();
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

  const handleBgRemove = async () => {
    if (!uploadedUrl) return toast.error("Upload an image first");
    setLoading(true);
    setEditedUrl("");
    try {
      const res = await withAIProgress(removeImageBackground({
        data: { imageDataUrl: uploadedUrl },
        headers: authHeaders,
      }));
      if (res.error) toast.error(res.error);
      else if (!res.imageUrl) toast.error("No image returned");
      else { setEditedUrl(res.imageUrl); toast.success("Background removed"); }
    } catch (e) { console.error(e); toast.error("Failed"); }
    finally { setLoading(false); }
  };

  const handleUpscale = async (scale: 2 | 4) => {
    if (!uploadedUrl) return toast.error("Upload an image first");
    setLoading(true);
    setEditedUrl("");
    try {
      const res = await withAIProgress(upscaleUploadedImage({
        data: { imageDataUrl: uploadedUrl, scale },
        headers: authHeaders,
      }));
      if (res.error) toast.error(res.error);
      else if (!res.imageUrl) toast.error("No image returned");
      else { setEditedUrl(res.imageUrl); toast.success(`Upscaled ${scale}x`); }
    } catch (e) { console.error(e); toast.error("Failed"); }
    finally { setLoading(false); }
  };

  const download = async (url: string, name?: string) => {
    const filename = name || `postspark-${Date.now()}.png`;
    try {
      // Route remote hosts through our own proxy when they refuse CORS, so a
      // download is a real file save instead of a surprise new tab.
      const { url: sameOrigin, revoke } = await toSameOriginUrl(url);
      const blob = await (await fetch(sameOrigin)).blob();
      revoke();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      console.error("download error", e);
      // Fallback: open in new tab so user can right-click → save
      window.open(url, "_blank", "noopener,noreferrer");
      toast.message("Opened image in new tab — right-click to save");
    }
  };

  const save = async (url: string, src = "generate", overridePrompt?: string) => {
    if (!url.startsWith("data:") || autoSavedRef.current.has(url)) {
      // Server already auto-persists generated images (including streamed tiles).
      // Refresh library so it shows up — never re-upload, that would burn a credit.
      loadLibrary();
      toast.success("Saved to your library");
      return;
    }

    let finalUrl = url;
    if (watermarkOn && watermarkText.trim()) {
      try {
        finalUrl = await applyWatermark(url, watermarkText.trim(), {
          opacity: watermarkOpacity / 100,
          placement: watermarkPlacement,
        });
      } catch (e) {
        // Never save silently unstamped — the user asked for a watermark.
        toast.error(classifyImageError(e).message);
        return;
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
    const days = libRange === "7d" ? 7 : libRange === "30d" ? 30 : libRange === "90d" ? 90 : 0;
    const cutoff = days ? Date.now() - days * 86_400_000 : 0;
    let arr = library.filter((i) => {
      if (libTemplate !== "all" && (i.template || "none") !== libTemplate) return false;
      if (libStyle !== "all" && (i.style || "") !== libStyle) return false;
      if (libModel !== "all" && (i.model || "gemini") !== libModel) return false;
      if (cutoff && new Date(i.created_at).getTime() < cutoff) return false;
      if (libFavOnly && !favorites.includes(i.id)) return false;
      if (q && !`${i.prompt} ${i.negative_prompt || ""} ${i.style || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return libSort === "newest" ? db - da : da - db;
    });
    return arr;
  }, [library, libQuery, libTemplate, libSort, libStyle, libModel, libRange, libFavOnly, favorites]);


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
    { id: "generate", label: "Studio", icon: Sparkles },
    { id: "templates", label: "Templates", icon: Layers },
    { id: "carousel", label: "Carousel", icon: GalleryHorizontal },
    { id: "edit", label: "Edit & retouch", icon: Upload },
    { id: "library", label: "Library", icon: Library },
  ];

  const usagePct = usage ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div className="is-shell mx-auto max-w-[1400px] space-y-6">
      {/* ---------------------------------- hero --------------------------------- */}
      <section className="ps-tool-hero ps-elev-2 ds-fade-up relative overflow-hidden">
        <span className="ps-ambient" aria-hidden />
        <HeroArt art="image" />
        <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-electric shadow-glow">
              <ImageIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="is-eyebrow">AI Image Studio</p>
              <h1
                className="mt-1 font-bold tracking-tight"
                style={{ fontSize: "clamp(24px,3vw,36px)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
              >
                Create scroll-stopping visuals in seconds.
              </h1>
              <p className="mt-1.5 max-w-[560px] text-sm text-muted-foreground">
                Three frontier models, visual style presets, batch boards, remixable recipes and a
                one-click post pipeline — all inside your workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col lg:items-end">
            {usage && (
              <div className="is-hero-panel min-w-[240px] rounded-2xl border border-border bg-card p-3 shadow-lg">
                <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Zap className="h-3.5 w-3.5 text-primary" /> This month
                  </span>
                  <span className="text-muted-foreground">
                    {usage.used}/{usage.limit}{" "}
                    <span className="uppercase tracking-wide">{usage.plan}</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full gradient-electric transition-all" style={{ width: `${usagePct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{usage.remaining} renders remaining</p>
              </div>
            )}
            <div className="is-hero-panel min-w-[240px]">
              <ModelHealthBadge />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- controls -------------------------------- */}
      <div className="flex flex-wrap items-center gap-3">
        <StudioTabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWatermarkOn(!watermarkOn)}
            className={`is-btn-ghost ${watermarkOn ? "is-btn-on" : ""}`}
            title="Stamp your handle on saved images"
          >
            <Droplet className="h-3.5 w-3.5" /> Watermark
          </button>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            maxLength={40}
            disabled={!watermarkOn}
            placeholder="@yourbrand"
            className="is-input !w-36 !py-1.5 !text-[11.5px] disabled:opacity-50"
          />
          <button
            onClick={() => setSafetyOn(!safetyOn)}
            className={`is-btn-ghost ${safetyOn ? "is-btn-on" : ""}`}
            title="Run a safety check before saving"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Safety check
          </button>
        </div>
      </div>

      {tab === "templates" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => pickTemplate(t)} className="is-inspire">
                <span className="is-inspire-glow" aria-hidden />
                <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <span className="mt-3 block text-[14px] font-bold text-foreground">{t.label}</span>
                <span className="mt-1 block text-[11.5px] text-muted-foreground">{t.desc}</span>
                <span className="is-inspire-cta">Use template →</span>
              </button>
            );
          })}
        </div>
      )}

      {(tab === "generate" || tab === "variations") && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)_minmax(0,300px)]">
          {/* ------------------------------- composer ------------------------------ */}
          <div className="space-y-4">
            {template && (
              <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-[11.5px]">
                <span>
                  Template: <strong>{TEMPLATES.find((t) => t.id === template)?.label}</strong>
                </span>
                <button onClick={() => setTemplate(undefined)} className="text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              </div>
            )}

            <StudioCard label="Prompt lab" hint="Describe the shot, then layer in cinematic detail with one tap.">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleEnhance}
                  disabled={enhancing || prompt.trim().length < 3}
                  className="is-btn-ghost disabled:opacity-50"
                >
                  {enhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Enhance with AI
                </button>
                <button
                  onClick={() => {
                    const pick = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
                    setPrompt(pick);
                    setOriginalPrompt(null);
                  }}
                  className="is-btn-ghost"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Surprise me
                </button>
                <button onClick={() => setStockOpen("generate")} className="is-btn-ghost">
                  <Images className="h-3.5 w-3.5" /> Stock photo
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setOriginalPrompt(null);
                }}
                rows={5}
                placeholder="e.g. A matte black espresso machine on travertine, single hard light, editorial luxury still life"
                className="is-input resize-y"
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
                <span>
                  {prompt.trim().length} chars · ~{Math.ceil(prompt.trim().split(/\s+/).filter(Boolean).length * 1.35)} tokens
                  {prompt.trim().length > 1200 && <span className="ml-1 font-semibold text-amber-500">very long</span>}
                </span>
                {originalPrompt && <span>Enhanced · original kept</span>}
              </div>
              <details className="mt-2 rounded-lg border border-border/70 bg-background/40 p-2">
                <summary className="cursor-pointer text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Exact prompt sent to the engine
                </summary>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground">
                  {effectivePrompt(prompt.trim()) || "—"}
                  {negativePrompt.trim() && (
                    <span className="mt-1 block text-muted-foreground">Avoid: {negativePrompt.trim()}</span>
                  )}
                  <span className="mt-1 block text-muted-foreground">
                    Seed {seed}
                    {seedLocked ? " (locked)" : ""} · {style} · {aspect}
                  </span>
                </p>
              </details>


              <div className="mt-3 space-y-2.5">
                {PROMPT_CHIPS.map((g) => (
                  <div key={g.group}>
                    <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {g.group}
                    </p>
                    <ChipRow items={g.items} onPick={addChip} />
                  </div>
                ))}
                <div>
                  <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Avoid
                  </p>
                  <ChipRow items={NEGATIVE_CHIPS} onPick={addNegativeChip} active={NEGATIVE_CHIPS.filter((n) => negativePrompt.includes(n))} />
                  <input
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    maxLength={300}
                    placeholder="negative prompt"
                    className="is-input mt-2 !py-2 !text-[12px]"
                  />
                </div>
              </div>
            </StudioCard>

            <StudioCard label="Model" hint="Each engine is tuned for a different job.">
              <ModelPicker models={MODELS} value={model} onChange={setModel} />
              {model === "gpt" && (
                <>
                  <p className="mt-2 text-[11px] font-medium text-emerald-500">
                    Renders exact text into the image — best for thumbnails and graphics.
                  </p>
                  <div className="mt-3">
                    <p className="is-eyebrow mb-1.5">Quality</p>
                    <div className="is-seg">
                      {(["standard", "hd"] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`is-seg-btn ${quality === q ? "is-seg-on" : ""}`}
                        >
                          {q === "standard" ? "Standard" : "HD · more detail"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </StudioCard>

            <StudioCard label="Style">
              <StylePicker styles={STYLES} value={style} onChange={setStyle} />
            </StudioCard>

            <StudioCard label="Format">
              <AspectPicker aspects={ASPECTS} value={aspect} onChange={setAspect} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="is-eyebrow">Batch</p>
                <BatchPicker value={batch} onChange={setBatch} />
              </div>
              <div className="mt-3">
                <p className="is-eyebrow mb-1.5">Seed</p>
                <SeedControl
                  seed={seed}
                  locked={seedLocked}
                  onChange={setSeed}
                  onToggleLock={() => setSeedLocked((v) => !v)}
                  onRandom={() => setSeed(randomSeed())}
                />
              </div>
            </StudioCard>

            <ReferencePanel
              referenceUrl={referenceUrl}
              strength={refStrength}
              onPick={(u) => setReferenceUrl(u)}
              onClear={() => setReferenceUrl(null)}
              onStrength={setRefStrength}
              savedRefs={savedRefs}
              onSaveRef={() => {
                if (!referenceUrl) return;
                const name = window.prompt("Name this character / product", "My subject") || "Reference";
                persistRefs([{ id: String(Date.now()), name, url: referenceUrl }, ...savedRefs].slice(0, 6));
                toast.success("Reference saved");
              }}
              onUseSavedRef={(u) => setReferenceUrl(u)}
            />

            <BrandLockPanel
              on={brandLock}
              onToggle={() => setBrandLock((v) => !v)}
              colors={brandColors}
              logoUrl={brandKit?.logo_url || null}
              logoOn={logoOn}
              onLogoToggle={() => setLogoOn((v) => !v)}
              placement={logoPlacement}
              onPlacement={setLogoPlacement}
            />


            <button onClick={() => handleBatch()} disabled={loading} className="is-btn">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Rendering {batch > 1 ? `${batch} images` : "your image"}…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate {batch > 1 ? `${batch} images` : "image"}
                </>
              )}
            </button>
            {loading && (
              <button onClick={cancelJob} className="is-btn-ghost w-full" type="button">
                <X className="h-3.5 w-3.5" /> Cancel render
              </button>
            )}
          </div>

          {/* ------------------------------ canvas board --------------------------- */}
          <div
            className="is-aura space-y-4"
            style={{ ["--is-accent" as any]: MODELS.find((m) => m.id === model)?.color } as any}
          >
            <StudioCard

              label="Canvas"
              hint={results.length ? `${results.length} render${results.length > 1 ? "s" : ""} on the board` : "Your board is empty — pick a prompt idea below."}
              action={
                loading ? (
                  <button onClick={cancelJob} className="is-btn-ghost">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                ) : results.length ? (
                  <button onClick={() => setResults([])} className="is-btn-ghost">
                    <Trash2 className="h-3.5 w-3.5" /> Clear board
                  </button>
                ) : undefined
              }
            >
              {loading && <div className="is-rail mb-3" />}
              {loading && tileJobs.length > 1 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tileJobs.map((j, i) => (
                    <StreamingTile key={i} job={j} index={i} aspectClass={composerAspectClass} />
                  ))}
                </div>
              ) : loading && streamPreview ? (
                <div className={`overflow-hidden rounded-xl border border-border bg-muted/40 ${composerAspectClass}`}>
                  <img
                    src={streamPreview}
                    alt="Streaming preview"
                    className="h-full w-full object-contain blur-xl transition-[filter] duration-500"
                  />
                </div>
              ) : loading ? (
                <div className={`grid gap-3 ${batch > 1 ? "sm:grid-cols-2" : ""}`}>
                  {Array.from({ length: batch }).map((_, i) => (
                    <TileSkeleton key={i} aspectClass={composerAspectClass} />
                  ))}
                </div>
              ) : genError ? (
                <StudioErrorCard
                  error={genError}
                  aspectClass={composerAspectClass}
                  onRetry={() => {
                    setGenError(null);
                    handleBatch();
                  }}
                  onSwitchModel={retryWithOtherModel}
                  onUpgrade={() => setLimitOpen(true)}
                  onDismiss={() => setGenError(null)}
                />
              ) : results.length ? (

                <div className={`grid gap-3 ${results.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {results.map((url, i) => (
                    <ImageTile
                      key={`${url}-${i}`}
                      url={url}
                      index={i}
                      aspectClass={aspectClass}
                      onOpen={() => setLightbox(url)}
                      onDownload={() => download(url)}
                      onSave={() => save(url, results.length > 1 ? "variation" : "generate")}
                      onVary={() => {
                        setBatch(4);
                        handleBatch(4);
                      }}
                      onRemix={reuseRecipe}
                      onEdit={() => useAsEditSource(url)}
                      onCopyRecipe={copyRecipe}
                      onUpscale={() => upscaleResult(url, 2)}
                      onInpaint={() => setInpaintSrc(url)}
                      onDelete={() => setResults((r) => r.filter((u) => u !== url))}
                      footer={
                        stockAttribution && i === 0 ? (
                          <>
                            Photo by{" "}
                            <a
                              href={stockAttribution.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="underline"
                            >
                              {stockAttribution.name}
                            </a>{" "}
                            on {stockAttribution.source === "unsplash" ? "Unsplash" : "Pexels"}
                          </>
                        ) : typeof resultSeeds[i] === "number" ? (
                          <>Seed {resultSeeds[i]}</>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className={`is-tile ${composerAspectClass} grid place-items-center`}>
                  <div className="px-6 text-center">
                    <ImageIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground opacity-40" />
                    <p className="text-[12.5px] font-semibold">Your renders land here</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      Pick a prompt idea, choose a batch size, and hit generate.
                    </p>
                  </div>
                </div>
              )}
            </StudioCard>

            {!results.length && !loading && (
              <div>
                <p className="is-eyebrow mb-2">Start from an idea</p>
                <InspirationWall
                  onPick={(p) => {
                    setPrompt(p);
                    setOriginalPrompt(null);
                    toast.success("Prompt loaded");
                  }}
                />
              </div>
            )}

            <FeaturedRecipeRail onFork={forkRecipe} />
          </div>

          {/* ------------------------------- inspector ----------------------------- */}
          <div className="space-y-4">
            <Inspector
              recipe={recipe ? { ...recipe, prompt: recipe.prompt } : null}
              locked={lockedSettings}
              onToggleLock={() => setLockedSettings((v) => !v)}
              onReuse={reuseRecipe}
              history={promptHistory}
              onPickHistory={(p) => {
                setPrompt(p);
                setOriginalPrompt(null);
              }}
              onClearHistory={() => setPromptHistory([])}
            />

            {(results.length > 0 || imageUrl) && (
              <>
                <CaptionPanel
                  caption={caption}
                  busy={captionBusy}
                  onGenerate={generateCaption}
                  onCopy={async () => {
                    if (!caption) return;
                    try {
                      await navigator.clipboard.writeText(caption);
                      toast.success("Caption copied");
                    } catch {
                      toast.error("Clipboard blocked");
                    }
                  }}
                  onSendToPublishing={sendCaptionToPublishing}
                />
                <ExportPackPanel busy={packBusy} onExport={exportPack} onExpand={expandCanvas} sizes={EXPORT_PACK} />
              </>
            )}
          </div>
        </div>
      )}


      {tab === "carousel" && (
        <div className="space-y-6">
          <div className="is-card grid gap-4 md:grid-cols-[2fr,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium">Carousel topic</label>
              <textarea
                value={carouselTopic}
                onChange={(e) => setCarouselTopic(e.target.value)}
                rows={3}
                placeholder='e.g. "5 morning habits that 10x your productivity"'
                className="is-input"
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
                className="is-input"
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
                className="is-btn mt-3"
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
                    className="is-card !p-0 overflow-hidden"
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
          <div className="is-card space-y-4">
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
              <button
                type="button"
                onClick={() => setStockOpen("edit")}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                <Images className="h-3.5 w-3.5" /> Or pick a stock photo (Unsplash · Pexels)
              </button>
              {uploadedUrl && (
                <div className="mt-3 overflow-hidden rounded-lg border border-border">
                  <img src={uploadedUrl} alt="Original image uploaded by user for AI editing" className="max-h-64 w-full object-contain" />
                  {stockAttribution && (
                    <div className="border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                      Photo by{" "}
                      <a href={stockAttribution.profileUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                        {stockAttribution.name}
                      </a>{" "}
                      on{" "}
                      <a
                        href={stockAttribution.source === "unsplash"
                          ? "https://unsplash.com/?utm_source=postspark&utm_medium=referral"
                          : "https://www.pexels.com"}
                        target="_blank" rel="noopener noreferrer nofollow"
                        className="underline"
                      >
                        {stockAttribution.source === "unsplash" ? "Unsplash" : "Pexels"}
                      </a>
                    </div>
                  )}
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
                className="is-input"
              />
            </div>

            <button
              onClick={handleEdit}
              disabled={loading || !uploadedUrl}
              className="is-btn"
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

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                One-click tools
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleBgRemove}
                  disabled={loading || !uploadedUrl}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                >
                  <Droplet className="h-3.5 w-3.5" /> Remove BG
                </button>
                <button
                  onClick={() => handleUpscale(2)}
                  disabled={loading || !uploadedUrl}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" /> Upscale 2x
                </button>
                <button
                  onClick={() => handleUpscale(4)}
                  disabled={loading || !uploadedUrl}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" /> Upscale 4x
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Powered by Real-ESRGAN &amp; background-remover (Pro).
              </p>
            </div>
          </div>

          <div className="is-card">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {loading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : editedUrl ? (
                <img src={editedUrl} alt="Resulting image after AI studio processing" className="h-full w-full object-contain" />
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
        <div className="is-card space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                placeholder="Search by prompt..."
                className="is-input !py-2 pl-8"
              />
            </div>
            <select
              value={libTemplate}
              onChange={(e) => setLibTemplate(e.target.value)}
              className="is-input !w-auto !py-2 !text-[12px]"
            >
              {templateOptions.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All templates" : t}
                </option>
              ))}
            </select>
            <select
              value={libStyle}
              onChange={(e) => setLibStyle(e.target.value)}
              className="is-input !w-auto !py-2 !text-[12px]"
            >
              <option value="all">All styles</option>
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={libModel}
              onChange={(e) => setLibModel(e.target.value)}
              className="is-input !w-auto !py-2 !text-[12px]"
            >
              <option value="all">All engines</option>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={libRange}
              onChange={(e) => setLibRange(e.target.value as any)}
              className="is-input !w-auto !py-2 !text-[12px]"
            >
              <option value="all">Any date</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <select
              value={libSort}
              onChange={(e) => setLibSort(e.target.value as any)}
              className="is-input !w-auto !py-2 !text-[12px]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button
              onClick={() => setLibFavOnly((v) => !v)}
              className={`is-btn-ghost ${libFavOnly ? "is-btn-on" : ""}`}
            >
              <Star className="h-3.5 w-3.5" /> Favorites
            </button>
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

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-[11.5px]">
              <span className="font-semibold">{selected.length} selected</span>
              <button
                onClick={async () => {
                  for (const id of selected) {
                    const item = library.find((l) => l.id === id);
                    if (item) await download(item.image_url, `${safeFilename(item.prompt)}.png`);
                  }
                }}
                className="is-btn-ghost"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                onClick={async () => {
                  for (const id of selected) await removeFromLibrary(id);
                  setSelected([]);
                }}
                className="is-btn-ghost"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button onClick={() => setSelected([])} className="is-btn-ghost">
                Clear selection
              </button>
            </div>
          )}


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
                  className={`is-card group !p-0 overflow-hidden ${selected.includes(img.id) ? "ring-2 ring-[hsl(var(--primary))]" : ""}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    <img
                      src={img.image_url}
                      alt={img.prompt}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <button
                      onClick={() => toggleFavorite(img.id)}
                      aria-label="Favorite"
                      className="absolute left-2 top-2 rounded-full bg-background/85 p-1.5"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${favorites.includes(img.id) ? "fill-current text-amber-500" : "text-muted-foreground"}`}
                      />
                    </button>
                    <button
                      onClick={() =>
                        setSelected((s) => (s.includes(img.id) ? s.filter((x) => x !== img.id) : [...s, img.id]))
                      }
                      aria-label="Select"
                      className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5"
                    >
                      <CheckSquare
                        className={`h-3.5 w-3.5 ${selected.includes(img.id) ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
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
                      <button
                        onClick={() => download(img.image_url, `${safeFilename(img.prompt)}.png`)}
                        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-center text-xs hover:bg-accent"
                        aria-label="Download"
                      >
                        <Download className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDrawerItem(img)}
                        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-center text-xs hover:bg-accent"
                        aria-label="View recipe"
                      >
                        <Info className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromLibrary(img.id)}
                        className="flex-1 rounded-md border border-destructive/40 bg-background px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
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

      <EnhancePromptModal
        open={enhanceOpen}
        loading={enhancing}
        original={enhanceBefore}
        enhanced={enhancedDraft}
        onApply={applyEnhanced}
        onClose={() => setEnhanceOpen(false)}
      />
      <LimitReachedModal open={limitOpen} onClose={() => setLimitOpen(false)} />
      <StockPickerDialog
        open={stockOpen !== null}
        onClose={() => setStockOpen(null)}
        initialQuery={prompt || "creative workspace"}
        selectLabel={stockOpen === "edit" ? "Use as source" : "Use photo"}
        title={
          stockOpen === "edit"
            ? "Pick a stock photo to edit"
            : "Insert a stock photo (Unsplash · Pexels)"
        }
        onSelectPhoto={(photo) => applyStockPhoto(photo, stockOpen || "generate")}
      />
      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
      {inpaintSrc && (
        <InpaintDialog
          src={inpaintSrc}
          busy={inpaintBusy}
          onClose={() => setInpaintSrc(null)}
          onSubmit={runInpaint}
        />
      )}
      {drawerItem && (
        <LibraryRecipeDrawer
          item={drawerItem}
          onClose={() => setDrawerItem(null)}
          onReuse={() => {
            setPrompt(drawerItem.prompt);
            if (drawerItem.style) setStyle(drawerItem.style as any);
            if (drawerItem.aspect) setAspect(drawerItem.aspect as any);
            setTemplate(drawerItem.template || undefined);
            setDrawerItem(null);
            setTab("generate");
            toast.success("Recipe loaded");
          }}
          onUseAsReference={() => {
            setReferenceUrl(drawerItem.image_url);
            setDrawerItem(null);
            setTab("generate");
            toast.success("Set as reference");
          }}
        />
      )}



    </div>
  );
}

