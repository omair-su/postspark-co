import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MessageSquare,
  Loader2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Bookmark,
  Edit3,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Music2,
  AtSign,
} from "lucide-react";
import { replies as repliesFn } from "@/lib/copilot.functions";
import { saveToSwipeFn } from "@/lib/guidedStudios.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/reply-generator")({
  component: ReplyGeneratorPage,
  head: () => ({
    meta: [
      { title: "AI Reply Generator — PostSpark" },
      { name: "description", content: "Generate sharp, on-brand replies for any tweet, LinkedIn comment, or post — in your voice." },
    ],
  }),
});

type PlatformId = "twitter" | "linkedin" | "instagram" | "facebook" | "tiktok" | "threads";

const platforms: { id: PlatformId; label: string; Icon: any; color: string; limit: number }[] = [
  { id: "twitter", label: "X / Twitter", Icon: Twitter, color: "#1DA1F2", limit: 280 },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2", limit: 500 },
  { id: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C", limit: 150 },
  { id: "facebook", label: "Facebook", Icon: Facebook, color: "#1877F2", limit: 400 },
  { id: "tiktok", label: "TikTok", Icon: Music2, color: "#000000", limit: 150 },
  { id: "threads", label: "Threads", Icon: AtSign, color: "#101010", limit: 500 },
];

const goals = [
  "Add value & insight",
  "Ask a thoughtful question",
  "Agree & amplify",
  "Respectfully disagree",
  "Share your experience",
  "Build rapport / be funny",
  "Promote your brand subtly",
  "Show expertise",
] as const;

const tones = [
  "Conversational",
  "Professional",
  "Bold / Confident",
  "Empathetic",
  "Witty / Playful",
  "Use my Brand Voice",
] as const;

const lengths = [
  { id: "short", label: "Short", hint: "1-2 lines" },
  { id: "medium", label: "Medium", hint: "3-4 lines" },
  { id: "long", label: "Long", hint: "5+ lines" },
] as const;

type Reply = { text: string; score: number; goal: string };

function ReplyGeneratorPage() {
  const [post, setPost] = useState("");
  const [platform, setPlatform] = useState<PlatformId>("twitter");
  const [goal, setGoal] = useState<string>(goals[0]);
  const [tone, setTone] = useState<string>(tones[0]);
  const [length, setLength] = useState<"short" | "medium" | "long">("short");
  const [count, setCount] = useState(5);
  const [addCta, setAddCta] = useState(false);
  const [ctaText, setCtaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<Reply[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const platformMeta = platforms.find((p) => p.id === platform)!;

  async function run(append = false) {
    if (post.trim().length < 5) {
      toast.error("Paste a post or comment first.");
      return;
    }
    setLoading(true);
    if (!append) setOut([]);
    try {
      const r: any = await withAIProgress(repliesFn({
        data: {
          originalPost: post,
          goal,
          platform,
          tone,
          length,
          count,
          addCta,
          ctaText: addCta ? ctaText : undefined,
          useBrandVoice: tone === "Use my Brand Voice",
        },
      }));
      if (r.error) {
        if (r.error === "LIMIT_REACHED") toast.error("Monthly free limit reached. Upgrade to Pro for unlimited.");
        else toast.error(r.error);
      } else {
        setOut((prev) => (append ? [...prev, ...r.replies] : r.replies));
        if (append) toast.success(`${r.replies.length} more replies generated`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(idx: number, txt: string) {
    await navigator.clipboard.writeText(txt);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  async function copyAll() {
    const txt = filtered.map((r, i) => `${i + 1}. ${r.text}`).join("\n\n");
    await navigator.clipboard.writeText(txt);
    toast.success(`Copied ${filtered.length} replies`);
  }

  async function regenerateOne(idx: number) {
    // Quick regen: ask for 1 extra and replace this one
    setLoading(true);
    try {
      const r: any = await withAIProgress(repliesFn({
        data: {
          originalPost: post,
          goal: out[idx].goal || goal,
          platform,
          tone,
          length,
          count: 3,
          useBrandVoice: tone === "Use my Brand Voice",
        },
      }));
      if (r.replies?.[0]) {
        setOut((prev) => prev.map((x, i) => (i === idx ? r.replies[0] : x)));
        toast.success("Reply regenerated");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveBest() {
    const best = [...out].sort((a, b) => b.score - a.score)[0];
    if (!best) return;
    const r = await saveToSwipeFn({
      data: {
        type: "reply",
        title: `Reply — ${platform} — ${best.goal}`.slice(0, 200),
        platform,
        content: best.text,
        metadata: { score: best.score, goal: best.goal, originalPost: post.slice(0, 500) },
      },
    });
    if (r.success) toast.success("Best reply saved to Swipe File");
    else toast.error("Couldn't save");
  }

  function updateReply(idx: number, text: string) {
    setOut((prev) => prev.map((x, i) => (i === idx ? { ...x, text } : x)));
  }

  const filtered = useMemo(() => {
    if (filter === "all") return out;
    return out.filter((r) => r.goal.toLowerCase() === filter.toLowerCase());
  }, [out, filter]);

  const uniqueGoals = useMemo(() => Array.from(new Set(out.map((r) => r.goal))), [out]);
  const bestIdx = useMemo(() => {
    if (out.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < out.length; i++) if (out[i].score > out[best].score) best = i;
    return best;
  }, [out]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Hero */}
      <header className="rg-hero">
        <div className="flex items-start gap-3">
          <div className="rg-hero-badge">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A2E]">AI Reply Generator</h1>
            <p className="text-sm md:text-base text-[#4B5563] mt-1">
              Drop in any post and get sharp, on-brand replies in your voice.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Multiple variations", "Platform-native", "Brand voice", "Copy-ready"].map((c) => (
                <span key={c} className="rg-chip">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* INPUT */}
      <div className="rg-card">
        <label className="rg-label">Original post / comment <span className="text-rose-500">*</span></label>
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value.slice(0, 2000))}
          placeholder="Paste the tweet, LinkedIn post, or comment you want to reply to…"
          className="rg-textarea"
        />
        <div className="text-xs text-[#9CA3AF] text-right mt-1">{post.length} / 2,000 chars</div>
      </div>

      {/* PLATFORM */}
      <div className="rg-card">
        <label className="rg-label">Platform <span className="text-rose-500">*</span></label>
        <div className="flex flex-wrap gap-2 mt-2">
          {platforms.map((p) => {
            const active = p.id === platform;
            const Icon = p.Icon;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`rg-pill ${active ? "rg-pill-active" : ""}`}
                style={active ? { borderColor: p.color, color: p.color, background: `${p.color}10` } : undefined}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GOAL */}
      <div className="rg-card">
        <label className="rg-label">What's the goal of this reply? <span className="text-rose-500">*</span></label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {goals.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`rg-goal-card ${goal === g ? "rg-goal-card-active" : ""}`}
              type="button"
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* TONE + LENGTH + COUNT */}
      <div className="rg-card space-y-4">
        <div>
          <label className="rg-label">Reply tone</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {tones.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`rg-pill ${tone === t ? "rg-pill-active" : ""}`}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="rg-label">Reply length</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {lengths.map((l) => (
              <button
                key={l.id}
                onClick={() => setLength(l.id)}
                className={`rg-pill ${length === l.id ? "rg-pill-active" : ""}`}
                type="button"
              >
                {l.label} <span className="opacity-60 ml-1">· {l.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="rg-label">Number of variations</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[3, 5, 8, 10].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`rg-pill ${count === n ? "rg-pill-active" : ""}`}
                type="button"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#1A1A2E]">
            <input
              type="checkbox"
              checked={addCta}
              onChange={(e) => setAddCta(e.target.checked)}
              className="h-4 w-4 rounded accent-[#6B4EFF]"
            />
            Add a CTA — include a subtle link / mention in one reply
          </label>
          {addCta && (
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g. 'I wrote about this at postspark.co/blog/...'"
              className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-sm focus:outline-none focus:border-[#6B4EFF]"
            />
          )}
        </div>
      </div>

      {/* GENERATE */}
      <div className="flex justify-end">
        <button
          onClick={() => run(false)}
          disabled={loading || post.trim().length < 5}
          className="rg-btn-primary"
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Replies
        </button>
      </div>

      {/* OUTPUT */}
      {out.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A2E]">
              <Check className="h-4 w-4 text-emerald-500" />
              {out.length} replies generated for {platformMeta.label}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilter("all")} className={`rg-tab ${filter === "all" ? "rg-tab-active" : ""}`}>
                All ({out.length})
              </button>
              {uniqueGoals.map((g) => (
                <button key={g} onClick={() => setFilter(g)} className={`rg-tab ${filter === g ? "rg-tab-active" : ""}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((r, i) => {
              const realIdx = out.indexOf(r);
              const isBest = realIdx === bestIdx;
              const overLimit = r.text.length > platformMeta.limit;
              return (
                <div key={realIdx} className={`rg-reply-card ${isBest ? "rg-reply-card-best" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#6B4EFF]">Reply {realIdx + 1}</span>
                      <span className="rg-score">Score: {r.score.toFixed(1)}/10</span>
                      {isBest && <span className="rg-best-badge">Best match</span>}
                    </div>
                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">{r.goal}</span>
                  </div>

                  {editingIdx === realIdx ? (
                    <textarea
                      value={r.text}
                      onChange={(e) => updateReply(realIdx, e.target.value)}
                      onBlur={() => setEditingIdx(null)}
                      autoFocus
                      className="w-full min-h-[80px] text-sm rounded-lg border border-[#6B4EFF]/40 bg-white p-2.5 focus:outline-none focus:border-[#6B4EFF]"
                    />
                  ) : (
                    <p className="text-[14px] leading-[1.65] text-[#1A1A2E] whitespace-pre-wrap">{r.text}</p>
                  )}

                  <div className="rg-reply-footer">
                    <span className={`text-[11px] mr-auto ${overLimit ? "text-rose-500 font-medium" : "text-[#9CA3AF]"}`}>
                      {r.text.length} chars{overLimit ? ` · over ${platformMeta.limit}` : ""}
                    </span>
                    <button onClick={() => copy(realIdx, r.text)} className="rg-mini-btn" type="button">
                      {copiedIdx === realIdx ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedIdx === realIdx ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => setEditingIdx(editingIdx === realIdx ? null : realIdx)} className="rg-mini-btn" type="button">
                      <Edit3 className="h-3.5 w-3.5" />
                      {editingIdx === realIdx ? "Done" : "Edit"}
                    </button>
                    <button onClick={() => regenerateOne(realIdx)} className="rg-mini-btn" type="button" disabled={loading}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                      Regenerate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={copyAll} className="rg-btn-secondary" type="button">
              <Copy className="h-4 w-4" /> Copy All
            </button>
            <button onClick={() => run(true)} className="rg-btn-secondary" type="button" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Generate {count} More
            </button>
            <button onClick={saveBest} className="rg-btn-secondary" type="button">
              <Bookmark className="h-4 w-4" /> Save Best to Swipe File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
