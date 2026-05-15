import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mic, Square, Upload, Sparkles, Copy, AudioLines } from "lucide-react";
import { transcribeAudio } from "@/lib/import.functions";
import { repurposeContent } from "@/lib/repurpose.functions";
import { fileToBase64 } from "@/lib/clientImport";
import { withAIProgress } from "@/lib/aiProgress";

export const Route = createFileRoute("/dashboard/podcast")({
  component: PodcastPage,
});

const OUTPUT_TYPES = [
  { id: "tweets", label: "10 Tweets" },
  { id: "thread", label: "X Thread" },
  { id: "linkedin", label: "LinkedIn Post" },
  { id: "instagram", label: "Instagram Caption" },
  { id: "tiktok", label: "TikTok Hook" },
  { id: "email", label: "Newsletter" },
];

function PodcastPage() {
  const { session } = useAuth();
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selected, setSelected] = useState<string[]>(["tweets", "linkedin", "thread", "email"]);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const authHeaders = useMemo(
    () => (session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined),
    [session?.access_token],
  );

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

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleRepurpose = async () => {
    if (!session) return toast.error("Please sign in");
    if (transcript.trim().length < 50) return toast.error("Transcript too short");
    if (!selected.length) return toast.error("Pick at least one output type");
    setGenerating(true);
    setOutput("");
    try {
      const res = await withAIProgress(
        repurposeContent({
          data: {
            inputText: transcript.slice(0, 50000),
            selectedTypes: selected,
            tone: "conversational",
            customInstructions: "Source is a podcast/voice recording — keep voice authentic, lift quotable lines.",
            tool: "podcast",
          },
          headers: authHeaders,
        }),
      );
      if (res.error === "LIMIT_REACHED") toast.error("Monthly limit reached. Upgrade to continue.");
      else if (res.error) toast.error(res.error);
      else if (!res.output) toast.error("No output");
      else { setOutput(res.output); toast.success("Content pack ready — saved to History"); }
    } catch { toast.error("Generation failed"); }
    finally { setGenerating(false); }
  };

  const stripTimestamps = () => {
    setTranscript((t) => t.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/g, "").replace(/\(\d{1,2}:\d{2}(?::\d{2})?\)\s*/g, ""));
    toast.success("Timestamps stripped");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Podcast / Voice → Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an episode or record a voice note. We transcribe it and turn it into a multi-platform content pack.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">1. Capture audio</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={recording ? stopRec : startRec}
                disabled={transcribing && !recording}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                  recording
                    ? "bg-destructive text-destructive-foreground hover:opacity-90"
                    : "gradient-electric text-primary-foreground hover:opacity-90 disabled:opacity-60"
                }`}
              >
                {recording ? (<><Square className="h-4 w-4" /> Stop &amp; transcribe</>) : (<><Mic className="h-4 w-4" /> Record</>)}
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent">
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
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
              </div>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              <AudioLines className="mr-1 inline h-3 w-3" /> MP3, WAV, M4A, WebM. Up to ~14MB (~10 min).
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">2. Transcript (editable)</h3>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              placeholder="Your transcript will appear here. You can also paste one directly."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                {transcript.length.toLocaleString()} characters
              </p>
              {transcript && (
                <button
                  onClick={stripTimestamps}
                  className="rounded-md border border-input bg-background px-2 py-0.5 text-[11px] font-medium hover:bg-accent"
                  title="Remove [mm:ss] or (mm:ss) timestamps"
                >
                  Strip timestamps
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">3. Output formats</h3>
            <div className="flex flex-wrap gap-1.5">
              {OUTPUT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    selected.includes(t.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRepurpose}
            disabled={generating || transcript.trim().length < 50}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
          >
            {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating content pack…</>) : (<><Sparkles className="h-4 w-4" /> Generate content pack</>)}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Output</h3>
            {output && (
              <button
                onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
              >
                <Copy className="h-3 w-3" /> Copy all
              </button>
            )}
          </div>
          {generating ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {output}
            </pre>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center text-muted-foreground">
              <Mic className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-xs">Your repurposed content pack will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
