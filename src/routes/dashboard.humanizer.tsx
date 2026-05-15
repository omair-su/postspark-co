import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { humanize } from "@/lib/copilot.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/humanizer")({
  component: HumanizerPage,
  head: () => ({
    meta: [
      { title: "AI Humanizer — PostSpark" },
      { name: "description", content: "Make AI-generated text sound naturally human. Bypass AI detectors with one click." },
    ],
  }),
});

function HumanizerPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [intensity, setIntensity] = useState<"light" | "medium" | "strong">("medium");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function run() {
    if (input.trim().length < 20) {
      toast.error("Please paste at least 20 characters.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const r = await withAIProgress(humanize({ data: { text: input, intensity } }));
      if (r.error) {
        toast.error(r.error);
      } else {
        setOutput(r.output);
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
          <Wand2 className="h-8 w-8 text-electric" />
          AI Humanizer
        </h1>
        <p className="text-muted-foreground mt-2">
          Rewrite AI-flavored text so it reads naturally — vary rhythm, drop corporate filler, keep meaning intact.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Original text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your AI-generated content here…"
            className="w-full min-h-[320px] rounded-xl border border-border bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric/40"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(["light", "medium", "strong"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setIntensity(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    intensity === lvl
                      ? "bg-electric text-white border-electric"
                      : "bg-card border-border hover:border-electric/40"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{input.length} chars</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Humanized output</label>
          <div className="relative w-full min-h-[320px] rounded-xl border border-border bg-card p-4 text-sm whitespace-pre-wrap">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Rewriting in your natural voice…
              </div>
            ) : output ? (
              <>
                <div>{output}</div>
                <button
                  onClick={copy}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 backdrop-blur hover:bg-background border border-border"
                  aria-label="Copy"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </>
            ) : (
              <div className="text-muted-foreground">Your humanized text will appear here.</div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading || input.trim().length < 20}
        className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-electric to-electric/80 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Humanize
      </button>
    </div>
  );
}
