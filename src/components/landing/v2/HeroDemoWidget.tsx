import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Loader2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Lock,
  Link as LinkIcon,
  FileText,
  Flame,
  Users,
  Twitter,
  Linkedin,
  Mail,
  ListOrdered,
  Newspaper,
  Film,
  Zap,
} from "lucide-react";
import { track } from "@/lib/analytics";

type Pack = {
  tweet: string;
  linkedin: string;
  subject: string;
  thread: string;
  newsletter: string;
  short_script: string;
};
type TabKey = keyof Pack;
type SourceType = "text" | "url";
type Tone = "professional" | "casual" | "bold" | "storyteller";

const SAMPLE_TEXT =
  "We just shipped a new way to repurpose long-form content into 30+ short posts in under 10 seconds. Creators spend 4+ hours a week rewriting the same idea for Twitter, LinkedIn, newsletters and video. PostSpark does it in one click — in your voice, ready to publish.";

const TONES: { key: Tone; label: string; emoji: string }[] = [
  { key: "professional", label: "Professional", emoji: "💼" },
  { key: "casual", label: "Casual", emoji: "☕" },
  { key: "bold", label: "Bold", emoji: "🔥" },
  { key: "storyteller", label: "Storyteller", emoji: "📖" },
];

const TABS: {
  key: TabKey;
  label: string;
  Icon: typeof Twitter;
  color: string;
  locked: boolean;
  charLimit?: number;
}[] = [
  { key: "tweet", label: "Tweet", Icon: Twitter, color: "#1DA1F2", locked: false, charLimit: 280 },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2", locked: false },
  { key: "subject", label: "Email Subject", Icon: Mail, color: "#EA4335", locked: false, charLimit: 60 },
  { key: "thread", label: "Thread (5)", Icon: ListOrdered, color: "#7C3AED", locked: true },
  { key: "newsletter", label: "Newsletter", Icon: Newspaper, color: "#C9A87C", locked: true },
  { key: "short_script", label: "YT Short", Icon: Film, color: "#FF0000", locked: true },
];

function useTypewriter(text: string, speed = 12) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    if (!text) return;
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      i = Math.min(text.length, i + Math.max(1, Math.floor(text.length / 120)));
      setOut(text.slice(0, i));
      if (i < text.length) setTimeout(tick, speed);
    };
    setTimeout(tick, 60);
    return () => {
      cancelled = true;
    };
  }, [text, speed]);
  return out;
}

