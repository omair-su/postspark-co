import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Square, Sparkles, Mic, AudioLines, Upload, FileText } from "lucide-react";
import { extractPdfText, extractDocxText, fileToBase64 } from "@/lib/clientImport";
import { importFromUrl, transcribeAudio, checkProviders } from "@/lib/import.functions";

type SubTab = "url" | "pdf" | "docx" | "audio";

export function ImportInputPanel({
  subTab,
  onSubTabChange,
  onExtracted,
}: {
  subTab: SubTab;
  onSubTabChange: (t: SubTab) => void;
  onExtracted: (text: string, meta?: string) => void;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [provider, setProvider] = useState<"auto" | "assemblyai" | "whisper" | "elevenlabs" | "gemini">("auto");
  const [providers, setProviders] = useState<{ elevenlabs: boolean; gemini: boolean; assemblyai: boolean; whisper: boolean } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!session) return;
    checkProviders({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(setProviders)
      .catch(() => {});
  }, [session]);

  const handleUrl = async () => {
    if (!session) return toast.error("Please sign in");
    if (!url.trim()) return toast.error("Paste a URL");
    setBusy(true);
    try {
      const res = await importFromUrl({
        data: { url: url.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error || !res.text) {
        toast.error(res.error || "Failed to import");
      } else {
        onExtracted(res.text, res.title ? `From: ${res.title}` : `From: ${url}`);
        toast.success("Imported");
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("PDF must be under 20MB");
    setBusy(true);
    try {
      const extracted = await extractPdfText(file);
      if (!extracted) toast.error("No text found in PDF (may be scanned)");
      else {
        onExtracted(
          extracted.length > 40000 ? extracted.slice(0, 40000) + "\n\n[…truncated]" : extracted,
          `PDF: ${file.name}`,
        );
        toast.success("Extracted");
      }
    } catch {
      toast.error("Failed to read PDF");
    } finally {
      setBusy(false);
    }
  };

  const handleDocx = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("DOCX must be under 20MB");
    setBusy(true);
    try {
      const extracted = await extractDocxText(file);
      if (!extracted) toast.error("No text found in document");
      else {
        onExtracted(
          extracted.length > 40000 ? extracted.slice(0, 40000) + "\n\n[…truncated]" : extracted,
          `DOCX: ${file.name}`,
        );
        toast.success("Extracted");
      }
    } catch {
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
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        await transcribeBlob(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const transcribeBlob = async (blob: Blob) => {
    if (!session) return toast.error("Please sign in");
    setBusy(true);
    try {
      const { base64, mimeType } = await fileToBase64(blob);
      const res = await transcribeAudio({
        data: { audioBase64: base64, mimeType, preferProvider: provider },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error || !res.text) toast.error(res.error || "Transcription failed");
      else {
        onExtracted(res.text, `Audio transcribed via ${res.provider === "elevenlabs" ? "ElevenLabs" : "Lovable AI"}`);
        toast.success("Transcribed");
      }
    } catch {
      toast.error("Transcription failed");
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: SubTab; label: string; icon: typeof Sparkles }[] = [
    { id: "url", label: "Web URL", icon: Sparkles },
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "docx", label: "Word", icon: FileText },
    { id: "audio", label: "Audio", icon: Mic },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSubTabChange(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              subTab === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
            }`}
          >
            <t.icon className="h-3 w-3" /> {t.label}
          </button>
        ))}
      </div>

      {subTab === "url" && (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/blog/my-article"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleUrl}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Fetch
          </button>
        </div>
      )}

      {subTab === "pdf" && (
        <FileDrop label="Upload a PDF (up to 20MB)" accept="application/pdf" onFile={handlePdf} busy={busy} />
      )}

      {subTab === "docx" && (
        <FileDrop
          label="Upload a Word doc (.docx, up to 20MB)"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onFile={handleDocx}
          busy={busy}
        />
      )}

      {subTab === "audio" && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={busy && !recording}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                recording
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "gradient-electric text-primary-foreground hover:opacity-90 disabled:opacity-60"
              }`}
            >
              {recording ? <><Square className="h-4 w-4" /> Stop & transcribe</> : <><Mic className="h-4 w-4" /> Record</>}
            </button>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent">
              <AudioLines className="h-4 w-4" /> Upload audio
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
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
          >
            <option value="auto">Auto (best available)</option>
            <option value="gemini">Lovable AI (Gemini)</option>
            <option value="elevenlabs" disabled={!providers?.elevenlabs}>
              ElevenLabs Scribe {providers && !providers.elevenlabs ? "(not configured)" : ""}
            </option>
          </select>
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FileDrop({
  label, accept, onFile, busy,
}: {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  busy: boolean;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        drag ? "border-primary bg-primary/5" : "border-input hover:border-primary/40"
      }`}
    >
      {busy ? (
        <Loader2 className="mb-2 h-7 w-7 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
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
  );
}
