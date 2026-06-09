import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Flame, Loader2, Copy, Check, Sparkles, Repeat, ClipboardCopy,
  Trophy, HelpCircle, BarChart3, Zap, BookOpen, FileQuestion, Target,
  Lightbulb, AlertTriangle, ListOrdered, Eye, Save,
} from "lucide-react";
import { generateHooks } from "@/lib/hookLab.functions";
import { withAIProgress } from "@/lib/aiProgress";

interface Hook {
  framework: string;
  text: string;
  score: number;
  why: string;
}

export const Route = createFileRoute("/dashboard/hook-lab")({
  component: HookLabPage,
});

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "threads", label: "Threads" },
  { id: "facebook", label: "Facebook" },
] as const;

const NICHES = [
  "SaaS/Tech", "Marketing", "E-commerce", "Finance", "Fitness/Health",
  "Personal Development", "Creator/Media", "Real Estate", "Education",
  "B2B Services", "Coaching", "Other",
];

const FRAMEWORK_OPTIONS = [
  { id: "Question", icon: HelpCircle, label: "Question hook" },
  { id: "Stat", icon: BarChart3, label: "Stat/Data hook" },
  { id: "Bold Claim", icon: Zap, label: "Bold statement" },
  { id: "Story", icon: BookOpen, label: "Story opener" },
  { id: "Contrarian", icon: FileQuestion, label: "Contrarian/Myth" },
  { id: "Specific Outcome", icon: Target, label: "Specific outcome" },
  { id: "Insight Reveal", icon: Lightbulb, label: "Insight reveal" },
  { id: "Warning/Mistake", icon: AlertTriangle, label: "Warning/Mistake" },
  { id: "Numbered List", icon: ListOrdered, label: "Numbered list" },
  { id: "Curiosity Gap", icon: Eye, label: "Curiosity gap" },
];

const TONES = ["Direct/Raw", "Professional", "Casual", "Provocative", "Educational", "Storytelling"];

function HookLabPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("SaaS/Tech");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("twitter");
  const [format, setFormat] = useState<"text" | "spoken" | "both">("text");
  const [frameworks, setFrameworks] = useState<string[]>(FRAMEWORK_OPTIONS.map((f) => f.id));
  const [tone, setTone] = useState("Direct/Raw");
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [abA, setAbA] = useState<number | null>(null);
  const [abB, setAbB] = useState<number | null>(null);

  const toggleFramework = (id: string) =>
    setFrameworks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic (3+ chars)");
    if (audience.trim().length < 3) return toast.error("Add a target audience");
    if (frameworks.length === 0) return toast.error("Select at least one framework");
    setLoading(true);
    setHooks([]);
    setAbA(null); setAbB(null);
    try {
      const res = await withAIProgress(generateHooks({
        data: {
          topic: topic.trim(),
          platform,
          niche,
          audience: audience.trim(),
          format,
          frameworks,
          tone,
        },
      }));
      if (res.error) {
        toast.error(res.error);
      } else if (res.hooks.length === 0) {
        toast.error("No hooks generated. Try a different topic.");
      } else {
        setHooks(res.hooks as Hook[]);
        toast.success(`${res.hooks.length} viral hooks ready`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyAll = () => {
    const txt = hooks.map((h, i) => `${i + 1}. ${h.text}  (${h.framework})`).join("\n");
    navigator.clipboard.writeText(txt);
    setCopiedAll(true);
    toast.success("All hooks copied");
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const sendToRepurpose = (text: string) => {
    try { sessionStorage.setItem("postspark.import.text", text); } catch {}
    toast.success("Hook sent to Repurpose");
    navigate({ to: "/dashboard/repurpose" });
  };

  const filteredHooks = hooks.filter((h) => {
    if (filter === "all") return true;
    return h.framework.toLowerCase().includes(filter.toLowerCase());
  });

  const filters = ["all", ...Array.from(new Set(hooks.map((h) => h.framework.split(/[+,/]/)[0].trim())))];

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-6 space-y-6">
      {/* HERO HEADER */}
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #FAFAF8 0%, #F3F0FF 100%)",
          border: "0.5px solid rgba(107,78,255,0.12)",
        }}
      >
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
          style={{
            background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
            boxShadow: "0 2px 8px rgba(249,115,22,0.25)",
          }}
        >
          <Flame className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1A1A2E]">Viral Hook Lab</h1>
          <p className="m-0 mb-2.5 mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Generate 20 scroll-stopping hooks using proven viral frameworks. Scored, ranked, and platform-native.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["20 hooks", "Scored & ranked", "Platform-native", "A/B ready"].map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(107,78,255,0.08)",
                  color: "#6B4EFF",
                  border: "0.5px solid rgba(107,78,255,0.15)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TOPIC */}
      <Card>
        <Label>Your topic</Label>
        <div className="space-y-3">
          <div>
            <SubLabel>Topic or angle *</SubLabel>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="e.g. Why most SaaS founders fail at pricing"
              className="ps-input w-full"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <SubLabel>Your niche / industry *</SubLabel>
              <select value={niche} onChange={(e) => setNiche(e.target.value)} className="ps-input w-full">
                {NICHES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <SubLabel>Target audience *</SubLabel>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. early-stage startup founders"
                className="ps-input w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* PLATFORM + FORMAT */}
      <Card>
        <Label>Platform & format</Label>
        <SubLabel>Platform * (hooks are engineered for each platform's algorithm)</SubLabel>
        <div className="mb-4 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Pill key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>
              {p.label}
            </Pill>
          ))}
        </div>
        <SubLabel>Hook format *</SubLabel>
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            { id: "text", label: "Text hooks", desc: "Posts, captions, threads" },
            { id: "spoken", label: "Spoken hooks", desc: "Video, reels, shorts" },
            { id: "both", label: "Both", desc: "10 text + 10 spoken" },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`rounded-[10px] border-[1.5px] p-3 text-left transition ${
                format === f.id ? "border-[#6B4EFF] bg-[#6B4EFF]/[0.06]" : "border-[#E5E7EB] hover:border-[#6B4EFF]/40"
              }`}
            >
              <div className="text-[13px] font-semibold text-[#1A1A2E]">{f.label}</div>
              <div className="text-[11px] text-[#9CA3AF]">{f.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* FRAMEWORKS */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Label className="!mb-0">Hook frameworks to include</Label>
          <button
            onClick={() => setFrameworks(frameworks.length === FRAMEWORK_OPTIONS.length ? [] : FRAMEWORK_OPTIONS.map((f) => f.id))}
            className="text-[11px] font-medium text-[#6B4EFF] hover:underline"
          >
            {frameworks.length === FRAMEWORK_OPTIONS.length ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FRAMEWORK_OPTIONS.map((f) => {
            const Icon = f.icon;
            const active = frameworks.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleFramework(f.id)}
                className={`flex items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-2 text-left text-[12.5px] transition ${
                  active ? "border-[#6B4EFF] bg-[#6B4EFF]/[0.06] text-[#1A1A2E]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#6B4EFF]/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* TONE */}
      <Card>
        <Label>Tone</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <Pill key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Pill>
          ))}
        </div>
      </Card>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="ps-generate-btn"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Cooking 20 viral hooks…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate 20 Viral Hooks</>
        )}
      </button>

      {hooks.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <p className="text-xs text-[#6B7280]">
              ✓ {hooks.length} hooks generated for "{topic}" — ranked by viral potential
            </p>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#6B4EFF] hover:text-[#6B4EFF]"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              Copy all
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {filters.slice(0, 7).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                  filter === f
                    ? "bg-[#1A1A2E] text-white"
                    : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                }`}
              >
                {f === "all" ? `All (${hooks.length})` : f}
              </button>
            ))}
          </div>

          {/* Hook cards */}
          <div className="space-y-2.5">
            {filteredHooks.map((h, i) => {
              const isTop = i === 0 && filter === "all";
              const scoreColor = h.score >= 9 ? "#059669" : h.score >= 8 ? "#0EA5E9" : "#D97706";
              return (
                <div
                  key={i}
                  className="rounded-xl border-[1.5px] p-4 transition hover:shadow-md"
                  style={{
                    borderColor: isTop ? "rgba(107,78,255,0.3)" : "#E5E7EB",
                    background: isTop ? "linear-gradient(135deg, #FAFAF8 0%, #F3F0FF 100%)" : "white",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[#9CA3AF]">#{i + 1}</span>
                    <span className="text-[12px] font-bold" style={{ color: scoreColor }}>
                      Score: {h.score.toFixed(1)}/10
                    </span>
                    {isTop && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#6B4EFF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6B4EFF]">
                        <Trophy className="h-2.5 w-2.5" /> Top hook
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <IconBtn onClick={() => sendToRepurpose(h.text)} title="Send to Repurpose"><Repeat className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn onClick={() => copy(h.text, i)} title="Copy">
                        {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </IconBtn>
                      <IconBtn onClick={() => toast.success("Saved to Swipe File")} title="Save"><Save className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </div>
                  <p className="my-2 text-[14px] leading-relaxed text-[#1A1A2E]">{h.text}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block rounded-[10px] bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">
                      {h.framework}
                    </span>
                    <span className="text-[11px] italic text-[#9CA3AF]">{h.why}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* A/B test picker */}
          <Card>
            <Label>A/B test picker</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={abA ?? ""} onChange={(e) => setAbA(e.target.value ? Number(e.target.value) : null)} className="ps-input w-full">
                <option value="">Pick hook A…</option>
                {hooks.map((h, i) => <option key={i} value={i}>#{i + 1} — {h.text.slice(0, 60)}…</option>)}
              </select>
              <select value={abB ?? ""} onChange={(e) => setAbB(e.target.value ? Number(e.target.value) : null)} className="ps-input w-full">
                <option value="">Pick hook B…</option>
                {hooks.map((h, i) => <option key={i} value={i}>#{i + 1} — {h.text.slice(0, 60)}…</option>)}
              </select>
            </div>
            {abA !== null && abB !== null && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`A: ${hooks[abA].text}\n\nB: ${hooks[abB].text}`);
                  toast.success("Both hooks copied for A/B testing");
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#6B4EFF] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#5B3FEF]"
              >
                <Copy className="h-3.5 w-3.5" /> Copy both for A/B test
              </button>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-black/[0.08] bg-white p-5 transition focus-within:border-[#6B4EFF]/20 focus-within:shadow-[0_0_0_3px_rgba(107,78,255,0.08)]">
      {children}
    </div>
  );
}
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] ${className}`}>
      {children}
    </div>
  );
}
function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-medium text-[#6B7280]">{children}</div>;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${
        active
          ? "border-[#6B4EFF] bg-[#6B4EFF] text-white"
          : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#6B4EFF]/40 hover:text-[#1A1A2E]"
      }`}
    >
      {children}
    </button>
  );
}
function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="rounded-md p-1 text-[#9CA3AF] transition hover:bg-[#F3F0FF] hover:text-[#6B4EFF]">
      {children}
    </button>
  );
}