function SocialProofTicker() {
  const [stats, setStats] = useState<{ generatedToday: number; signupsThisWeek: number } | null>(null);
  useEffect(() => {
    fetch("/api/public/demo-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);
  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-4 py-2 text-[11px] font-bold tracking-wide"
      style={{ background: "rgba(124, 58, 237, 0.05)", color: "#7C3AED", border: "1px solid rgba(124, 58, 237, 0.1)" }}
    >
      <span className="inline-flex items-center gap-1.5">
        <Flame className="h-3 w-3" />
        {stats ? stats.generatedToday.toLocaleString() : "2,847"} pieces generated today
      </span>
      <span className="hidden h-1 w-1 rounded-full bg-violet-300 sm:inline-block" />
      <span className="inline-flex items-center gap-1.5">
        <Users className="h-3 w-3" />
        {stats ? stats.signupsThisWeek.toLocaleString() : "312"} creators joined this week
      </span>
    </div>
  );
}

function PlatformMockup({
  platform,
  text,
}: {
  platform: "tweet" | "linkedin";
  text: string;
}) {
  const isTwitter = platform === "tweet";
  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: "#FFFFFF",
        border: "1px solid #F1F5F9",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white"
          style={{
            background: isTwitter
              ? "linear-gradient(135deg,#1DA1F2,#0d8ed4)"
              : "linear-gradient(135deg,#0A66C2,#084d92)",
          }}
        >
          {isTwitter ? <Twitter size={18} fill="currentColor" /> : <Linkedin size={18} fill="currentColor" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: "#0F172A", fontWeight: 800 }}>Your Brand Voice</span>
            <span style={{ color: "#94A3B8" }}>· {isTwitter ? "2m" : "Just now"}</span>
          </div>
          <p
            className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-800"
          >
            {text}
          </p>
          <div className="mt-4 flex gap-6 text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1">💬 24</span>
            <span className="flex items-center gap-1">🔁 87</span>
            <span className="flex items-center gap-1">♥ 412</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroDemoWidget() {
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [text, setText] = useState(SAMPLE_TEXT);
  const [url, setUrl] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [tab, setTab] = useState<TabKey>("tweet");
  const [error, setError] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);
  const [copied, setCopied] = useState<TabKey | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    setError(null);
    setLimited(false);

    if (sourceType === "text" && text.trim().length < 20) {
      setError("Please paste at least 20 characters.");
      return;
    }
    if (sourceType === "url" && !/^https?:\/\//.test(url.trim())) {
      setError("Please enter a valid URL starting with http(s)://");
      return;
    }

    setLoading(true);
    setPack(null);
    track("hero_demo_generate_start", { sourceType, tone });

    try {
      const res = await fetch("/api/public/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          input: sourceType === "text" ? text.trim() : undefined,
          url: sourceType === "url" ? url.trim() : undefined,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed. Try again.");
        if (data.limited) setLimited(true);
        track("hero_demo_generate_error", { status: res.status });
      } else {
        setPack(data.pack);
        setRemaining(typeof data.remaining === "number" ? data.remaining : null);
        setTab("tweet");
        track("hero_demo_generate_success", { tone });
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const doCopy = (key: TabKey, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    track("hero_demo_copy", { tab: key });
    setTimeout(() => setCopied(null), 1500);
  };

  const activeTab = useMemo(() => TABS.find((t) => t.key === tab)!, [tab]);
  const activeText = pack?.[tab] || "";
  const typed = useTypewriter(activeText, 8);
  const isLocked = activeTab.locked;

  const charCount = sourceType === "text" ? text.length : url.length;
  const charMax = sourceType === "text" ? 4000 : 500;

  return (
    <div
      className="ps-card relative w-full overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 24,
        boxShadow: "0 25px 50px -12px rgba(124, 58, 237, 0.15)",
        padding: 28,
      }}
    >
      <SocialProofTicker />

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-xl font-black text-slate-900"
            style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
          >
            Try PostSpark Live
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            1 input → 6 platform-ready pieces · Powered by Claude AI
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200">
          <Sparkles size={20} />
        </div>
      </div>

      {/* Source type tabs */}
      <div className="mb-4 flex gap-1 rounded-2xl p-1.5 bg-slate-100/80">
        {[
          { key: "text" as SourceType, label: "Paste Text", Icon: FileText },
          { key: "url" as SourceType, label: "Blog / YouTube URL", Icon: LinkIcon },
        ].map((s) => {
          const active = sourceType === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSourceType(s.key)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all"
              style={{
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "#7C3AED" : "#64748B",
                boxShadow: active ? "0 4px 12px rgba(15,23,42,0.08)" : "none",
              }}
            >
              <s.Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        {sourceType === "text" ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 4000))}
            placeholder="Paste any blog paragraph, article snippet, or topic idea…"
            rows={5}
            className="w-full resize-none rounded-2xl p-4 text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-violet-500/10"
            style={{
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              background: "#FFFFFF",
            }}
          />
        ) : (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value.slice(0, 500))}
            placeholder="https://yourblog.com/post  or  https://youtube.com/watch?v=…"
            className="w-full rounded-2xl p-4 text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-violet-500/10"
            style={{
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              background: "#FFFFFF",
            }}
          />
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 px-2 py-1 rounded-md bg-slate-50 text-[10px] font-black text-slate-400">
          {charCount} / {charMax}
        </div>
      </div>

      {/* Tone selector */}
      <div className="mt-6">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Voice / Tone
        </p>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => {
            const active = tone === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTone(t.key)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border"
                style={{
                  background: active ? "#7C3AED" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#7C3AED",
                  borderColor: active ? "#7C3AED" : "#E2E8F0",
                  boxShadow: active ? "0 4px 12px rgba(124,58,237,0.2)" : "none",
                }}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-8 group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-violet-600 px-6 py-4 text-base font-bold text-white transition-all hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-violet-600/20 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Repurposing into 6 pieces…</span>
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" /> 
            <span>Generate 6 Pieces Now</span> 
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {remaining !== null && !error && (
        <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
          {remaining} of 3 free demos left today ·{" "}
          <Link to="/signup" className="font-bold text-violet-600 hover:underline">
            Sign up free for 3/month →
          </Link>
        </p>
      )}

      {error && (
        <div
          className="mt-4 rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2"
          style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
        >
          <X className="h-4 w-4" />
          {error}
          {limited && (
            <Link
              to="/signup"
              className="ml-auto inline-flex font-bold underline"
              style={{ color: "#B91C1C" }}
            >
              Sign up free →
            </Link>
          )}
        </div>
      )}

      {pack && (
        <div ref={resultsRef} className="mt-8 animate-fade-in">
          {/* Wow strip */}
          <div
            className="mb-4 flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #F5F3FF 0%, #FAF5FF 100%)",
              border: "1px solid #DDD6FE",
            }}
          >
            <div className="flex items-center gap-2 text-violet-700">
              <Sparkles size={14} />
              <span>6 pieces ready · ~45 minutes saved</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase tracking-widest text-[10px]">
              {tone} voice
            </span>
          </div>

          {/* Tab grid: 2 rows of 3, locked tabs marked */}
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all ${
                    active 
                      ? 'bg-white border-2 border-violet-500 shadow-lg shadow-violet-100' 
                      : 'bg-slate-50 border border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="relative">
                    <t.Icon className={`h-5 w-5 ${active ? 'text-violet-600' : 'text-slate-400'}`} />
                    {t.locked && (
                      <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-slate-900 text-[8px] text-white">
                        <Lock size={8} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Result area */}
          <div className="mt-4 relative">
            {isLocked ? (
              <div
                className="flex flex-col items-center justify-center rounded-[32px] p-8 text-center"
                style={{
                  background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
                  border: "1px solid #E2E8F0",
                  minHeight: 240,
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl mb-6">
                  <Lock size={24} />
                </div>
                <h4 className="text-lg font-black text-slate-900">{activeTab.label} is Pro Only</h4>
                <p className="mt-2 text-sm text-slate-500 max-w-[240px]">
                  Threads, Newsletters and YT Scripts require a PostSpark Pro account.
                </p>
                <Link
                  to="/signup"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-violet-700 shadow-lg shadow-violet-200"
                >
                  Get Pro Access <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div
                className="rounded-[32px] p-6"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  minHeight: 240,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Preview</span>
                  </div>
                  <button
                    onClick={() => doCopy(tab, activeText)}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 shadow-sm transition-all hover:bg-slate-50"
                  >
                    {copied === tab ? (
                      <>
                        <Check size={14} className="text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy
                      </>
                    )}
                  </button>
                </div>

                {tab === "tweet" || tab === "linkedin" ? (
                  <PlatformMockup platform={tab} text={typed} />
                ) : (
                  <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    {typed}
                  </div>
                )}
                
                {activeTab.charLimit && (
                  <div className="mt-4 flex justify-end">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${typed.length > activeTab.charLimit ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                      {typed.length} / {activeTab.charLimit} chars
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
