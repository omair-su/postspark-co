import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check, RefreshCw, AlertTriangle, Download, Type } from "lucide-react";
import { repurposeContent, getMonthlyUsage } from "@/server/repurpose.functions";
import { exportToPdf } from "@/lib/exportPdf";
import { ToneSelector } from "@/components/ToneSelector";

const contentTypes = [
  { id: "tweets", label: "10 Tweets", emoji: "🐦" },
  { id: "thread", label: "X Thread", emoji: "🧵" },
  { id: "linkedin", label: "5 LinkedIn Posts", emoji: "💼" },
  { id: "instagram", label: "5 IG Captions", emoji: "📸" },
  { id: "facebook", label: "3 Facebook Posts", emoji: "👍" },
  { id: "email", label: "Email Newsletter", emoji: "📧" },
  { id: "video", label: "Video Script", emoji: "🎬" },
  { id: "tiktok", label: "TikTok Scripts", emoji: "🎵" },
  { id: "podcast", label: "Podcast Notes", emoji: "🎙️" },
  { id: "seo", label: "SEO / Blog Summary", emoji: "🔍" },
];

interface ParsedResults {
  [key: string]: string;
}

export const Route = createFileRoute("/dashboard/repurpose")({
  component: RepurposePage,
});

function RepurposePage() {
  const { user, session } = useAuth();
  const [tab, setTab] = useState<"text" | "youtube">("text");
  const [inputText, setInputText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["tweets", "linkedin", "email", "video"]));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ParsedResults | null>(null);
  const [rawOutput, setRawOutput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [tone, setTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");

  useEffect(() => {
    if (user && session) {
      getMonthlyUsage({ headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(setUsage)
        .catch(() => {});
    }
  }, [user, session]);

  const toggleType = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const parseResults = (text: string): ParsedResults => {
    const sections: ParsedResults = {};
    const lower = text.toLowerCase();

    const keywords: Record<string, string[]> = {
      tweets: ["tweet"],
      thread: ["thread"],
      linkedin: ["linkedin"],
      instagram: ["instagram"],
      facebook: ["facebook"],
      email: ["email", "newsletter"],
      video: ["video script"],
      tiktok: ["tiktok", "reels"],
      podcast: ["podcast"],
      seo: ["seo", "blog summary", "meta description"],
    };

    const indices: { key: string; idx: number }[] = [];
    for (const [key, terms] of Object.entries(keywords)) {
      for (const term of terms) {
        const idx = lower.indexOf(term);
        if (idx >= 0) {
          indices.push({ key, idx });
          break;
        }
      }
    }

    indices.sort((a, b) => a.idx - b.idx);

    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].idx;
      const end = i + 1 < indices.length ? indices[i + 1].idx : text.length;
      sections[indices[i].key] = text.slice(start, end).trim();
    }

    if (Object.keys(sections).length === 0) {
      sections.tweets = text;
    }

    return sections;
  };

  const handleRepurpose = async () => {
    if (usage && usage.used >= usage.limit) {
      setShowUpgradeModal(true);
      return;
    }

    const input = tab === "text" ? inputText : `YouTube video: ${youtubeUrl}`;
    if (!input.trim()) {
      toast.error("Please enter some content first");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one content type");
      return;
    }

    setLoading(true);
    setResults(null);
    setRawOutput("");

    try {
      const result = await repurposeContent({
        data: {
          inputText: input,
          selectedTypes: Array.from(selected),
          tone,
          customInstructions,
        },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (result.error) {
        if (result.error === "LIMIT_REACHED") {
          setShowUpgradeModal(true);
        } else {
          toast.error(result.error);
        }
        setLoading(false);
        return;
      }

      setRawOutput(result.output);
      setResults(parseResults(result.output));

      if (session) {
        getMonthlyUsage({ headers: { Authorization: `Bearer ${session.access_token}` } })
          .then(setUsage)
          .catch(() => {});
      }

      toast.success("Content generated successfully!");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = usage ? usage.limit - usage.used : null;

  const typeLabels: Record<string, string> = {};
  for (const ct of contentTypes) {
    typeLabels[ct.id] = `${ct.emoji} ${ct.label}`;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Repurpose Content</h1>
      <p className="mt-1 text-sm text-muted-foreground">Transform your content into multiple formats with AI.</p>

      {/* Usage banner */}
      {usage && (
        <div className={`mt-4 flex items-center gap-3 rounded-xl border p-4 text-sm ${
          remaining === 0
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : remaining !== null && remaining <= 1
              ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400"
              : "border-primary/20 bg-primary/5 text-foreground"
        }`}>
          {remaining === 0 ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span>
            You have <strong>{Math.max(0, remaining ?? 0)}</strong> repurpose{remaining === 1 ? "" : "s"} left this month.
            {remaining !== null && remaining <= 1 && (
              <> <button onClick={() => setShowUpgradeModal(true)} className="font-semibold underline underline-offset-2 hover:opacity-80">Upgrade to Pro</button> for unlimited.</>
            )}
          </span>
        </div>
      )}

      {/* Step 1: Input */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Step 1: Your Content</h2>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setTab("text")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "text" ? "gradient-electric text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setTab("youtube")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "youtube" ? "gradient-electric text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}
          >
            YouTube URL
          </button>
        </div>

        {tab === "text" ? (
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your blog post, article, or any text here..."
            className="mt-3 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-40"
          />
        ) : (
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>

      {/* Step 2: Select types */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Step 2: Choose Formats</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {contentTypes.map((ct) => (
            <button
              key={ct.id}
              onClick={() => toggleType(ct.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                selected.has(ct.id)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span>{ct.emoji}</span> {ct.label}
              {selected.has(ct.id) && <Check className="h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Tone & Style */}
      <div className="mt-4">
        <ToneSelector
          tone={tone}
          onToneChange={setTone}
          customInstructions={customInstructions}
          onCustomInstructionsChange={setCustomInstructions}
        />
      </div>

      {/* Generate button */}
      <button
        onClick={handleRepurpose}
        disabled={loading || (remaining !== null && remaining <= 0)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-electric px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 glow-electric"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is working its magic...
          </>
        ) : remaining !== null && remaining <= 0 ? (
          <>
            Limit Reached — Upgrade to Pro <Sparkles className="h-4 w-4" />
          </>
        ) : (
          <>
            Repurpose Now <Sparkles className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="mt-6 space-y-4">
          {Object.entries(results).map(([key, content]) => {
            if (!selected.has(key) && key !== "tweets") return null;
            const label = typeLabels[key] || key;
            return (
              <ResultCard
                key={key}
                title={label}
                content={content}
                id={key}
                onCopy={handleCopy}
                copied={copied}
                onRegenerate={handleRepurpose}
              />
            );
          })}
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">You've hit your monthly limit</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Free accounts get 3 repurposes per month. Upgrade to <strong>Pro</strong> for unlimited AI-powered content generation.
            </p>
            <div className="mt-6 space-y-3">
              <button className="w-full rounded-xl gradient-electric px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 glow-electric">
                Upgrade to Pro — $19/mo
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className="w-full rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  title,
  content,
  id,
  onCopy,
  copied,
  onRegenerate,
}: {
  title: string;
  content: string;
  id: string;
  onCopy: (text: string, id: string) => void;
  copied: string | null;
  onRegenerate: () => void;
}) {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  const handleExportPdf = () => {
    exportToPdf([{ title, content }], `repurpose-${id}`);
    toast.success("PDF downloaded!");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onCopy(content, id)}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied === id ? (
              <>
                <Check className="h-3 w-3 text-primary" /> Copied! ✅
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy All
              </>
            )}
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="h-3 w-3" /> PDF
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
        </div>
      </div>

      {/* Word/char count */}
      <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {wordCount} words</span>
        <span>{charCount} chars</span>
        {id === "tweets" && charCount > 280 && (
          <span className="text-yellow-500">⚠ Some tweets may exceed 280 chars</span>
        )}
      </div>

      <pre className="mt-3 whitespace-pre-wrap text-sm text-foreground leading-relaxed">{content}</pre>
    </div>
  );
}
