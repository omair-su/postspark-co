import { useState } from "react";
import { toast } from "sonner";
import { Beaker, Loader2, RefreshCw, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { repurposeContent, type RepurposeResult } from "@/lib/repurpose.functions";
import { scoreContentAgainstVoice } from "@/lib/brandVoice.functions";

interface Props {
  activeVoiceId: string | null;
}

/**
 * Sticky right-side test bench — generates a sample using the active
 * kit + voice + guardrails, then scores the match.
 */
export function LiveTestBench({ activeVoiceId }: Props) {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<"tweets" | "linkedin" | "video">("linkedin");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const auth = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;

  const run = async () => {
    if (!auth) return;
    if (!activeVoiceId) return toast.error("Activate a voice first");
    if (topic.trim().length < 10) return toast.error("Give a topic (10+ chars)");
    setBusy(true);
    setOutput("");
    setScore(null);
    try {
      const res: RepurposeResult = await repurposeContent({
        data: {
          inputText: `Topic: ${topic.trim()}. Write a short, high-quality sample post in my voice.`,
          selectedTypes: [format],
        },
        headers: auth,
      });
      if (res.error || !res.output) {
        toast.error(res.error || "Generation failed");
        return;
      }
      setOutput(res.output);
      const s = await scoreContentAgainstVoice({
        data: { voiceId: activeVoiceId, content: res.output.slice(0, 3000) },
        headers: auth,
      });
      if (s.success && typeof s.score === "number") setScore(s.score);
    } catch {
      toast.error("Test bench failed");
    } finally {
      setBusy(false);
    }
  };

  const scoreColor =
    score == null ? "" :
    score >= 85 ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" :
    score >= 75 ? "text-lime-300 border-lime-500/40 bg-lime-500/10" :
    score >= 50 ? "text-amber-300 border-amber-500/40 bg-amber-500/10" :
    "text-red-300 border-red-500/40 bg-red-500/10";

  return (
    <div className="sticky top-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <Beaker className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Live test bench</h3>
      </div>
      <p className="mb-3 text-[11px] text-slate-400">
        Give a topic — we'll generate a sample using your active voice + kit and score the match.
      </p>

      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. Announcing our new pricing"
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs text-slate-100 outline-none focus:border-violet-500"
      />

      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
        {(["tweets", "linkedin", "video"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
              format === f
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {f === "tweets" ? "Tweet" : f === "linkedin" ? "LinkedIn" : "Video"}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={busy || !activeVoiceId}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {busy ? "Generating…" : output ? "Regenerate" : "Generate sample"}
      </button>

      {output && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {score != null && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>
                  {score}% match
                </span>
              )}
              {score != null && score < 75 && (
                <span className="text-[10px] text-amber-400">Consider more samples</span>
              )}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}
              className="text-slate-400 hover:text-white"
              aria-label="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-200">
            {output}
          </p>
        </div>
      )}

      {!activeVoiceId && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-200">
          Activate a voice to enable the test bench.
        </p>
      )}
    </div>
  );
}
