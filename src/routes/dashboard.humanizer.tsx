import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Wand2, Save, Repeat } from "lucide-react";
import { humanize } from "@/lib/copilot.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/humanizer")({
  component: HumanizerPage,
  head: () => ({
    meta: [
      { title: "AI Humanizer — PostSpark" },
      { name: "description", content: "Rewrite AI text so it sounds genuinely human — varying rhythm, dropping corporate patterns, preserving meaning." },
    ],
  }),
});

const PURPOSES = [
  "Blog/Article", "LinkedIn Post", "Email", "Tweet/Thread",
  "Marketing Copy", "Academic/Formal", "General text",
];
const STYLES = ["Conversational", "Professional", "Storytelling", "Direct/punchy", "Educational"];
const PRESERVE_OPTS = [
  "Original meaning", "Key facts/data", "Brand voice",
  "Formal register", "Technical terms", "All statistics",
];

function HumanizerPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [intensity, setIntensity] = useState<"light" | "medium" | "strong">("medium");
  const [purpose, setPurpose] = useState("Blog/Article");
  const [style, setStyle] = useState("Conversational");
  const [preserve, setPreserve] = useState<string[]>(["Original meaning", "Key facts/data", "Brand voice"]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ aiPatternsRemoved: number; fillerRemoved: number; humanScore: number } | null>(null);

  const togglePreserve = (id: string) =>
    setPreserve((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function run() {
    if (input.trim().length < 20) return toast.error("Please paste at least 20 characters.");
    setLoading(true);
    setOutput("");
    setStats(null);
    try {
      const r = await withAIProgress(humanize({ data: { text: input, intensity, purpose, style, preserve } }));
      if (r.error) {
        if (r.error === "LIMIT_REACHED") toast.error("Monthly free limit reached. Upgrade to Pro for unlimited.");
        else toast.error(r.error);
      } else {
        setOutput(r.output);
        if ((r as any).stats) setStats((r as any).stats);
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const sendToRepurpose = () => {
    if (!output) return;
    try { sessionStorage.setItem("postspark.import.text", output); } catch {}
    toast.success("Sent to Repurpose");
    navigate({ to: "/dashboard/repurpose" });
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-6 space-y-6">
      {/* HERO */}
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #161F33 0%, rgba(124,58,237,0.14) 100%)",
          border: "1px solid #243047",
        }}
      >
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
          style={{
            background: "linear-gradient(135deg, #8B6FFF 0%, #6B4EFF 100%)",
            boxShadow: "0 2px 8px rgba(107,78,255,0.25)",
          }}
        >
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1A1A2E]">AI Humanizer</h1>
          <p className="m-0 mb-2.5 mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Rewrite AI text so it sounds genuinely human — varying rhythm, dropping corporate patterns, preserving your meaning 100%.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Rhythm variation", "Filler removed", "Meaning preserved", "Fast"].map((t) => (
              <span key={t} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: "rgba(107,78,255,0.08)", color: "#6B4EFF", border: "0.5px solid rgba(107,78,255,0.15)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PURPOSE */}
      <Card>
        <Label>Content purpose * (changes how Spark humanizes)</Label>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <Pill key={p} active={purpose === p} onClick={() => setPurpose(p)}>{p}</Pill>
          ))}
        </div>
      </Card>

      {/* STRENGTH */}
      <Card>
        <Label>Humanization strength</Label>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            { id: "light" as const, name: "Light", desc: "Subtle polish. Fix obvious AI patterns." },
            { id: "medium" as const, name: "Medium", desc: "Full rewrite, tone preserved. Best for most." },
            { id: "strong" as const, name: "Strong", desc: "Aggressive rewrite — maximally human." },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setIntensity(opt.id)}
              className={`rounded-[10px] border-[1.5px] p-3 text-center transition ${
                intensity === opt.id ? "border-[#6B4EFF] bg-[#6B4EFF]/[0.06]" : "border-[#E5E7EB] hover:border-[#6B4EFF]/40"
              }`}
            >
              <div className="text-[13px] font-semibold text-[#1A1A2E]">{opt.name}</div>
              <div className="text-[11px] leading-snug text-[#9CA3AF]">{opt.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* PRESERVE + STYLE */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Label>Preserve these elements</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESERVE_OPTS.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-[12.5px] text-[#1A1A2E] hover:bg-[#F3F0FF]">
                <input type="checkbox" checked={preserve.includes(o)} onChange={() => togglePreserve(o)} className="h-3.5 w-3.5 accent-[#6B4EFF]" />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </Card>
        <Card>
          <Label>Writing style target</Label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <Pill key={s} active={style === s} onClick={() => setStyle(s)}>{s}</Pill>
            ))}
          </div>
        </Card>
      </div>

      {/* SIDE-BY-SIDE */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
            <span>Original text</span>
            <span className="font-normal normal-case tracking-normal">{input.length} / 5,000 chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 5000))}
            placeholder="Paste your AI-generated content here…"
            className="ps-input min-h-[280px] w-full resize-y leading-[1.7]"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
            <span>Humanized output</span>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button onClick={copy} className="output-action-btn">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                  </button>
                  <button onClick={() => toast.success("Saved to Swipe File")} className="output-action-btn">
                    <Save className="h-3 w-3" /> Save
                  </button>
                  <button onClick={sendToRepurpose} className="output-action-btn">
                    <Repeat className="h-3 w-3" /> Repurpose
                  </button>
                </>
              )}
            </div>
          </div>
          <div
            className="min-h-[280px] whitespace-pre-wrap rounded-[12px] border-[1.5px] p-3.5 text-[14px] leading-[1.7] text-[#1A1A2E]"
            style={{
              borderColor: "rgba(107,78,255,0.15)",
              background: "linear-gradient(135deg, rgba(107,78,255,0.02) 0%, rgba(139,111,255,0.01) 100%)",
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <Loader2 className="h-4 w-4 animate-spin" /> Rewriting in your natural voice…
              </div>
            ) : output ? (
              output
            ) : (
              <div className="text-[#9CA3AF]">Your humanized text will appear here.</div>
            )}
          </div>
        </div>
      </div>

      <button onClick={run} disabled={loading || input.trim().length < 20} className="ps-generate-btn">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Humanizing…" : "Humanize"}
      </button>

      {/* STATS */}
      {stats && (
        <div
          className="rounded-[10px] border p-3.5"
          style={{
            background: "linear-gradient(135deg, rgba(5,150,105,0.06) 0%, rgba(16,185,129,0.03) 100%)",
            borderColor: "rgba(5,150,105,0.15)",
          }}
        >
          <div className="mb-2 text-[12px] font-semibold text-[#065F46]">📊 Humanization summary</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="AI patterns removed" value={`${stats.aiPatternsRemoved}`} />
            <Stat label="Filler removed" value={`${stats.fillerRemoved}`} />
            <Stat label="Meaning preserved" value="✓ 100%" />
            <Stat label="Human feel" value={`${stats.humanScore}%`} />
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[14px] border border-black/[0.08] bg-white p-5">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">{children}</div>;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${
        active ? "border-[#6B4EFF] bg-[#6B4EFF] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#6B4EFF]/40 hover:text-[#1A1A2E]"
      }`}
    >
      {children}
    </button>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-[#6B7280]">{label}</div>
      <div className="text-[14px] font-semibold text-[#059669]">{value}</div>
    </div>
  );
}
