import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, Video, Download, Music2, Upload, Youtube, Link2, AlertCircle } from "lucide-react";
import { generateShorts } from "@/lib/shorts.functions";
import {
  getYouTubeAuthUrl,
  getConnectedSocials,
  disconnectSocial,
  attachShortVideo,
  publishToYouTube,
  recordTikTokIntent,
} from "@/lib/socialPublish.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { supabase } from "@/integrations/supabase/client";
import type { ShortsScript } from "@/server/shorts.server";

export const Route = createFileRoute("/dashboard/shorts-studio")({
  validateSearch: (s: Record<string, unknown>) => ({ yt: typeof s.yt === "string" ? s.yt : undefined }),
  component: ShortsStudioPage,
});

const PLATFORMS = [
  { id: "tiktok" as const, label: "TikTok" },
  { id: "shorts" as const, label: "YouTube Shorts" },
  { id: "reels" as const, label: "Instagram Reels" },
];

const DURATIONS = [30, 45, 60] as const;

function ShortsStudioPage() {
  const { session } = useAuth();
  const search = useSearch({ from: "/dashboard/shorts-studio" });
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("tiktok");
  const [duration, setDuration] = useState<30 | 45 | 60>(45);
  const [angle, setAngle] = useState("");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<ShortsScript | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // ── publish state ──────────────────────────────────────────────
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [connectedYT, setConnectedYT] = useState<{ name: string } | null>(null);
  const [ytPublishing, setYtPublishing] = useState(false);
  const [ytPrivacy, setYtPrivacy] = useState<"public" | "unlisted" | "private">("unlisted");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSocials = async () => {
    try {
      const r = await getConnectedSocials();
      const yt = (r.accounts || []).find((a: any) => a.platform === "youtube");
      setConnectedYT(yt ? { name: (yt as any).platform_username || "YouTube" } : null);
    } catch { /* signed out */ }
  };
  useEffect(() => { if (session) refreshSocials(); }, [session]);
  useEffect(() => {
    if (search.yt === "connected") { toast.success("YouTube connected"); refreshSocials(); }
    else if (search.yt?.startsWith("error:")) toast.error(`YouTube connect failed: ${search.yt.slice(6)}`);
  }, [search.yt]);

  const run = async () => {
    if (!session) return toast.error("Please sign in");
    if (input.trim().length < 20) return toast.error("Paste at least a paragraph of source content");
    setLoading(true); setScript(null); setJobId(null); setVideoFile(null); setVideoPath(null);
    setLimitHit(false); setGenError(null);
    try {
      const res = await withAIProgress(generateShorts({
        data: { inputText: input.trim(), platform, duration, angle: angle.trim() || undefined },
      }));
      if (res.error === "LIMIT_REACHED") {
        setLimitHit(true);
        toast.error("Free plan limit reached — upgrade to Pro for unlimited shorts.");
      } else if (res.error) {
        setGenError(res.error);
        toast.error(res.error);
      } else if (res.script) {
        setScript(res.script);
        setJobId((res as any).jobId || null);
        toast.success("Script ready");
      } else {
        setGenError("No script returned. Please try again.");
        toast.error("No script returned. Please try again.");
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to reach AI service";
      console.error("[shorts] run threw:", e);
      setGenError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── upload video to storage + attach to history ────────────────
  const onPickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId || !session?.user) return;
    if (!file.type.startsWith("video/")) return toast.error("Pick a video file (mp4/mov/webm)");
    if (file.size > 200 * 1024 * 1024) return toast.error("Video too large (max 200MB)");
    setVideoFile(file);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${session.user.id}/${jobId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("shorts-videos").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      const att = await attachShortVideo({ data: { jobId, storagePath: path, mimeType: file.type, sizeBytes: file.size } });
      if ((att as any).error) throw new Error((att as any).error);
      setVideoPath(path);
      toast.success("Video uploaded & saved to History");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
      setVideoFile(null);
    } finally {
      setUploading(false);
    }
  };

  const connectYouTube = async () => {
    try {
      const r = await getYouTubeAuthUrl();
      if ((r as any).error) return toast.error((r as any).error);
      if ((r as any).url) window.location.href = (r as any).url;
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const disconnectYouTube = async () => {
    await disconnectSocial({ data: { platform: "youtube" } });
    setConnectedYT(null);
    toast.success("YouTube disconnected");
  };

  const publishYouTube = async () => {
    if (!script || !jobId || !videoPath) return;
    if (!connectedYT) return toast.error("Connect YouTube first");
    setYtPublishing(true);
    try {
      const r: any = await publishToYouTube({
        data: {
          jobId, storagePath: videoPath,
          title: script.title.slice(0, 100),
          description: script.description,
          hashtags: script.hashtags,
          privacy: ytPrivacy,
        },
      });
      if (r.error === "NOT_CONNECTED") { setConnectedYT(null); return toast.error("Re-connect YouTube"); }
      if (r.error) return toast.error(r.error);
      toast.success("Published to YouTube");
      if (r.url) window.open(r.url, "_blank");
    } catch (e: any) { toast.error(e?.message || "Publish failed"); }
    finally { setYtPublishing(false); }
  };

  const openTikTokUpload = async () => {
    if (!script || !jobId || !videoPath) return;
    const desc = [
      script.description,
      script.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" "),
    ].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(desc).catch(() => {});
    await recordTikTokIntent({ data: { jobId, storagePath: videoPath, title: script.title, description: desc } });
    toast.success("Caption copied. Opening TikTok upload…");
    window.open("https://www.tiktok.com/tiktokstudio/upload", "_blank");
  };


  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = () => {
    if (!script) return;
    const block = [
      `TITLE: ${script.title}`,
      ``,
      `HOOKS (pick one):`,
      ...script.hooks.map((h, i) => `${i + 1}. [${h.score}/100] ${h.text} — ${h.score_reason}`),
      ``,
      `AUDIO: ${script.audio_category}`,
      ``,
      `SHOT LIST:`,
      ...script.shots.map((s) => `[${s.timestamp}]\n  VO: ${s.voiceover}\n  ON-SCREEN: ${s.on_screen_caption}\n  B-ROLL: ${s.b_roll}`),
      ``,
      `CTA: ${script.cta}`,
      ``,
      `DESCRIPTION: ${script.description}`,
      `HASHTAGS: ${script.hashtags.map((h) => `#${h}`).join(" ")}`,
    ].join("\n");
    copy(block, "all");
    toast.success("Full script copied");
  };

  const downloadTxt = () => {
    if (!script) return;
    const block = [
      `TITLE: ${script.title}`,
      ``,
      `HOOKS:`,
      ...script.hooks.map((h, i) => `${i + 1}. [${h.score}/100] ${h.text}`),
      ``,
      `AUDIO CATEGORY: ${script.audio_category}`,
      ``,
      `SHOT LIST:`,
      ...script.shots.map((s) => `[${s.timestamp}]\n  VO: ${s.voiceover}\n  ON-SCREEN: ${s.on_screen_caption}\n  B-ROLL: ${s.b_roll}`),
      ``,
      `CTA: ${script.cta}`,
      `DESCRIPTION: ${script.description}`,
      `HASHTAGS: ${script.hashtags.map((h) => `#${h}`).join(" ")}`,
    ].join("\n");
    const blob = new Blob([block], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `shorts-${platform}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSrt = () => {
    if (!script) return;
    const parseTs = (label: string, idx: number) => {
      // "0:00–0:03" → start sec, end sec
      const match = label.replace("–", "-").match(/(\d+):(\d{1,2})\s*-\s*(\d+):(\d{1,2})/);
      if (match) {
        const s = parseInt(match[1]) * 60 + parseInt(match[2]);
        const e = parseInt(match[3]) * 60 + parseInt(match[4]);
        return { s, e };
      }
      return { s: idx * 3, e: idx * 3 + 3 };
    };
    const fmt = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},000`;
    };
    const srt = script.shots
      .map((sh, i) => {
        const { s, e } = parseTs(sh.timestamp, i);
        return `${i + 1}\n${fmt(s)} --> ${fmt(e)}\n${sh.on_screen_caption}\n`;
      }).join("\n");
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `captions-${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-6 space-y-6">
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, #FAFAF8 0%, #F3F0FF 100%)", border: "0.5px solid rgba(107,78,255,0.12)" }}
      >
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: "linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
          <Video className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1A1A2E]">Shorts Studio</h1>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Turn any source content into a ready-to-record vertical video script — hooks, shot list, on-screen captions, hashtags. Record in OBS or CapCut.
          </p>
        </div>
      </div>

      <Card>
        <Label>Source content</Label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="Paste a blog post, transcript, idea, or notes…"
          className="ps-input w-full"
        />
      </Card>

      <Card>
        <Label>Platform</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Pill key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>{p.label}</Pill>
          ))}
        </div>
        <Label className="mt-5">Duration</Label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>{d}s</Pill>
          ))}
        </div>
        <Label className="mt-5">Angle (optional)</Label>
        <input
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="e.g. contrarian take, before/after, productivity hack"
          className="ps-input w-full"
        />
      </Card>

      <button onClick={run} disabled={loading} className="ps-generate-btn">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Directing your short…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate Script</>
        )}
      </button>

      {script && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <p className="text-xs text-[#6B7280]">✓ {duration}s script ready · {script.shots.length} shots</p>
            <div className="flex gap-2">
              <button onClick={copyAll} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
                {copied === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy all
              </button>
              <button onClick={downloadTxt} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
                <Download className="h-3.5 w-3.5" /> .txt
              </button>
              <button onClick={downloadSrt} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
                <Download className="h-3.5 w-3.5" /> .srt
              </button>
            </div>
          </div>

          <Card>
            <Label>3 hook variants (pick one)</Label>
            <div className="space-y-2">
              {script.hooks.map((h, i) => {
                const tone = h.score >= 80 ? { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" }
                  : h.score >= 60 ? { bg: "#FFFBEB", fg: "#B45309", border: "#FCD34D" }
                  : { bg: "#FEF2F2", fg: "#B91C1C", border: "#FCA5A5" };
                return (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] bg-white p-3">
                    <span className="text-[12px] font-bold text-[#9CA3AF]">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-[14px] text-[#1A1A2E]">{h.text}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}>
                          {h.score}/100
                        </span>
                        <span className="text-[11px] text-[#6B7280]">{h.score_reason}</span>
                      </div>
                    </div>
                    <button onClick={() => copy(h.text, `h${i}`)} className="text-[#9CA3AF] hover:text-[#6B4EFF]">
                      {copied === `h${i}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <Label className="!mb-0">Shot list</Label>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]"><Music2 className="h-3 w-3" /> Audio: {script.audio_category}</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {script.shots.map((s, i) => (
                <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="rounded-md bg-[#1A1A2E] px-2 py-0.5 text-[10px] font-bold text-white">{s.timestamp}</span>
                  </div>
                  <p className="my-1 text-[14px] text-[#1A1A2E]"><strong className="text-[#6B7280] text-[11px] uppercase tracking-wide">VO</strong><br />{s.voiceover}</p>
                  <p className="my-1 text-[13px] text-[#1A1A2E]"><strong className="text-[#6B7280] text-[11px] uppercase tracking-wide">On-screen</strong><br />{s.on_screen_caption}</p>
                  <p className="my-1 text-[13px] text-[#6B7280] italic"><strong className="not-italic text-[#6B7280] text-[11px] uppercase tracking-wide">B-roll</strong><br />{s.b_roll}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Label>CTA & metadata</Label>
            <div className="space-y-3 text-sm">
              <div><span className="text-[11px] uppercase tracking-wide text-[#6B7280]">CTA</span><p className="text-[#1A1A2E]">{script.cta}</p></div>
              <div><span className="text-[11px] uppercase tracking-wide text-[#6B7280]">Title</span><p className="text-[#1A1A2E]">{script.title}</p></div>
              <div><span className="text-[11px] uppercase tracking-wide text-[#6B7280]">Description</span><p className="text-[#1A1A2E]">{script.description}</p></div>
              <div>
                <span className="text-[11px] uppercase tracking-wide text-[#6B7280]">Hashtags</span>
                <p className="text-[#7C3AED]">{script.hashtags.map((h) => `#${h}`).join(" ")}</p>
              </div>
            </div>
          </Card>

          {/* ───────────────── Publish ───────────────── */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <Label className="!mb-0">Record &amp; publish</Label>
              {videoPath && <span className="text-[11px] font-medium text-emerald-600">✓ Saved to History</span>}
            </div>

            {/* Step 1: upload */}
            <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAF8] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#1A1A2E]">1. Record your vertical video</p>
                  <p className="mt-0.5 text-[12px] text-[#6B7280]">
                    Use OBS, CapCut, or your phone. 9:16, ≤ 200 MB. Then upload it here so we can publish it.
                  </p>
                  <input
                    ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={onPickVideo}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !jobId}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A2E] hover:border-[#6B4EFF] hover:text-[#6B4EFF] disabled:opacity-50"
                  >
                    {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                      : videoFile ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> {videoFile.name.slice(0, 28)}</>
                        : <><Upload className="h-3.5 w-3.5" /> Choose video</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: TikTok */}
            <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white text-[11px] font-bold">TT</div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#1A1A2E]">TikTok</p>
                  <p className="mt-0.5 text-[12px] text-[#6B7280]">
                    One-click: copies caption + hashtags to clipboard and opens TikTok Studio upload. Paste the video and hit post.
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                    <AlertCircle className="h-3 w-3" />
                    Full auto-publish requires TikTok app review (coming when approved).
                  </p>
                  <button
                    onClick={openTikTokUpload} disabled={!videoPath}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-3 py-1.5 text-xs font-medium text-white hover:bg-black disabled:opacity-50"
                  >
                    <Link2 className="h-3.5 w-3.5" /> Open TikTok upload
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: YouTube */}
            <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF0000] text-white">
                  <Youtube className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#1A1A2E]">YouTube Shorts</p>
                    {connectedYT ? (
                      <button onClick={disconnectYouTube} className="text-[11px] text-[#9CA3AF] hover:text-red-500">
                        Disconnect ({connectedYT.name})
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#6B7280]">
                    Full auto-publish via YouTube Data API. Uploads as Short (≤ 60s vertical).
                  </p>
                  {!connectedYT ? (
                    <button
                      onClick={connectYouTube}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#FF0000] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#cc0000]"
                    >
                      <Youtube className="h-3.5 w-3.5" /> Connect YouTube
                    </button>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="inline-flex overflow-hidden rounded-lg border border-[#E5E7EB]">
                        {(["private", "unlisted", "public"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setYtPrivacy(p)}
                            className={`px-2.5 py-1.5 text-[11px] font-medium capitalize ${ytPrivacy === p ? "bg-[#1A1A2E] text-white" : "bg-white text-[#6B7280] hover:text-[#1A1A2E]"}`}
                          >{p}</button>
                        ))}
                      </div>
                      <button
                        onClick={publishYouTube} disabled={!videoPath || ytPublishing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF0000] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#cc0000] disabled:opacity-50"
                      >
                        {ytPublishing
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</>
                          : <><Youtube className="h-3.5 w-3.5" /> Publish now</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[14px] border border-black/[0.08] bg-white p-5">{children}</div>;
}
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] ${className}`}>{children}</div>;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${active ? "border-[#6B4EFF] bg-[#6B4EFF] text-white" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#6B4EFF]/40 hover:text-[#1A1A2E]"}`}>{children}</button>
  );
}
