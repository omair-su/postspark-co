import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, ArrowRight, Lock, Check, Copy, RefreshCw, Bug, X, Gauge } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { track, captureUTMs, subscribeAnalyticsDebug } from "@/lib/analytics";

const TITLE = "Try PostSpark Free — No Signup Demo | AI Content Repurposing";
const DESC = "Paste any blog excerpt, transcript, or idea. Get a ready-to-publish tweet, LinkedIn post, and viral hook in 10 seconds. No signup required.";
const URL = "https://postspark.co/demo";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: DemoPage,
});

type Pack = { tweet: string; linkedin: string; hook: string };
type Status = { limit: number; used: number; remaining: number; resetsInHours: number };

const PLACEHOLDER = `Paste a blog excerpt, podcast transcript, video script, or even just a rough idea. Try something like:

"We just shipped a new feature that lets agencies manage 10 client brand voices from one dashboard..."`;

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        track("demo_copy");
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DemoPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [events, setEvents] = useState<{ event: string; payload: any; at: number }[]>([]);
  const lastInputRef = useRef<string>("");

  const refreshStatus = async () => {
    try {
      const res = await fetch("/api/public/demo-status");
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    captureUTMs();
    track("demo_view");
    refreshStatus();
    const unsub = subscribeAnalyticsDebug((e) => {
      setEvents((prev) => [e, ...prev].slice(0, 50));
    });
    return () => { unsub(); };
  }, []);

  const generate = async (text: string) => {
    setError(null);
    if (text.trim().length < 20) {
      setError({ message: "Paste at least 20 characters so we have something to work with.", canRetry: false });
      return;
    }
    setLoading(true);
    setPack(null);
    lastInputRef.current = text;
    track("demo_generate_start", { chars: text.length });
    try {
      const res = await fetch("/api/public/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const canRetry = res.status !== 429 && res.status !== 400;
        setError({ message: data.error || `Generation failed (${res.status}).`, canRetry });
        track("demo_generate_error", { status: res.status });
      } else {
        setPack(data.pack);
        if (typeof data.remaining === "number") {
          setStatus((s) => (s ? { ...s, remaining: data.remaining, used: s.limit - data.remaining } : s));
        }
        track("demo_generate_success");
      }
    } catch {
      setError({ message: "Network error — check your connection and retry.", canRetry: true });
    } finally {
      setLoading(false);
      refreshStatus();
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(input);
  };

  const blocked = status?.remaining === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Free demo — no signup
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              See PostSpark turn 1 idea into 3 platform-ready posts
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Paste anything — blog, transcript, rough idea. 10 seconds later: tweet + LinkedIn post + hook.
            </p>
          </div>

          {/* Rate-limit status */}
          {status && (
            <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-2.5 text-xs">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                Free attempts today:{" "}
                <strong className={blocked ? "text-destructive" : "text-foreground"}>
                  {status.remaining}/{status.limit}
                </strong>
              </span>
              <span className="text-muted-foreground">Resets every {status.resetsInHours}h</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 4000))}
              placeholder={PLACEHOLDER}
              rows={7}
              className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={4000}
            />
            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {input.length} / 4000 ·{" "}
                {input.trim().length >= 20 ? "✓ ready" : `${Math.max(0, 20 - input.trim().length)} more chars`}
              </span>
              <button
                type="submit"
                disabled={loading || blocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating…" : blocked ? "Daily limit reached" : "Generate 3 posts"}
              </button>
            </div>

            {error && (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
                <span>{error.message}</span>
                {error.canRetry && lastInputRef.current && (
                  <button
                    type="button"
                    onClick={() => generate(lastInputRef.current)}
                    className="inline-flex items-center gap-1.5 self-start rounded-md border border-destructive/40 bg-background px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 sm:self-auto"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                )}
              </div>
            )}
          </form>

          {pack && (
            <div className="mt-8 space-y-4">
              {([
                { key: "tweet", label: "Tweet", emoji: "🐦", text: pack.tweet },
                { key: "linkedin", label: "LinkedIn Post", emoji: "💼", text: pack.linkedin },
                { key: "hook", label: "Opening Hook", emoji: "🔥", text: pack.hook },
              ] as const).map((c) => (
                <div key={c.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.emoji} {c.label}
                    </div>
                    <CopyBtn text={c.text} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{c.text}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
                  <Lock className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-3 text-xl font-bold text-foreground">
                  Unlock the full pack — 10+ posts per input
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Free account adds carousels, threads, captions, video scripts, newsletter drafts, Brand Voice and image studio.
                  <strong> 10 free repurposes every month, no card.</strong>
                </p>
                <Link
                  to="/signup"
                  onClick={() => track("cta_click", { from: "demo_unlock" })}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Sign up free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Debug panel */}
      <button
        onClick={() => setShowDebug((v) => !v)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-lg hover:bg-accent"
        aria-label="Toggle analytics debug panel"
      >
        <Bug className="h-3.5 w-3.5" /> Debug {events.length > 0 && <span className="text-muted-foreground">({events.length})</span>}
      </button>
      {showDebug && (
        <div className="fixed bottom-16 right-4 z-50 flex max-h-[60vh] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Analytics events ({events.length})
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEvents([])}
                className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
              >
                Clear
              </button>
              <button
                onClick={() => setShowDebug(false)}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                aria-label="Close debug panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {events.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                No events yet. Try generating a demo or clicking a CTA.
              </div>
            )}
            <ul className="space-y-1.5">
              {events.map((e, i) => (
                <li key={i} className="rounded border border-border bg-background p-2">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-semibold text-primary">{e.event}</code>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(e.at).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="mt-1 overflow-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
{JSON.stringify(e.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
