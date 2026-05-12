import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export type IntakeKind = "founder-lesson" | "creator-playbook" | "product-launch" | "marketing-tip";

type Field = {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea";
  required?: boolean;
};

type IntakeConfig = {
  title: string;
  emoji: string;
  description: string;
  fields: Field[];
  defaultTypes: string[];
  buildPrompt: (values: Record<string, string>) => string;
};

const CONFIGS: Record<IntakeKind, IntakeConfig> = {
  "founder-lesson": {
    title: "Founder Lesson",
    emoji: "🚀",
    description: "Turn a lesson you learned into a thread, LinkedIn post, and email.",
    fields: [
      { name: "lesson", label: "What's the lesson?", placeholder: "e.g. Hiring slow saved my startup", required: true },
      { name: "story", label: "Quick story or context", placeholder: "What happened? When? What did you try?", type: "textarea", required: true },
      { name: "takeaway", label: "Practical takeaway for the reader", placeholder: "What should they do differently?", type: "textarea", required: true },
      { name: "audience", label: "Who is this for?", placeholder: "e.g. early-stage founders" },
    ],
    defaultTypes: ["thread", "linkedin", "email"],
    buildPrompt: (v) =>
      `FOUNDER LESSON CONTENT\n\nLesson: ${v.lesson}\n\nStory & context: ${v.story}\n\nPractical takeaway: ${v.takeaway}\n\nAudience: ${v.audience || "founders & operators"}\n\nWrite story-driven, vulnerable, specific content with concrete numbers/details from the story. Lead with a hook that creates curiosity. End with the takeaway as a memorable line.`,
  },
  "creator-playbook": {
    title: "Creator Playbook",
    emoji: "✍️",
    description: "Turn a content tip or playbook step into shareable posts.",
    fields: [
      { name: "topic", label: "What's the playbook about?", placeholder: "e.g. How to write hooks that convert", required: true },
      { name: "steps", label: "The steps or tips (one per line)", placeholder: "1. Open with a question\n2. Use specific numbers\n3. End with a CTA", type: "textarea", required: true },
      { name: "example", label: "A real example (optional)", placeholder: "Show, don't tell", type: "textarea" },
    ],
    defaultTypes: ["tweets", "linkedin", "instagram"],
    buildPrompt: (v) =>
      `CREATOR PLAYBOOK CONTENT\n\nTopic: ${v.topic}\n\nSteps/Tips:\n${v.steps}\n\n${v.example ? `Example: ${v.example}\n\n` : ""}Write punchy, actionable, numbered or bulleted content. Each piece should give real value in the first 5 seconds. Use strong hooks and concrete examples.`,
  },
  "product-launch": {
    title: "Product Launch",
    emoji: "🎉",
    description: "Announce a new product or feature with launch-ready copy.",
    fields: [
      { name: "product", label: "Product or feature name", placeholder: "e.g. PostSpark v2.0", required: true },
      { name: "what", label: "What it does (1-2 lines)", placeholder: "The core promise in plain words", type: "textarea", required: true },
      { name: "benefits", label: "Key benefits (one per line)", placeholder: "- 10x faster\n- No setup\n- Works everywhere", type: "textarea", required: true },
      { name: "audience", label: "Who is it for?", placeholder: "e.g. solo creators & agencies" },
      { name: "link", label: "Link or CTA", placeholder: "https://… or 'Try free →'" },
    ],
    defaultTypes: ["tweets", "linkedin", "email", "thread"],
    buildPrompt: (v) =>
      `PRODUCT LAUNCH ANNOUNCEMENT\n\nProduct: ${v.product}\n\nWhat it does: ${v.what}\n\nBenefits:\n${v.benefits}\n\nAudience: ${v.audience || "creators & teams"}\n\nCTA/Link: ${v.link || "include a clear next step"}\n\nWrite high-energy launch announcement copy. Lead with the transformation, not the feature. Include benefits, proof, and a clear CTA. Make it shareable.`,
  },
  "marketing-tip": {
    title: "Marketing Tip",
    emoji: "📈",
    description: "Repurpose a marketing insight into platform-native posts.",
    fields: [
      { name: "tip", label: "The marketing insight", placeholder: "e.g. Email open rates jump 40% when you use first-name in subject", required: true },
      { name: "why", label: "Why it works", placeholder: "The mechanism — what's happening psychologically?", type: "textarea", required: true },
      { name: "howTo", label: "How to apply it", placeholder: "Concrete steps the reader can take today", type: "textarea", required: true },
    ],
    defaultTypes: ["thread", "linkedin", "seo"],
    buildPrompt: (v) =>
      `MARKETING TIP CONTENT\n\nInsight: ${v.tip}\n\nWhy it works: ${v.why}\n\nHow to apply: ${v.howTo}\n\nWrite concise, data-aware, shareable marketing content. Lead with the surprising insight. Back it with the mechanism. Close with the actionable how-to.`,
  },
};

export function GuidedIntakeModal({
  kind,
  open,
  onClose,
}: {
  kind: IntakeKind | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setValues({});
  }, [open, kind]);

  if (!open || !kind) return null;
  const config = CONFIGS[kind];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = config.fields.filter((f) => f.required && !values[f.name]?.trim());
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    try {
      sessionStorage.setItem("postspark.import.text", config.buildPrompt(values));
      sessionStorage.setItem(
        "postspark.preset",
        JSON.stringify({ types: config.defaultTypes, guidance: "", title: config.title }),
      );
      sessionStorage.setItem("postspark.autorun", "1");
    } catch {}
    onClose();
    navigate({ to: "/dashboard/repurpose" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.emoji}</span>
            <div>
              <h2 className="text-base font-bold text-foreground">{config.title}</h2>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {config.fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.name] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <input
                  type="text"
                  value={values[f.name] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> We'll generate
            </p>
            <p className="mt-1 text-muted-foreground">
              {config.defaultTypes.join(" · ")} — tailored to {config.title.toLowerCase()}.
            </p>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-electric px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
          >
            Generate {config.title} Content <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
