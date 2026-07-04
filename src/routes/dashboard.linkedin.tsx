import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Linkedin, Sparkles, Wand2, Copy, Check } from "lucide-react";
import { PostToLinkedInButton } from "@/components/PostToLinkedInButton";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Composer — PostSpark" },
      { name: "description", content: "Draft, format and publish LinkedIn posts directly from PostSpark." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LinkedInComposerPage,
});

const TEMPLATES: { id: string; name: string; emoji: string; body: string }[] = [
  {
    id: "thought-leadership",
    name: "Thought Leadership",
    emoji: "💡",
    body:
      "The best {topic} advice I ever got wasn't advice.\n\nIt was a question:\n\n\"What would you do if you weren't afraid?\"\n\nHere's what changed after I answered honestly:\n\n→ …\n→ …\n→ …\n\nWhat's the question that changed your career?",
  },
  {
    id: "launch",
    name: "Launch Announcement",
    emoji: "🚀",
    body:
      "After {timeframe} of building in silence, today we're shipping {product}.\n\nThe problem: …\nOur take: …\nWhat's inside: …\n\nGrateful to everyone who tested early. If this sounds useful, would love your feedback in the comments.",
  },
  {
    id: "hiring",
    name: "We're Hiring",
    emoji: "👥",
    body:
      "We're hiring a {role} at {company}.\n\nWhat you'll do:\n→ …\n→ …\n→ …\n\nWho we're looking for:\n→ …\n→ …\n\nRemote-friendly. Great team. Real impact. DM me or drop a 🙋 below.",
  },
  {
    id: "milestone",
    name: "Milestone",
    emoji: "🏆",
    body:
      "{milestone} today.\n\nA year ago this felt impossible.\n\nThree things that made the difference:\n\n1. …\n2. …\n3. …\n\nOnwards. 🚀",
  },
  {
    id: "story",
    name: "Personal Story",
    emoji: "📖",
    body:
      "5 years ago I …\n\nToday I …\n\nHere's what nobody tells you about the messy middle:\n\n→ …\n→ …\n→ …\n\nIf you're in the middle, keep going.",
  },
];

function LinkedInComposerPage() {
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const chars = content.length;
  const hashtags = (content.match(/#\w+/g) || []).length;
  const emojis = (content.match(/\p{Extended_Pictographic}/gu) || []).length;
  const lines = content.split("\n").length;

  const applyTemplate = (body: string) => {
    setContent(body);
    toast.success("Template loaded — customize the bracketed parts");
  };

  const suggestHashtags = () => {
    const common = ["#Leadership", "#Marketing", "#Startups", "#AI", "#SaaS"];
    setContent((c) => c.trim() + "\n\n" + common.slice(0, 3).join(" "));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2]/10">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">LinkedIn Composer</h1>
          <p className="text-xs text-muted-foreground">
            Draft high-performing posts. Publish or save as draft in one click.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Your post</label>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{chars} / 3000</span>
              <span>{lines} lines</span>
              <span>{hashtags} tags</span>
              <span>{emojis} emojis</span>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 3000))}
            rows={16}
            placeholder="Start typing, or pick a template on the right →"
            className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PostToLinkedInButton
              content={content}
              label="Publish to LinkedIn"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0956a8] disabled:opacity-50"
            />
            <button
              onClick={copy}
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
            </button>
            <button
              onClick={suggestHashtags}
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" /> Suggest hashtags
            </button>
          </div>

          {chars > 0 && (
            <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Live preview
              </p>
              <div className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm text-foreground">
                {content}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0A66C2]" />
            <h2 className="text-sm font-semibold text-foreground">Templates</h2>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Proven post structures. Click to load, then customize.
          </p>
          <div className="mt-3 space-y-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.body)}
                className="w-full rounded-lg border border-border bg-background p-3 text-left hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{t.emoji}</span> {t.name}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                  {t.body.split("\n")[0]}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
            💡 Tip: Posts with 3+ line breaks and 1200–1800 chars typically get the best reach on LinkedIn.
          </div>
        </aside>
      </div>
    </div>
  );
}
