import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Upload, Link as LinkIcon, FileText, Mic, Loader2, Square, Sparkles, Send, AudioLines,
} from "lucide-react";
import { extractPdfText, extractDocxText, fileToBase64 } from "@/lib/clientImport";
import { importFromUrl, transcribeAudio, checkProviders } from "@/lib/import.functions";

export const Route = createFileRoute("/dashboard/import")({
  component: ImportStudioPage,
});

type Tab = "url" | "pdf" | "docx" | "audio";

function ImportStudioPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("url");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<string>("");

  // URL tab
  const [url, setUrl] = useState("");

  // Audio tab
  const [recording, setRecording] = useState(false);
  const [provider, setProvider] = useState<"auto" | "gemini" | "elevenlabs">("auto");
  const [providers, setProviders] = useState<{ elevenlabs: boolean; gemini: boolean } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!session) return;
    checkProviders({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(setProviders)
      .catch(() => {});
  }, [session]);

  const reset = () => {
    setText("");
    setMeta("");
  };

  const handleUrl = async () => {
    if (!session) return toast.error("Please sign in");
    if (!url.trim()) return toast.error("Paste a URL");
    setBusy(true);
    reset();
    try {
      const res = await importFromUrl({
        data: { url: url.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error || !res.text) {
        toast.error(res.error || "Failed to import");
      } else {
        setText(res.text);
        setMeta(res.title ? `From: ${res.title}` : `From: ${url}`);
        toast.success("Imported");
      }
    } catch (e) {
      console.error(e);
      toast.error("Import failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = async (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("PDF must be under 20MB");
    setBusy(true);
    reset();
    try {
      const extracted = await extractPdfText(file);
      if (!extracted) {
        toast.error("No text found in PDF (may be scanned/image-based)");
      } else {
        setText(extracted.length > 40000 ? extracted.slice(0, 40000) + "\n\n[…truncated]" : extracted);
        setMeta(`PDF: ${file.name}`);
        toast.success("Extracted");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to read PDF");
    } finally {
      setBusy(false);
    }
  };

  const handleDocx = async (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("DOCX must be under 20MB");
    setBusy(true);
    reset();
    try {
      const extracted = await extractDocxText(file);
      if (!extracted) {
        toast.error("No text found in document");
      } else {
        setText(extracted.length > 40000 ? extracted.slice(0, 40000) + "\n\n[…truncated]" : extracted);
        setMeta(`DOCX: ${file.name}`);
        toast.success("Extracted");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to read DOCX");
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        await transcribeBlob(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) {
      console.error(e);
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const handleAudioFile = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) return toast.error("Audio must be under 25MB");
    await transcribeBlob(file);
  };

  const transcribeBlob = async (blob: Blob) => {
    if (!session) return toast.error("Please sign in");
    setBusy(true);
    reset();
    try {
      const { base64, mimeType } = await fileToBase64(blob);
      const res = await transcribeAudio({
        data: { audioBase64: base64, mimeType, preferProvider: provider },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error || !res.text) {
        toast.error(res.error || "Transcription failed");
      } else {
        setText(res.text);
        setMeta(`Audio transcribed via ${res.provider === "elevenlabs" ? "ElevenLabs" : "Lovable AI"}`);
        toast.success("Transcribed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Transcription failed");
    } finally {
      setBusy(false);
    }
  };

  const sendToRepurpose = () => {
    if (!text.trim()) return toast.error("Nothing to send");
    try {
      sessionStorage.setItem("postspark.import.text", text);
    } catch {
      // ignore
    }
    navigate({ to: "/dashboard/repurpose" });
    toast.success("Loaded into Repurpose");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <Upload className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Studio</h1>
          <p className="text-sm text-muted-foreground">
            Pull content from URLs, PDFs, Word docs, or your voice — then send it straight to Repurpose.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "url" as Tab, label: "Web URL", icon: LinkIcon },
          { id: "pdf" as Tab, label: "PDF", icon: FileText },
          { id: "docx" as Tab, label: "Word", icon: FileText },
          { id: "audio" as Tab, label: "Audio / Voice", icon: Mic },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); reset(); }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {tab === "url" && (
          <>
            <label className="block text-sm font-medium">Article URL</label>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/blog/my-article"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleUrl}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Fetch
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              We extract the main article text. Works best on blog posts and news articles.
            </p>
          </>
        )}

        {tab === "pdf" && (
          <FileDrop
            label="Upload a PDF (up to 20MB)"
            accept="application/pdf"
            onFile={handlePdf}
            busy={busy}
            hint="Text-based PDFs only. Scanned image PDFs won't extract."
          />
        )}

        {tab === "docx" && (
          <FileDrop
            label="Upload a Word document (.docx, up to 20MB)"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onFile={handleDocx}
            busy={busy}
            hint="Modern .docx files. Legacy .doc files aren't supported."
          />
        )}

        {tab === "audio" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={busy && !recording}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  recording
                    ? "bg-destructive text-destructive-foreground hover:opacity-90"
                    : "gradient-electric text-primary-foreground hover:opacity-90 disabled:opacity-60"
                }`}
              >
                {recording ? (
                  <>
                    <Square className="h-4 w-4" /> Stop & transcribe
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Record from microphone
                  </>
                )}
              </button>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent">
                <AudioLines className="h-4 w-4" />
                Upload audio file
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAudioFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Transcription engine</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="auto">Auto (best available)</option>
                <option value="gemini">Lovable AI (Gemini, included)</option>
                <option value="elevenlabs" disabled={!providers?.elevenlabs}>
                  ElevenLabs Scribe {providers && !providers.elevenlabs ? "(not configured)" : ""}
                </option>
              </select>
              {providers && !providers.elevenlabs && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Add an <code>ELEVENLABS_API_KEY</code> secret to enable ElevenLabs Scribe.
                </p>
              )}
            </div>

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Transcribing…
              </div>
            )}
          </div>
        )}
      </div>

      {text && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Extracted content</h3>
              {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
            </div>
            <button
              onClick={sendToRepurpose}
              className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Send to Repurpose
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">{text.length.toLocaleString()} characters</p>
        </div>
      )}
    </div>
  );
}

function FileDrop({
  label, accept, onFile, busy, hint,
}: {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  busy: boolean;
  hint?: string;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-input hover:border-primary/40"
        }`}
      >
        {busy ? (
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">Drop a file here, or click to browse</p>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
