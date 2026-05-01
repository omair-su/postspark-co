import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Sparkles, Download } from "lucide-react";
import { generateImage } from "@/server/image.functions";

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

function ImageStudioPage() {
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("photorealistic");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["id"]>("square");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (prompt.trim().length < 3) return toast.error("Describe your image (3+ chars)");
    setLoading(true);
    setImageUrl("");
    try {
      const res = await generateImage({ data: { prompt: prompt.trim(), style, aspect } });
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

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `postspark-${Date.now()}.png`;
    a.click();
  };

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "portrait"
        ? "aspect-[9/16]"
        : "aspect-video";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <ImageIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Image Studio</h1>
          <p className="text-sm text-muted-foreground">
            Generate share-worthy social visuals from a single prompt.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Describe your image</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. A laptop on a sunlit desk with coffee, soft morning light, plants in background"
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
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl bg-muted`}>
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Generated" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="mb-2 h-10 w-10 opacity-40" />
                <p className="text-xs">Your image will appear here</p>
              </div>
            )}
          </div>
          {imageUrl && (
            <button
              onClick={download}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
