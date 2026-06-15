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
      className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-3 py-1.5 text-[11px] font-semibold"
      style={{ background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" }}
    >
      <span className="inline-flex items-center gap-1.5">
        <Flame className="h-3 w-3" />
        {stats ? stats.generatedToday.toLocaleString() : "2,847"} pieces generated today
      </span>
      <span className="hidden h-1 w-1 rounded-full bg-violet-400 sm:inline-block" />
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
      className="rounded-xl p-3"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="h-9 w-9 shrink-0 rounded-full"
          style={{
            background: isTwitter
              ? "linear-gradient(135deg,#1DA1F2,#0d8ed4)"
              : "linear-gradient(135deg,#0A66C2,#084d92)",
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs">
            <span style={{ color: "#0F172A", fontWeight: 700 }}>Your Brand</span>
            <span style={{ color: "#64748B" }}>· {isTwitter ? "2m" : "Just now"}</span>
          </div>
          <p
            className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed"
            style={{ color: "#0F172A" }}
          >
            {text}
          </p>
          <div className="mt-2 flex gap-4 text-[11px]" style={{ color: "#64748B" }}>
            <span>💬 24</span>
            <span>🔁 87</span>
            <span>♥ 412</span>
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
      className="ps-card relative w-full"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(124,58,237,0.12), 0 4px 16px rgba(15,23,42,0.06)",
        padding: 22,
      }}
    >
      <SocialProofTicker />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
          >
            Try PostSpark — Free, No Signup
          </h3>
          <p className="text-xs" style={{ color: "#64748B" }}>
            1 input → 6 platform-ready pieces · Powered by Claude AI
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: "#F5F3FF", color: "#7C3AED" }}
        >
          <Sparkles className="h-3 w-3" /> Live
        </span>
      </div>

      {/* Source type tabs */}
      <div className="mb-2 flex gap-1 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
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
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
              style={{
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "#7C3AED" : "#64748B",
                boxShadow: active ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
              }}
            >
              <s.Icon className="h-3.5 w-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {sourceType === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 4000))}
          placeholder="Paste any blog paragraph, article snippet, or topic idea…"
          rows={4}
          className="w-full resize-none rounded-lg p-3 text-sm outline-none transition focus:ring-2"
          style={
            {
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              background: "#FFFFFF",
              ["--tw-ring-color" as never]: "#A78BFA",
            } as React.CSSProperties
          }
        />
      ) : (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value.slice(0, 500))}
          placeholder="https://yourblog.com/post  or  https://youtube.com/watch?v=…"
          className="w-full rounded-lg p-3 text-sm outline-none transition focus:ring-2"
          style={
            {
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              background: "#FFFFFF",
              ["--tw-ring-color" as never]: "#A78BFA",
            } as React.CSSProperties
          }
        />
      )}

      <div className="mt-1 flex items-center justify-between text-[11px]" style={{ color: "#94A3B8" }}>
        <span>
          {sourceType === "text" ? "Min 20 chars" : "Public blog post or YouTube link"}
        </span>
        <span>
          {charCount} / {charMax}
        </span>
      </div>

      {/* Tone selector */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#64748B" }}>
          Voice / Tone
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => {
            const active = tone === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTone(t.key)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
                style={{
                  background: active ? "#7C3AED" : "#F5F3FF",
                  color: active ? "#FFFFFF" : "#7C3AED",
                  border: active ? "1px solid #7C3AED" : "1px solid #DDD6FE",
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
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
          boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            PostSpark is repurposing into 6 pieces…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" /> Generate 6 Pieces Now <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {remaining !== null && !error && (
        <p className="mt-2 text-center text-[11px]" style={{ color: "#64748B" }}>
          {remaining} of 3 free demos left today ·{" "}
          <Link to="/signup" className="font-bold" style={{ color: "#7C3AED" }}>
            Sign up free for 3/month →
          </Link>
        </p>
      )}

      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs"
          style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
        >
          {error}
          {limited && (
            <Link
              to="/signup"
              className="ml-2 inline-flex font-bold underline"
              style={{ color: "#B91C1C" }}
            >
              Sign up free →
            </Link>
          )}
        </div>
      )}

      {pack && (
        <div ref={resultsRef} className="mt-5">
          {/* Wow strip */}
          <div
            className="mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
            style={{
              background: "linear-gradient(135deg, #F5F3FF 0%, #FAF5FF 100%)",
              border: "1px solid #DDD6FE",
            }}
          >
            <span style={{ color: "#6D28D9", fontWeight: 700 }}>
              ✨ 6 pieces ready · ~45 minutes saved
            </span>
            <span style={{ color: "#7C3AED" }}>{tone} voice</span>
          </div>

          {/* Tab grid: 2 rows of 3, locked tabs marked */}
          <div className="grid grid-cols-3 gap-1.5">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="relative flex items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-bold transition"
                  style={{
                    background: active ? "#FFFFFF" : "#F8FAFC",
                    color: active ? t.color : "#475569",
                    border: active ? `1.5px solid ${t.color}` : "1px solid #E2E8F0",
                  }}
                  title={t.label}
                >
                  <t.Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{t.label}</span>
                  {t.locked && (
                    <Lock className="h-2.5 w-2.5" style={{ color: "#C9A87C" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Output panel */}
          <div className="relative mt-3">
            {isLocked ? (
              <div
                className="relative overflow-hidden rounded-lg p-4 text-center"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)",
                  border: "1px solid #DDD6FE",
                  minHeight: 180,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-3 top-3 select-none text-left text-sm"
                  style={{
                    color: "#0F172A",
                    filter: "blur(6px)",
                    opacity: 0.5,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {activeText.slice(0, 320)}
                </div>
                <div className="relative pt-16">
                  <div
                    className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}
                  >
                    <Lock className="h-4 w-4" style={{ color: "#C9A87C" }} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                    Unlock {activeTab.label}
                  </p>
                  <p className="mb-3 mt-0.5 text-xs" style={{ color: "#64748B" }}>
                    Free account · 3 repurposes/month · No card required
                  </p>
                  <Link
                    to="/signup"
                    onClick={() => track("cta_click", { from: `demo_lock_${tab}` })}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white"
                    style={{
                      background: "#7C3AED",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                    }}
                  >
                    Sign Up Free to Unlock <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(tab === "tweet" || tab === "linkedin") && typed.length > 30 ? (
                  <PlatformMockup platform={tab as "tweet" | "linkedin"} text={typed} />
                ) : (
                  <div
                    className="rounded-lg p-3 text-sm"
                    style={{
                      background: "#F8FAFC",
                      color: "#0F172A",
                      border: "1px solid #E2E8F0",
                      minHeight: 100,
                    }}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {typed}
                      {typed.length < activeText.length && (
                        <span
                          className="ml-0.5 inline-block h-3 w-[2px] animate-pulse align-middle"
                          style={{ background: "#7C3AED" }}
                        />
                      )}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px]" style={{ color: "#64748B" }}>
                  <span>
                    {activeText.length} chars
                    {activeTab.charLimit && (
                      <>
                        {" "}
                        /{" "}
                        <span
                          style={{
                            color: activeText.length > activeTab.charLimit ? "#EF4444" : "#10B981",
                            fontWeight: 700,
                          }}
                        >
                          {activeTab.charLimit} limit ✓
                        </span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => doCopy(tab, activeText)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                    style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }}
                  >
                    {copied === tab ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === tab ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upgrade panel */}
          <div
            className="mt-4 rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, #1B1530 0%, #0F0B22 100%)",
              border: "1px solid #4C1D95",
            }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { v: "30+", l: "pieces / input" },
                { v: "~45m", l: "saved per post" },
                { v: "1,200+", l: "creators" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-lg font-extrabold" style={{ color: "#FFFFFF" }}>
                    {s.v}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "#A78BFA" }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/signup"
              onClick={() => track("cta_click", { from: "demo_post_panel" })}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                boxShadow: "0 4px 14px rgba(124,58,237,0.45)",
              }}
            >
              Get 10 Free Repurposes/Month <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-1.5 text-center text-[10px]" style={{ color: "#94A3B8" }}>
              No credit card · Cancel anytime
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
