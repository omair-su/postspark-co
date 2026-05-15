import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { replies as repliesFn } from "@/lib/copilot.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/reply-generator")({
  component: ReplyGeneratorPage,
  head: () => ({
    meta: [
      { title: "AI Reply Generator — PostSpark" },
      { name: "description", content: "Generate 5 on-brand reply options for any tweet, LinkedIn comment, or post." },
    ],
  }),
});

const platforms = [
  { id: "twitter", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
] as const;

const goalPresets = [
  "Be agreeable and add value",
  "Politely disagree with a fresh angle",
  "Ask a thoughtful follow-up question",
  "Be witty and make them smile",
  "Promote my own related work subtly",
];

function ReplyGeneratorPage() {
  const [post, setPost] = useState("");
  const [goal, setGoal] = useState(goalPresets[0]);
  const [platform, setPlatform] = useState<typeof platforms[number]["id"]>("twitter");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function run() {
    if (post.trim().length < 5) {
      toast.error("Paste a post or comment first.");
      return;
    }
    setLoading(true);
    setOut([]);
    try {
      const r = await withAIProgress(repliesFn({ data: { originalPost: post, goal, platform } }));
      if (r.error) {
        if (r.error === "LIMIT_REACHED") toast.error("Monthly free limit reached. Upgrade to Pro for unlimited.");
        else toast.error(r.error);
      } else setOut(r.replies);
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(idx: number, txt: string) {
    await navigator.clipboard.writeText(txt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-electric" />
          AI Reply Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Drop in any post and get 5 sharp, on-brand reply options in your voice.
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <label className="text-sm font-medium">Original post / comment</label>
          <textarea
            value={post}
            onChange={(e) => setPost(e.target.value)}
            placeholder="Paste the tweet, LinkedIn post, or comment you want to reply to…"
            className="mt-1 w-full min-h-[140px] rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric/40"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
            >
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Goal</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              list="goal-presets"
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
            />
            <datalist id="goal-presets">
              {goalPresets.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading || post.trim().length < 5}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric to-electric/80 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate replies
        </button>
      </div>

      {out.length > 0 && (
        <div className="space-y-3">
          {out.map((r, i) => (
            <div key={i} className="group rounded-xl border border-border bg-card p-4 flex gap-3">
              <div className="text-xs font-bold text-electric shrink-0 mt-0.5">#{i + 1}</div>
              <div className="flex-1 text-sm whitespace-pre-wrap">{r}</div>
              <button
                onClick={() => copy(i, r)}
                className="p-2 rounded-lg hover:bg-muted shrink-0"
                aria-label="Copy"
              >
                {copiedIdx === i ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
