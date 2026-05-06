import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { withAIProgress } from "@/lib/aiProgress";
import { Sparkles, Loader2, Copy, Check, RefreshCw, AlertTriangle, Download, Type, Eye, FileText } from "lucide-react";
import { repurposeContent, getMonthlyUsage } from "@/lib/repurpose.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { exportToPdf } from "@/lib/exportPdf";
import { ToneSelector } from "@/components/ToneSelector";
import { VisualPreview } from "@/components/VisualPreview";
import { ImportInputPanel } from "@/components/ImportInputPanel";
import { Link } from "@tanstack/react-router";

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
  const [tab, setTab] = useState<"text" | "import">("text");
  const [importSubTab, setImportSubTab] = useState<"url" | "pdf" | "docx" | "audio">("url");
  const [inputText, setInputText] = useState("");
  const [importMeta, setImportMeta] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["tweets", "linkedin", "email", "video"]));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ParsedResults | null>(null);
  const [rawOutput, setRawOutput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [tone, setTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [language, setLanguage] = useState("English");
  const [brandKit, setBrandKit] = useState<{
    brand_name: string | null;
    tagline: string | null;
    preferred_tone: string | null;
  } | null>(null);
  const [overrideTone, setOverrideTone] = useState(false);

  // Apply template from URL search params + imported text from sessionStorage
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const tpl = url.searchParams.get("tpl");
      if (tpl) {
        const p = new URLSearchParams(tpl);
        const t = p.get("tone");
        const types = p.get("types");
        const instr = p.get("instructions");
        if (t) setTone(t);
        if (types) setSelected(new Set(types.split(",")));
        if (instr) setCustomInstructions(instr);
      }
      const imported = sessionStorage.getItem("postspark.import.text");
      if (imported) {
        setInputText(imported);
        setTab("text");
        sessionStorage.removeItem("postspark.import.text");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user && session) {
      const auth = { headers: { Authorization: `Bearer ${session.access_token}` } };
      getMonthlyUsage(auth).then(setUsage).catch(() => {});
      getBrandKit(auth)
        .then(({ kit }) => {
          if (kit) {
            setBrandKit({
              brand_name: (kit as any).brand_name ?? null,
              tagline: (kit as any).tagline ?? null,
              preferred_tone: (kit as any).preferred_tone ?? null,
            });
          }
        })
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

    const input = inputText;
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
      const useBrandTone = !!brandKit?.preferred_tone && !overrideTone;
      const result = await withAIProgress(repurposeContent({
        data: {
          inputText: input,
          selectedTypes: Array.from(selected),
          tone: useBrandTone ? undefined : tone,
          customInstructions,
          language,
        },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      }));

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

      // Trigger PWA install prompt eligibility after first successful repurpose
      try {
        if (typeof window !== "undefined" && localStorage.getItem("ps_pwa_ready_v1") !== "1") {
          localStorage.setItem("ps_pwa_ready_v1", "1");
          window.dispatchEvent(new Event("postspark:pwa-ready"));
        }
      } catch {}

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

      {/* Brand Kit indicator */}
      {brandKit && (brandKit.brand_name || brandKit.preferred_tone || brandKit.tagline) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">Brand Kit active</span>
          {brandKit.brand_name && (
            <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground">
              {brandKit.brand_name}
            </span>
          )}
          {brandKit.preferred_tone && !overrideTone && (
            <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground">
              Tone: <span className="font-medium text-foreground">{brandKit.preferred_tone}</span>
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 ${brandKit.tagline ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
            Tagline {brandKit.tagline ? "✓" : "—"}
          </span>
          <Link to="/dashboard/brand-kit" className="ml-auto text-primary hover:underline">
            Edit
          </Link>
        </div>
      )}

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
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setTab("text")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "text" ? "gradient-electric text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setTab("import")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "import" ? "gradient-electric text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}
          >
            Import (URL · PDF · Word · Audio)
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
          <div className="mt-3 space-y-3">
            <ImportInputPanel
              subTab={importSubTab}
              onSubTabChange={setImportSubTab}
              onExtracted={(text, meta) => {
                setInputText(text);
                setImportMeta(meta || "");
                setTab("text");
                toast.success("Loaded — review & edit below");
              }}
            />
            {importMeta && (
              <p className="text-xs text-muted-foreground">{importMeta}</p>
            )}
          </div>
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
        {brandKit?.preferred_tone && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-xs">
            <span className="text-muted-foreground">
              Brand Kit tone: <strong className="text-foreground capitalize">{brandKit.preferred_tone}</strong>
              {!overrideTone && <span className="ml-1 text-primary">(in use)</span>}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={overrideTone}
                onChange={(e) => setOverrideTone(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span className="font-medium text-foreground">Override for this run</span>
            </label>
          </div>
        )}
        <div className={brandKit?.preferred_tone && !overrideTone ? "opacity-60 pointer-events-none" : ""}>
          <ToneSelector
            tone={tone}
            onToneChange={setTone}
            customInstructions={customInstructions}
            onCustomInstructionsChange={setCustomInstructions}
          />
        </div>
      </div>

      {/* Step 4: Language */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Step 4: Output Language</h2>
        <p className="mt-1 text-xs text-muted-foreground">Generate content in any language. AI uses native idioms and tone.</p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[
            "English","Spanish","French","German","Portuguese","Italian","Dutch",
            "Polish","Swedish","Turkish","Arabic","Hindi","Bengali","Indonesian",
            "Vietnamese","Thai","Japanese","Korean","Chinese (Simplified)","Chinese (Traditional)",
            "Russian","Ukrainian","Hebrew","Greek","Romanian","Czech","Hungarian","Finnish","Norwegian","Danish"
          ].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
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
              Free accounts get 10 repurposes per month. Upgrade to <strong>Pro</strong> for unlimited AI-powered content generation.
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
  const previewable = ["tweets", "thread", "linkedin", "instagram", "facebook"].includes(id);
  const [view, setView] = useState<"raw" | "preview">(previewable ? "preview" : "raw");

  const handleExportPdf = () => {
    exportToPdf([{ title, content }], `repurpose-${id}`);
    toast.success("PDF downloaded!");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          {previewable && (
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button
                onClick={() => setView("raw")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === "raw" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3" /> Raw
              </button>
            </div>
          )}
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

      {view === "preview" && previewable ? (
        <div className="mt-4">
          <VisualPreview typeId={id} content={content} />
        </div>
      ) : (
        <pre className="mt-3 whitespace-pre-wrap text-sm text-foreground leading-relaxed">{content}</pre>
      )}
    </div>
  );
}
