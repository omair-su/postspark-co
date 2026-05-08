import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { completeOnboarding, getOnboardingStatus } from "@/lib/onboarding.functions";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { PostSparkLogo } from "@/components/PostSparkLogo";
import { toast } from "sonner";
import { SAMPLE_SUGGESTIONS } from "@/lib/sampleSuggestions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — PostSpark" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: OnboardingPage,
});

const ROLES = [
  "Solo Creator",
  "Founder / Indie Hacker",
  "Marketer",
  "Agency",
  "Coach / Consultant",
  "Other",
];

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "newsletter", label: "Newsletter" },
  { id: "blog", label: "Blog" },
  { id: "threads", label: "Threads" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !session) {
      navigate({ to: "/login", replace: true });
      return;
    }
    getOnboardingStatus({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((s) => {
        if (s.completed) navigate({ to: "/dashboard", replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [user, session, authLoading, navigate]);

  const togglePlatform = (id: string) => {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const finish = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      await completeOnboarding({
        data: { role, platforms },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      // Land on Repurpose with a friendly nudge — but DO NOT autorun on the user's behalf.
      try {
        const sample = SAMPLE_SUGGESTIONS[0];
        sessionStorage.setItem(
          "postspark.preset",
          JSON.stringify({ types: sample.selectedTypes, guidance: sample.guidance, title: sample.title }),
        );
      } catch {}
      toast.success("You're all set! Try a sample on the Repurpose page ✨");
      navigate({ to: "/dashboard/repurpose", replace: true });
    } catch {
      toast.error("Could not save preferences. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <PostSparkLogo variant="wordmark" size={32} />
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= n ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-foreground">Welcome to PostSpark 👋</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Let's set things up so we can tailor PostSpark to you. Takes 30 seconds.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-xl font-bold text-foreground">What best describes you?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Pick one — we'll tune suggestions for you.</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  disabled={!role}
                  onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-xl font-bold text-foreground">Where do you publish?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose your top platforms — we'll prioritize formats for these.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => {
                  const active = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{p.label}</span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  disabled={platforms.length === 0 || submitting}
                  onClick={finish}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Finish
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can change these anytime in Settings.
        </p>
      </div>
    </div>
  );
}
