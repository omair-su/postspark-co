import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Link2, ClipboardPaste, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trainBrandVoice, analyzeBrandVoiceFromUrl } from "@/lib/brandVoice.functions";
import { extractPdfText, extractDocxText } from "@/lib/clientImport";

type Tab = "paste" | "url" | "upload";

interface Props {
  onCreated: () => void;
  onClose: () => void;
}

export function ExtractionHub({ onCreated, onClose }: Props) {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("paste");
  const [name, setName] = useState("");
  const [samples, setSamples] = useState<string[]>(["", "", ""]);
  const [url, setUrl] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [busy, setBusy] = useState(false);

  const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;

  const runPaste = async () => {
    if (!authHeaders) return;
    if (!name.trim()) return toast.error("Give this voice a name");
    const filled = samples.map((s) => s.trim()).filter((s) => s.length >= 20);
    if (filled.length < 3) return toast.error("At least 3 samples (20+ chars each)");
    setBusy(true);
    try {
      const res = await trainBrandVoice({
        data: { name: name.trim(), samples: filled },
        headers: authHeaders,
      });
      if (!res.success) toast.error(res.error || "Training failed");
      else {
        toast.success("Voice trained");
        onCreated();
      }
    } finally {
      setBusy(false);
    }
  };

  const runUrl = async () => {
    if (!authHeaders) return;
    if (!name.trim()) return toast.error("Name required");
    if (!/^https?:\/\//.test(url)) return toast.error("Enter a full URL");
    setBusy(true);
    try {
      const res = await analyzeBrandVoiceFromUrl({
        data: { url: url.trim(), name: name.trim() },
        headers: authHeaders,
      });
      if (!res.success) toast.error(res.error || "Analysis failed");
      else {
        toast.success(`Trained from ${res.sampleCount ?? 0} samples`);
        onCreated();
      }
    } finally {
      setBusy(false);
    }
  };

  const runUpload = async () => {
    if (!authHeaders) return;
    if (!name.trim()) return toast.error("Name required");
    const text = uploadPreview.trim();
    if (text.length < 200) return toast.error("Document too short — need at least 200 chars");
    // Chunk into 3-5 blocks
    const chunks = text
      .split(/\n{2,}/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 60);
    const picks = chunks.length >= 3
      ? chunks.sort((a, b) => b.length - a.length).slice(0, 5).map((c) => c.slice(0, 3000))
      : (() => {
          const size = Math.ceil(text.length / 4);
          return [0, 1, 2, 3].map((i) => text.slice(i * size, (i + 1) * size).trim()).filter(Boolean);
        })();
    if (picks.length < 3) return toast.error("Not enough distinct writing in the file");
    setBusy(true);
    try {
      const res = await trainBrandVoice({
        data: { name: name.trim(), samples: picks },
        headers: authHeaders,
      });
      if (!res.success) toast.error(res.error || "Training failed");
      else { toast.success("Voice trained"); onCreated(); }
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (f: File) => {
    setBusy(true);
    try {
      let text = "";
      if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
        text = await extractPdfText(f);
      } else if (f.name.endsWith(".docx")) {
        text = await extractDocxText(f);
      } else {
        text = await f.text();
      }
      setUploadPreview(text);
      toast.success(`Extracted ${text.length.toLocaleString()} chars`);
    } catch {
      toast.error("Could not read file");
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "paste", label: "Paste samples", icon: <ClipboardPaste className="h-3.5 w-3.5" /> },
    { id: "url", label: "Analyze URL", icon: <Link2 className="h-3.5 w-3.5" /> },
    { id: "upload", label: "Upload doc", icon: <Upload className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">AI Extraction Hub</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Voice name (e.g. My LinkedIn voice)"
        className="mb-4 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
      />

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <div>
          <p className="mb-3 text-xs text-slate-400">
            Paste 3–5 samples of your real writing. 20+ chars each.
          </p>
          <div className="space-y-2">
            {samples.map((s, i) => (
              <textarea
                key={i}
                value={s}
                onChange={(e) => {
                  const n = [...samples];
                  n[i] = e.target.value;
                  setSamples(n);
                }}
                placeholder={`Sample ${i + 1}…`}
                className="h-20 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-100 outline-none focus:border-violet-500"
              />
            ))}
            {samples.length < 5 && (
              <button
                onClick={() => setSamples([...samples, ""])}
                className="text-[11px] font-medium text-violet-400 hover:underline"
              >
                + Add another sample
              </button>
            )}
          </div>
          <button
            onClick={runPaste}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Analyzing style…" : "Train voice"}
          </button>
        </div>
      )}

      {tab === "url" && (
        <div>
          <p className="mb-3 text-xs text-slate-400">
            Paste a blog post or landing page URL. We'll extract paragraphs and train from them.
          </p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourblog.com/post"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
          />
          <button
            onClick={runUrl}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {busy ? "Fetching + analyzing…" : "Analyze URL"}
          </button>
        </div>
      )}

      {tab === "upload" && (
        <div>
          <p className="mb-3 text-xs text-slate-400">
            Upload a PDF, DOCX, or TXT of your writing. We'll extract the text and train from the best chunks.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 text-center hover:border-violet-500/40">
            <Upload className="mb-2 h-6 w-6 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">Choose file</span>
            <span className="mt-0.5 text-[10px] text-slate-500">PDF, DOCX, TXT · up to 20MB</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
          {uploadPreview && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                Extracted preview ({uploadPreview.length.toLocaleString()} chars)
              </div>
              <p className="line-clamp-4 text-[11px] text-slate-400">{uploadPreview}</p>
            </div>
          )}
          <button
            onClick={runUpload}
            disabled={busy || !uploadPreview}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Analyzing style…" : "Train from document"}
          </button>
        </div>
      )}
    </div>
  );
}
