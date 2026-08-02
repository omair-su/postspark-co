import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2, Mic, Square, Upload, Sparkles, Copy, AudioLines, Headphones,
  FileText, ListChecks, Quote, Youtube, Newspaper, Calendar as CalendarIcon,
  Download, Hash, Mail, Megaphone, Clock,
} from "lucide-react";
import { transcribeAudio } from "@/lib/import.functions";
import { generatePodcastContentPack } from "@/lib/podcast.functions";
import { fileToBase64 } from "@/lib/clientImport";
import { withAIProgress } from "@/lib/aiProgress";
import { HeroArt } from "@/components/dashboard/HeroArt";

export const Route = createFileRoute("/dashboard/podcast")({
  component: PodcastPage,
});

type FormatId =
  | "tweets" | "thread" | "linkedin" | "instagram" | "tiktok" | "facebook"
  | "show_notes" | "summary" | "blog_post" | "newsletter" | "youtube_description"
  | "title_suggestions" | "pull_quotes" | "chapters" | "key_topics"
  | "promo_email" | "sponsor_pitch";

interface FormatDef {
  id: FormatId;
  label: string;
  group: "social" | "episode" | "growth";
  qty?: boolean;
  defaultQty?: number;
  icon: typeof FileText;
}

const FORMATS: FormatDef[] = [
  { id: "tweets", label: "Tweets", group: "social", qty: true, defaultQty: 5, icon: Hash },
  { id: "thread", label: "X Thread", group: "social", icon: Hash },
  { id: "linkedin", label: "LinkedIn Post", group: "social", qty: true, defaultQty: 1, icon: FileText },
  { id: "instagram", label: "Instagram Caption", group: "social", qty: true, defaultQty: 3, icon: FileText },
  { id: "tiktok", label: "TikTok Hook", group: "social", qty: true, defaultQty: 3, icon: FileText },
  { id: "facebook", label: "Facebook Post", group: "social", qty: true, defaultQty: 2, icon: FileText },
  { id: "show_notes", label: "Show Notes", group: "episode", icon: ListChecks },
  { id: "summary", label: "Episode Summary", group: "episode", icon: FileText },
  { id: "blog_post", label: "Blog Post", group: "episode", icon: Newspaper },
  { id: "newsletter", label: "Newsletter Section", group: "episode", icon: Mail },
  { id: "youtube_description", label: "YouTube Description", group: "episode", icon: Youtube },
  { id: "title_suggestions", label: "Episode Titles (5)", group: "episode", icon: Sparkles },
  { id: "pull_quotes", label: "Pull Quotes (10)", group: "episode", qty: true, defaultQty: 10, icon: Quote },
  { id: "chapters", label: "Timestamps + Chapters", group: "episode", icon: Clock },
  { id: "key_topics", label: "Key Topics (10)", group: "episode", icon: Hash },
  { id: "promo_email", label: "Promo Email to List", group: "growth", icon: Mail },
  { id: "sponsor_pitch", label: "Cold Pitch to Sponsors", group: "growth", icon: Megaphone },
];

const GROUP_LABEL: Record<FormatDef["group"], string> = {
  social: "Social Content",
  episode: "Episode Assets",
  growth: "Growth Assets",
};

const DEFAULT_SELECTION: FormatId[] = [
  "tweets", "thread", "linkedin", "instagram",
  "show_notes", "summary", "blog_post", "newsletter",
  "youtube_description", "title_suggestions", "pull_quotes",
];

