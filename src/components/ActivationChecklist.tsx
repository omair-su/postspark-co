import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Circle, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Step = {
  id: "brand-kit" | "brand-voice" | "first-repurpose" | "schedule";
  label: string;
  to: string;
  done: boolean;
};

const DISMISS_KEY = "ps:activation-dismissed";

/**
 * Activation checklist — shows progress through the 4 onboarding steps.
 * Hides itself once all steps are done OR the user dismisses it.
 */
export function ActivationChecklist() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const sb = supabase as any;
      const [kit, voice, jobs, scheduled] = await Promise.all([
        sb.from("brand_kits").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("brand_voices").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("repurpose_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("calendar_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setSteps([
        { id: "brand-kit", label: "Set up your Brand Kit", to: "/dashboard/brand-kit", done: (kit.count ?? 0) > 0 },
        { id: "brand-voice", label: "Train your Brand Voice", to: "/dashboard/brand-voice", done: (voice.count ?? 0) > 0 },
        { id: "first-repurpose", label: "Run your first Repurpose", to: "/dashboard/repurpose", done: (jobs.count ?? 0) > 0 },
        { id: "schedule", label: "Schedule a post on the Calendar", to: "/dashboard/calendar", done: (scheduled.count ?? 0) > 0 },
      ]);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  if (!steps || dismissed) return null;
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const pct = (done / steps.length) * 100;

  return (
    <div className="relative rounded-2xl border border-border bg-card p-5">
      <button
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-electric">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Get to your first win</p>
          <p className="text-xs text-muted-foreground">
            {done} of {steps.length} done · finish setup in under 2 minutes
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-accent">
        <div
          className="h-full rounded-full gradient-electric transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {steps.map((s) => (
          <li key={s.id}>
            <Link
              to={s.to as any}
              className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                s.done ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {s.done ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3 w-3 text-primary" />
                </span>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary" />
              )}
              <span className={s.done ? "line-through" : ""}>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
