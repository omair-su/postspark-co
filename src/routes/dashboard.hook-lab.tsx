import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Flame, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { generateHooks } from "@/server/hookLab.functions";
import { withAIProgress } from "@/lib/aiProgress";

interface Hook {
  framework: string;
  text: string;
}

export const Route = createFileRoute("/dashboard/hook-lab")({
  component: HookLabPage,
});

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
] as const;

function HookLabPage() {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("twitter");
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic (3+ chars)");
    setLoading(true);
    setHooks([]);
    try {
      const res = await withAIProgress(generateHooks({ data: { topic: topic.trim(), platform } }));
      if (res.error) {
        toast.error(res.error);
      } else if (res.hooks.length === 0) {
        toast.error("No hooks generated. Try a different topic.");
      } else {
        setHooks(res.hooks);
        toast.success(`${res.hooks.length} viral hooks ready`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <Flame className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Viral Hook Lab</h1>
          <p className="text-sm text-muted-foreground">
            Generate 20 scroll-stopping hooks using proven viral frameworks.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Topic or angle</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            placeholder="e.g. Why most SaaS founders fail at pricing"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  platform === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Cooking hooks...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate 20 hooks
            </>
          )}
        </button>
      </div>

      {hooks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {hooks.map((h, i) => (
            <div
              key={i}
              className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                  {h.framework}
                </span>
                <button
                  onClick={() => copy(h.text, i)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Copy"
                >
                  {copiedIdx === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
