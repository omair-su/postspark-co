import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Layers, Copy, Check, Lock, Download, ArrowLeft, FolderOpen, Trash2 } from "lucide-react";
import { generateShortsSeries, getShortsUsage } from "@/lib/shorts.functions";
import { listShortsSeries, loadShortsSeries, deleteShortsSeries } from "@/lib/shortsSeries.functions";
import { withAIProgress } from "@/lib/aiProgress";
import type { ShortsScript } from "@/server/shorts.server";

export const Route = createFileRoute("/dashboard/shorts-series")({
  component: ShortsSeriesPage,
});

const PLATFORMS = [
  { id: "tiktok" as const, label: "TikTok" },
  { id: "shorts" as const, label: "YouTube Shorts" },
  { id: "reels" as const, label: "Instagram Reels" },
];
const DURATIONS = [30, 45, 60] as const;

function ShortsSeriesPage() {
  const { session } = useAuth();
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "shorts" | "reels">("tiktok");
  const [duration, setDuration] = useState<30 | 45 | 60>(45);
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<ShortsScript[] | null>(null);
  const [tab, setTab] = useState(0);
  const [plan, setPlan] = useState<string>("free");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isPro = plan === "pro" || plan === "agency";

  useEffect(() => {
    if (session) getShortsUsage().then((u: any) => setPlan(u?.plan || "free")).catch(() => {});
  }, [session]);

  const run = async () => {
    if (!session) return toast.error("Please sign in");
    if (input.trim().length < 20) return toast.error("Paste at least a paragraph of source content");
    setLoading(true); setScripts(null); setErr(null); setTab(0);
    try {
      const res: any = await withAIProgress(generateShortsSeries({
        data: { inputText: input.trim(), platform, duration },
      }));
      if (res.error === "PRO_REQUIRED") {
        setErr("Series Mode is a Pro feature.");
      } else if (res.error) {
        setErr(res.error); toast.error(res.error);
      } else if (res.scripts?.length) {
        setScripts(res.scripts);
        toast.success(`5 episode scripts ready`);
      }
    } catch (e: any) {
      setErr(e?.message || "Generation failed"); toast.error(e?.message || "Failed");
    } finally { setLoading(false); }
  };

  const copyAll = () => {
    if (!scripts) return;
    const block = scripts.map((s, i) => [
      `═══ EPISODE ${i + 1} ═══`,
      `TITLE: ${s.title}`,
      `HOOK: ${s.hooks[0]?.text || ""}`,
      ``,
      ...s.shots.map((sh) => `[${sh.timestamp}] VO: ${sh.voiceover}\n  ON-SCREEN: ${sh.on_screen_caption}\n  B-ROLL: ${sh.b_roll}`),
      ``,
      `CTA: ${s.cta}`,
      `HASHTAGS: ${s.hashtags.map((h) => `#${h}`).join(" ")}`,
      ``,
    ].join("\n")).join("\n");
    navigator.clipboard.writeText(block);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    toast.success("All 5 scripts copied");
  };

  const downloadAll = () => {
    if (!scripts) return;
    const block = scripts.map((s, i) =>
      `═══ EPISODE ${i + 1} — ${s.title} ═══\n\nHOOK: ${s.hooks[0]?.text}\n\n${
        s.shots.map((sh) => `[${sh.timestamp}]\nVO: ${sh.voiceover}\nON-SCREEN: ${sh.on_screen_caption}\nB-ROLL: ${sh.b_roll}`).join("\n\n")
      }\n\nCTA: ${s.cta}\nHASHTAGS: ${s.hashtags.map((h) => `#${h}`).join(" ")}\n\n`
    ).join("\n");
    const blob = new Blob([block], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `series-${platform}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const active = scripts?.[tab];

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-6 space-y-6">
      <Link to="/dashboard/shorts-studio" className="inline-flex items-center gap-1.5 text-[12px] text-[#6B7280] hover:text-[#7C3AED]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Shorts Studio
      </Link>

      <div className="flex items-start gap-4 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, #FAFAF8 0%, #F3F0FF 100%)", border: "0.5px solid rgba(107,78,255,0.12)" }}>
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
          <Layers className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1A1A2E]">Series Mode</h1>
            <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] border border-[#7C3AED]/25">Pro</span>
          </div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            One source → 5 episodic scripts with built-in cliffhangers. A week of content from a single paste.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Source content</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6}
          placeholder="Paste a blog post, transcript, or detailed idea…"
          className="ps-input w-full" />
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Platform</label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${
                    platform === p.id ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#7C3AED]/40"
                  }`}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${
                    duration === d ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#7C3AED]/40"
                  }`}>{d}s</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isPro ? (
        <div className="rounded-2xl border border-[#FCD34D] bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#B45309]" />
            <p className="text-[14px] font-bold text-[#92400E]">Series Mode is a Pro feature</p>
          </div>
          <p className="mt-1 text-[13px] text-[#B45309]">Generate 5 connected episode scripts per source, unlimited.</p>
          <Link to="/dashboard/billing" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#6D28D9]">
            <Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro — $19/mo
          </Link>
        </div>
      ) : (
        <button onClick={run} disabled={loading} className="ps-generate-btn">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating 5 episodes…</> : <><Sparkles className="h-4 w-4" /> Generate 5-Episode Series</>}
        </button>
      )}

      {err && !err.includes("PRO_REQUIRED") && (
        <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-[13px] text-[#7F1D1D]">{err}</div>
      )}

      {scripts && active && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] p-1">
              {scripts.map((_, i) => (
                <button key={i} onClick={() => setTab(i)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
                    tab === i ? "bg-white text-[#1A1A2E] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A2E]"
                  }`}>Ep {i + 1}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={copyAll} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy all 5
              </button>
              <button onClick={downloadAll} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
                <Download className="h-3.5 w-3.5" /> .txt bundle
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">Episode {tab + 1}</p>
              <h2 className="mt-1 text-[20px] font-bold text-[#1A1A2E]">{active.title}</h2>
              <p className="mt-1 text-[13px] text-[#6B7280]">{active.description}</p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Hooks (pick one)</p>
              <div className="space-y-2">
                {active.hooks.map((h, i) => (
                  <div key={i} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-3">
                    <div className="flex items-start gap-2">
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">{h.score}/100</span>
                      <p className="flex-1 text-[14px] text-[#1A1A2E]">{h.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Shot list</p>
              <div className="space-y-2">
                {active.shots.map((s, i) => (
                  <div key={i} className="rounded-lg border border-[#E5E7EB] p-3">
                    <span className="rounded-md bg-[#1A1A2E] px-1.5 py-0.5 text-[10px] font-bold text-white">{s.timestamp}</span>
                    <p className="mt-1.5 text-[13px] text-[#1A1A2E]"><strong className="text-[11px] uppercase text-[#6B7280]">VO</strong> {s.voiceover}</p>
                    <p className="mt-1 text-[13px] text-[#1A1A2E]"><strong className="text-[11px] uppercase text-[#6B7280]">On-screen</strong> {s.on_screen_caption}</p>
                    <p className="mt-1 text-[12px] italic text-[#6B7280]"><strong className="not-italic text-[11px] uppercase">B-roll</strong> {s.b_roll}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-[#F3F0FF] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">CTA</p>
              <p className="text-[13px] text-[#1A1A2E]">{active.cta}</p>
            </div>

            <p className="text-[12px] text-[#7C3AED]">{active.hashtags.map((h) => `#${h}`).join(" ")}</p>
          </div>
        </>
      )}
    </div>
  );
}
