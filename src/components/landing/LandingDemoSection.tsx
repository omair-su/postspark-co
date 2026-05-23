import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Lock, Check, Copy } from "lucide-react";
import { track } from "@/lib/analytics";

type Pack = { tweet: string; linkedin: string; hook: string };

const MIN_CHARS = 20;
const PLACEHOLDER = `Paste any blog excerpt, podcast transcript, video script, or rough idea (min ${MIN_CHARS} chars). Example: "We just shipped Brand Voice — agencies can train PostSpark on a client's past posts so every output sounds exactly like them..."`;

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        track("landing_demo_copy");
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function LandingDemoSection() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (input.trim().length < MIN_CHARS) {
      setError(`Paste at least ${MIN_CHARS} characters so we have something to work with.`);
      return;
    }
    setLoading(true);
    setPack(null);
    track("landing_demo_generate_start", { chars: input.length });
    try {
      const res = await fetch("/api/public/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        track("landing_demo_generate_error", { status: res.status });
      } else {
        setPack(data.pack);
        setRemaining(data.remaining ?? null);
        track("landing_demo_generate_success");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const charCount = input.length;
  const reached = input.trim().length >= MIN_CHARS;

  return (
    <section id="try-demo" className="border-y border-border bg-gradient-to-b from-background via-muted/20 to-background py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Try it free — no signup
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            See PostSpark turn 1 idea into 3 platform-ready posts
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Paste anything below. In 10 seconds you'll get a tweet, a LinkedIn post, and an opening hook you could publish today.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 4000))}
            placeholder={PLACEHOLDER}
            rows={6}
            className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={4000}
          />
          <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className={`text-xs ${reached ? "text-emerald-500" : "text-muted-foreground"}`}>
              {reached ? `✓ Ready (${charCount} chars)` : `${Math.max(0, MIN_CHARS - input.trim().length)} more chars to enable`}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : "Generate 3 posts"}
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
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
                onClick={() => track("cta_click", { from: "landing_demo_unlock" })}
                className="mt-5 inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Sign up free <ArrowRight className="h-4 w-4" />
              </Link>
              {remaining !== null && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {remaining > 0
                    ? `${remaining} more free demo${remaining === 1 ? "" : "s"} today.`
                    : "You've used your free demos for today."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
