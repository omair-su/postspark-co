import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, TrendingUp, Twitter, Linkedin, Megaphone } from "lucide-react";
import { getMetricsSnapshot, generateBuildInPublicPosts } from "@/lib/buildInPublic.functions";
import { withAIProgress } from "@/lib/aiProgress";
import type { FounderPost } from "@/lib/buildInPublic.server";

export const Route = createFileRoute("/dashboard/build-in-public")({
  component: BuildInPublicPage,
});

const TONES = ["Honest founder", "Punchy/contrarian", "Storyteller", "Data-driven"];

function BuildInPublicPage() {
  const { session } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [proLocked, setProLocked] = useState(false);
  const [tone, setTone] = useState(TONES[0]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<FounderPost[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getMetricsSnapshot({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r: any) => {
        if (r.ok) setMetrics(r.metrics);
        else setProLocked(true);
      })
      .catch(() => {});
  }, [session]);

  const run = async () => {
    if (!session) return toast.error("Please sign in");
    setLoading(true); setPosts([]);
    try {
      const res = await withAIProgress(generateBuildInPublicPosts({ data: { tone } }));
      if (res.error) {
        toast.error(res.error);
      } else if (res.posts?.length) {
        setPosts(res.posts);
        toast.success("5 posts ready");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally { setLoading(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (proLocked) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <Megaphone className="mx-auto mb-3 h-10 w-10 text-[#7C3AED]" />
        <h1 className="text-xl font-bold">Build-in-Public is a Pro feature</h1>
        <p className="mt-2 text-sm text-[#6B7280]">Turn your real product metrics into 5 ready-to-post X + LinkedIn posts every day.</p>
        <Link to="/pricing" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white">Upgrade to Pro</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-6 space-y-6">
      <div className="flex items-start gap-4 rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #161F33 0%, rgba(124,58,237,0.14) 100%)", border: "1px solid #243047" }}>
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: "linear-gradient(135deg, #06B6D4 0%, #7C3AED 100%)", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
          <Megaphone className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1A1A2E]">Build-in-Public Engine</h1>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Real metrics → 5 ready-to-post variants for X and LinkedIn. Never stare at a blank composer again.
          </p>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Signups · 7d" value={metrics.signupsLast7d} />
          <Stat label="Repurposes · 7d" value={metrics.repurposesLast7d} />
          <Stat label="MRR" value={`$${metrics.mrrUsd}`} />
          <Stat label="Top tool" value={metrics.topTool} small />
        </div>
      )}

      <div className="rounded-[14px] border border-black/[0.08] bg-white p-5">
        <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Tone</div>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)} className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${tone === t ? "border-[#6B4EFF] bg-[#6B4EFF] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#6B4EFF]/40"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={loading || !metrics} className="ps-generate-btn">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing today's 5 posts…</> : <><Sparkles className="h-4 w-4" /> Generate today's 5 posts</>}
      </button>

      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((p, i) => {
            const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(p.x)}`;
            const liUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(p.linkedin)}`;
            return (
              <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{p.archetype}</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#6B7280]"><Twitter className="h-3 w-3" /> X · {p.x.length}/280</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => copy(p.x, `x${i}`)} className="text-[#9CA3AF] hover:text-[#6B4EFF]">{copied === `x${i}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}</button>
                        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#7C3AED] hover:underline">Post →</a>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap rounded-lg bg-[#FAFAF8] p-3 text-[13.5px] text-[#1A1A2E] font-sans">{p.x}</pre>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#6B7280]"><Linkedin className="h-3 w-3" /> LinkedIn · {p.linkedin.length}/1300</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => copy(p.linkedin, `li${i}`)} className="text-[#9CA3AF] hover:text-[#6B4EFF]">{copied === `li${i}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}</button>
                        <a href={liUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#7C3AED] hover:underline">Post →</a>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap rounded-lg bg-[#FAFAF8] p-3 text-[13.5px] text-[#1A1A2E] font-sans">{p.linkedin}</pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: any; small?: boolean }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">{label}</div>
      <div className={`mt-1 font-bold text-[#1A1A2E] ${small ? "text-base" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
