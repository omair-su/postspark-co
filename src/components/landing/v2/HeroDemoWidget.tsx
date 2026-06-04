import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Copy, Check, Sparkles, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

type Pack = { tweet: string; linkedin: string; hook: string };
type TabKey = "tweet" | "linkedin" | "hook";

const PLACEHOLDER =
  "Paste any blog paragraph, article snippet, or topic idea here…";

export function HeroDemoWidget() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [tab, setTab] = useState<TabKey>("tweet");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<TabKey | null>(null);

  const valid = input.trim().length >= 20;

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError("Please paste at least 20 characters.");
      return;
    }
    setLoading(true);
    setPack(null);
    track("hero_demo_generate_start", { chars: input.length });
    try {
      const res = await fetch("/api/public/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed. Try again.");
        track("hero_demo_generate_error", { status: res.status });
      } else {
        setPack(data.pack);
        setTab("tweet");
        track("hero_demo_generate_success");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const doCopy = (key: TabKey, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    track("hero_demo_copy", { tab: key });
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: "tweet", label: "Tweet", emoji: "🐦" },
    { key: "linkedin", label: "LinkedIn", emoji: "💼" },
    { key: "hook", label: "Subject line", emoji: "📧" },
  ];

  return (
    <div
      className="ps-card relative w-full"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
        padding: 24,
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}
          >
            Try PostSpark Free
          </h3>
          <p className="text-xs" style={{ color: "#64748B" }}>
            No account needed · Powered by Claude AI
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: "#F5F3FF", color: "#7C3AED" }}
        >
          <Sparkles className="h-3 w-3" /> Live
        </span>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value.slice(0, 2000))}
        placeholder={PLACEHOLDER}
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

      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <span
            key={t.key}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: "#F5F3FF", color: "#7C3AED" }}
          >
            <Check className="h-3 w-3" /> {t.emoji} {t.label}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
        style={{
          background: "#7C3AED",
          boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#6D28D9")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            PostSpark is generating…
          </>
        ) : (
          <>
            Generate Content <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs"
          style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      {pack && (
        <div className="mt-5">
          <div className="flex gap-1 border-b" style={{ borderColor: "#E2E8F0" }}>
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-2 text-xs font-bold transition"
                  style={{
                    color: active ? "#7C3AED" : "#64748B",
                    borderBottom: active ? "2px solid #7C3AED" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              );
            })}
          </div>
          <div
            className="mt-3 rounded-lg p-3 text-sm"
            style={{ background: "#F8FAFC", color: "#0F172A", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap leading-relaxed">{pack[tab]}</p>
              <button
                type="button"
                onClick={() => doCopy(tab, pack[tab])}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }}
              >
                {copied === tab ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === tab ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div
            className="mt-4 rounded-xl p-4 text-center"
            style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}
          >
            <p className="text-sm" style={{ color: "#0F172A" }}>
              Want all <strong>30 pieces</strong> from this input?
            </p>
            <Link
              to="/signup"
              onClick={() => track("cta_click", { from: "hero_demo_unlock" })}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold"
              style={{ color: "#7C3AED" }}
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