function parseSections(markdown: string): { title: string; body: string }[] {
  if (!markdown.trim()) return [];
  const parts = markdown.split(/^##\s+/m).map((p) => p.trim()).filter(Boolean);
  return parts.map((p) => {
    const nl = p.indexOf("\n");
    if (nl === -1) return { title: p.trim(), body: "" };
    return { title: p.slice(0, nl).trim(), body: p.slice(nl + 1).trim() };
  });
}

function PodcastPage() {
  const { session } = useAuth();
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [showName, setShowName] = useState("");
  const [guest, setGuest] = useState("");
  const [niche, setNiche] = useState("");
  const [selected, setSelected] = useState<FormatId[]>(DEFAULT_SELECTION);
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(FORMATS.filter((f) => f.qty).map((f) => [f.id, f.defaultQty || 3])),
  );
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState<string>("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const authHeaders = useMemo(
    () => (session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined),
    [session?.access_token],
  );

  const sections = useMemo(() => parseSections(output), [output]);
  useEffect(() => {
    if (sections.length && !activeTab) setActiveTab(sections[0].title);
  }, [sections, activeTab]);

  const transcribeBlob = async (blob: Blob) => {
    if (!session) return toast.error("Please sign in");
    if (blob.size > 14 * 1024 * 1024) return toast.error("Audio must be under ~14MB");
    setTranscribing(true);
    try {
      const { base64, mimeType } = await fileToBase64(blob);
      const res = await transcribeAudio({
        data: { audioBase64: base64, mimeType, preferProvider: "auto" },
        headers: authHeaders,
      });
      if (res.error || !res.text) toast.error(res.error || "Transcription failed");
      else { setTranscript(res.text); toast.success(`Transcribed via ${res.provider}`); }
    } catch { toast.error("Transcription failed"); }
    finally { setTranscribing(false); }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribeBlob(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { toast.error("Microphone permission denied"); }
  };

  const stopRec = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  };

  const toggle = (id: FormatId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (transcript.trim().length < 50) return toast.error("Transcript too short (≥50 chars)");
    if (!selected.length) return toast.error("Pick at least one output");
    setGenerating(true);
    setOutput("");
    setActiveTab("");
    try {
      const quantities: Record<string, number> = {};
      for (const id of selected) {
        const def = FORMATS.find((f) => f.id === id);
        if (def?.qty) quantities[id] = qty[id] ?? def.defaultQty ?? 3;
      }
      const res = await withAIProgress(
        generatePodcastContentPack({
          data: {
            transcript: transcript.slice(0, 80000),
            episodeTitle: episodeTitle || undefined,
            showName: showName || undefined,
            guest: guest || undefined,
            niche: niche || undefined,
            formats: selected,
            quantities,
          },
          headers: authHeaders,
        }),
      );
      if (res.error === "LIMIT_REACHED") toast.error("Monthly limit reached. Upgrade to continue.");
      else if (res.error) toast.error(res.error);
      else if (!res.output) toast.error("No output");
      else { setOutput(res.output); toast.success("Content pack ready"); }
    } catch { toast.error("Generation failed"); }
    finally { setGenerating(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const exportTxt = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(episodeTitle || showName || "podcast-pack").replace(/[^\w-]+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stripTimestamps = () => {
    setTranscript((t) => t.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/g, "").replace(/\(\d{1,2}:\d{2}(?::\d{2})?\)\s*/g, ""));
    toast.success("Timestamps stripped");
  };

  const grouped = useMemo(() => ({
    social: FORMATS.filter((f) => f.group === "social"),
    episode: FORMATS.filter((f) => f.group === "episode"),
    growth: FORMATS.filter((f) => f.group === "growth"),
  }), []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="pod-hero">
        <HeroArt art="shorts" />
        <div className="flex items-start gap-3">
          <div className="pod-hero-badge"><Headphones className="h-4 w-4" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1a1a2e]">Podcast & Voice → Content Engine</h1>
            <p className="mt-1 text-sm text-[#4B5563]">Upload one episode. Get a full content pack in 60 seconds.</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="pod-hero-chip">🎙️ ElevenLabs transcription</span>
              <span className="pod-hero-chip">📝 Show notes</span>
              <span className="pod-hero-chip">📰 Blog post</span>
              <span className="pod-hero-chip">📦 Social pack</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — Input */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="pod-card">
            <div className="pod-step-label">Step 1 · Capture audio</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={recording ? stopRec : startRec}
                disabled={transcribing && !recording}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  recording ? "bg-red-500 text-white hover:opacity-90" : "pod-btn-primary"
                }`}
              >
                {recording ? (<><Square className="h-4 w-4" /> Stop &amp; transcribe</>) : (<><Mic className="h-4 w-4" /> Record</>)}
              </button>
              <label className="pod-btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> Upload audio
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) transcribeBlob(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {transcribing && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
              </div>
            )}
            <p className="mt-2 text-[11px] text-[#9CA3AF]">
              <AudioLines className="mr-1 inline h-3 w-3" /> MP3, WAV, M4A, WebM. Up to ~14MB (~10 min).
            </p>
          </div>

          {/* Step 2 — Episode info */}
          <div className="pod-card">
            <div className="pod-step-label">Step 2 · Episode info <span className="font-normal text-[#9CA3AF]">(optional but recommended)</span></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="pod-input" placeholder="Episode title" value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} />
              <input className="pod-input" placeholder="Show name" value={showName} onChange={(e) => setShowName(e.target.value)} />
              <input className="pod-input" placeholder="Guest name(s)" value={guest} onChange={(e) => setGuest(e.target.value)} />
              <input className="pod-input" placeholder="Topic / niche" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
          </div>

          {/* Step 3 — Transcript */}
          <div className="pod-card">
            <div className="pod-step-label">Step 3 · Transcript (editable)</div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={8}
              placeholder="Your transcript will appear here. You can also paste one directly."
              className="pod-input w-full resize-y"
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[11px] text-[#9CA3AF]">{transcript.length.toLocaleString()} characters</p>
              {transcript && (
                <button onClick={stripTimestamps} className="rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-[11px] font-medium hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
                  Strip timestamps
                </button>
              )}
            </div>
          </div>

          {/* Step 4 — Output formats */}
          <div className="pod-card">
            <div className="pod-step-label">Step 4 · Output formats</div>
            {(["social", "episode", "growth"] as const).map((g) => (
              <div key={g} className="mb-3 last:mb-0">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">{GROUP_LABEL[g]}</div>
                <div className="flex flex-wrap gap-1.5">
                  {grouped[g].map((f) => {
                    const active = selected.includes(f.id);
                    const Icon = f.icon;
                    return (
                      <div key={f.id} className="flex items-center gap-1">
                        <button
                          onClick={() => toggle(f.id)}
                          className={`pod-format-chip ${active ? "pod-format-chip-active" : ""}`}
                        >
                          <Icon className="h-3 w-3" /> {f.label}
                        </button>
                        {active && f.qty && (
                          <select
                            value={qty[f.id] ?? f.defaultQty ?? 3}
                            onChange={(e) => setQty((q) => ({ ...q, [f.id]: Number(e.target.value) }))}
                            className="rounded-md border border-[#E5E7EB] bg-white px-1.5 py-1 text-[11px] font-medium text-[#6B4EFF] focus:border-[#6B4EFF] focus:outline-none"
                          >
                            {[1, 3, 5, 8, 10, 15].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || transcript.trim().length < 50}
            className="pod-btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60"
          >
            {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating content pack…</>) : (<><Sparkles className="h-4 w-4" /> Generate content pack</>)}
          </button>
        </div>

        {/* RIGHT — Output */}
        <div className="pod-card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">Content Pack</h3>
            {output && (
              <div className="flex items-center gap-1.5">
                <button onClick={exportTxt} className="pod-mini-btn"><Download className="h-3 w-3" /> Export .txt</button>
                <button onClick={() => copy(output)} className="pod-mini-btn"><Copy className="h-3 w-3" /> Copy all</button>
              </div>
            )}
          </div>

          {generating ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#6B4EFF]" />
            </div>
          ) : sections.length ? (
            <>
              <div className="pod-tabs">
                {sections.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => setActiveTab(s.title)}
                    className={`pod-tab ${activeTab === s.title ? "pod-tab-active" : ""}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
              <div className="px-5 py-4">
                {sections
                  .filter((s) => s.title === activeTab)
                  .map((s) => (
                    <div key={s.title}>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#1a1a2e]">{s.title}</h4>
                        <button onClick={() => copy(s.body)} className="pod-mini-btn"><Copy className="h-3 w-3" /> Copy</button>
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[#374151]">{s.body}</pre>
                    </div>
                  ))}
              </div>
              <div className="border-t border-[#E5E7EB] bg-[#FAFAF8] px-5 py-3">
                <a href="/dashboard/calendar" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B4EFF] hover:underline">
                  <CalendarIcon className="h-3.5 w-3.5" /> Schedule social posts to Calendar
                </a>
              </div>
            </>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center text-[#9CA3AF]">
              <Mic className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-xs">Your repurposed content pack will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
