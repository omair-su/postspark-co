import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Upload, Film, X, Music2, Mic, Type, Download, Play, Pause, ArrowUp, ArrowDown, VolumeX, Volume2, Scissors, Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface Clip {
  id: string;
  file: File;
  url: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  muted: boolean;
}

const W = 1080;
const H = 1920;
const FPS = 30;
const MAX_TOTAL_S = 90;

export function LiteEditor({ initialCaptions = "" }: { initialCaptions?: string }) {
  const { tier } = useSubscription();
  const isPro = tier === "pro" || tier === "agency";
  const [clips, setClips] = useState<Clip[]>([]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicVol, setMusicVol] = useState(0.3);
  const [voFile, setVoFile] = useState<File | null>(null);
  const [voUrl, setVoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState(initialCaptions);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [previewClipIdx, setPreviewClipIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scrubT, setScrubT] = useState(0);
  const previewRef = useRef<HTMLVideoElement>(null);

  const supportsExport = typeof MediaRecorder !== "undefined" &&
    (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ||
     MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ||
     MediaRecorder.isTypeSupported("video/webm"));

  const totalDuration = clips.reduce((sum, c) => sum + (c.trimEnd - c.trimStart), 0);

  const addClips = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      if (!file.type.startsWith("video/")) { toast.error(`${file.name}: not a video`); continue; }
      if (file.size > 50 * 1024 * 1024) { toast.error(`${file.name}: too large (50MB max)`); continue; }
      if (clips.length >= 5) { toast.error("Max 5 clips"); break; }
      const url = URL.createObjectURL(file);
      // probe duration
      const dur = await new Promise<number>((res) => {
        const v = document.createElement("video");
        v.preload = "metadata"; v.src = url;
        v.onloadedmetadata = () => res(v.duration || 10);
        v.onerror = () => res(10);
      });
      const clip: Clip = {
        id: Math.random().toString(36).slice(2),
        file, url, duration: dur, trimStart: 0,
        trimEnd: Math.min(dur, 15),
        muted: false,
      };
      setClips((prev) => [...prev, clip]);
    }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files.length) addClips(e.dataTransfer.files); };
  const onPickClips = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addClips(e.target.files); };

  const moveClip = (i: number, dir: -1 | 1) => {
    setClips((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const removeClip = (i: number) => setClips((prev) => prev.filter((_, idx) => idx !== i));

  const onMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicFile(f); setMusicUrl(URL.createObjectURL(f));
  };
  const onVo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (voUrl) URL.revokeObjectURL(voUrl);
    setVoFile(f); setVoUrl(URL.createObjectURL(f));
  };

  // ---- Preview playback (sequential) ----
  useEffect(() => {
    const v = previewRef.current; if (!v || !clips.length) return;
    const c = clips[previewClipIdx];
    if (v.src !== c.url) v.src = c.url;
    const onLoaded = () => {
      try { v.currentTime = c.trimStart; } catch {}
      if (playing) v.play().catch(() => {});
    };
    const onTime = () => {
      if (v.currentTime >= c.trimEnd) {
        if (previewClipIdx + 1 < clips.length) {
          setPreviewClipIdx((i) => i + 1);
        } else {
          setPlaying(false); v.pause();
        }
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewClipIdx, clips, playing]);

  const togglePlay = () => {
    const v = previewRef.current; if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { setPreviewClipIdx(0); setPlaying(true); v.play().catch(() => {}); }
  };

  // ---- Caption windows (parse SRT-ish or split into 3s chunks) ----
  const captionWindows = (() => {
    const lines = captions.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!lines.length) return [];
    // simple model: split sentences across the total duration
    const sentences = lines.flatMap((l) => l.split(/(?<=[.!?])\s+/));
    const per = totalDuration / Math.max(sentences.length, 1);
    return sentences.map((text, i) => ({ start: i * per, end: (i + 1) * per, text }));
  })();

  // ---- Export ----
  const exportVideo = async () => {
    if (!clips.length) return toast.error("Add at least one clip");
    if (totalDuration > MAX_TOTAL_S) return toast.error(`Total exceeds ${MAX_TOTAL_S}s — trim clips`);
    if (!supportsExport) return toast.error("Browser export not supported — use Chrome/Edge");
    setExporting(true); setProgress(0); setExportUrl(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const stream = (canvas as any).captureStream(FPS) as MediaStream;

      // Audio mixing
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = ac.createMediaStreamDestination();

      const audioEls: HTMLAudioElement[] = [];
      const startAudio = (url: string, vol: number) => {
        const a = new Audio(url); a.crossOrigin = "anonymous"; a.loop = false;
        const src = ac.createMediaElementSource(a);
        const g = ac.createGain(); g.gain.value = vol;
        src.connect(g); g.connect(dest);
        audioEls.push(a);
        return a;
      };
      const musicAudio = musicUrl ? startAudio(musicUrl, musicVol) : null;
      const voAudio = voUrl ? startAudio(voUrl, 1.0) : null;

      const tracks: MediaStreamTrack[] = [...stream.getTracks(), ...dest.stream.getTracks()];
      const combined = new MediaStream(tracks);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const rec = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 6_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      const done = new Promise<void>((res) => { rec.onstop = () => res(); });
      rec.start(250);

      if (musicAudio) musicAudio.play().catch(() => {});
      if (voAudio) voAudio.play().catch(() => {});

      let elapsed = 0;
      const drawFrame = (vid: HTMLVideoElement, t: number) => {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        // center-crop to 9:16
        const vw = vid.videoWidth, vh = vid.videoHeight;
        if (vw && vh) {
          const targetRatio = W / H;
          const srcRatio = vw / vh;
          let sx = 0, sy = 0, sw = vw, sh = vh;
          if (srcRatio > targetRatio) {
            sw = vh * targetRatio; sx = (vw - sw) / 2;
          } else {
            sh = vw / targetRatio; sy = (vh - sh) / 2;
          }
          ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, W, H);
        }
        // captions
        const cap = captionWindows.find((c) => t >= c.start && t < c.end);
        if (cap) {
          ctx.font = "700 64px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          const text = cap.text;
          const y = H - 320;
          // padded background
          const metrics = ctx.measureText(text);
          const padX = 40, padY = 24;
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          ctx.fillRect((W - metrics.width) / 2 - padX, y - 60 - padY, metrics.width + padX * 2, 60 + padY * 1.5);
          ctx.fillStyle = "#fff";
          ctx.fillText(text, W / 2, y);
        }
      };

      const playClip = (clip: Clip) => new Promise<void>((resolve) => {
        const v = document.createElement("video");
        v.src = clip.url; v.muted = clip.muted; v.playsInline = true;
        v.crossOrigin = "anonymous";
        v.preload = "auto";
        v.onloadedmetadata = () => {
          try { v.currentTime = clip.trimStart; } catch {}
          v.play().catch(() => {});
          const clipDur = clip.trimEnd - clip.trimStart;
          const startWall = performance.now();
          const tick = () => {
            const wallElapsed = (performance.now() - startWall) / 1000;
            const t = elapsed + wallElapsed;
            drawFrame(v, t);
            setProgress(Math.min(1, t / totalDuration));
            if (wallElapsed >= clipDur) {
              v.pause();
              elapsed += clipDur;
              resolve();
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        };
        v.onerror = () => { resolve(); };
      });

      for (const c of clips) {
        await playClip(c);
      }
      rec.stop();
      audioEls.forEach((a) => { a.pause(); });
      await done;
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      toast.success("Export ready");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const downloadExport = () => {
    if (!exportUrl) return;
    const a = document.createElement("a"); a.href = exportUrl; a.download = `postspark-short-${Date.now()}.webm`; a.click();
  };

  return (
    <div className="space-y-6">
      {!supportsExport && (
        <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4 text-[13px] text-[#92400E]">
          Browser export uses MediaRecorder which isn't available here. Preview will work — for export use desktop Chrome, Edge, or Brave.
        </div>
      )}

      {/* Clip dropzone + list */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-bold text-[#1A1A2E]">1. Video clips</p>
          <span className="text-[11px] text-[#6B7280]">{clips.length}/5 · {totalDuration.toFixed(1)}s / {MAX_TOTAL_S}s</span>
        </div>
        <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
          className="rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAF8] p-6 text-center hover:border-[#7C3AED]/40 hover:bg-[#F3F0FF]/40 transition">
          <Upload className="mx-auto h-8 w-8 text-[#9CA3AF]" />
          <p className="mt-2 text-[13px] text-[#6B7280]">Drag in clips, or</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black">
            <Film className="h-3.5 w-3.5" /> Choose clips
            <input type="file" accept="video/*" multiple className="hidden" onChange={onPickClips} />
          </label>
          <p className="mt-2 text-[11px] text-[#9CA3AF]">mp4/webm/mov, up to 5 clips, 50MB each</p>
        </div>

        {clips.length > 0 && (
          <div className="mt-4 space-y-2">
            {clips.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1A1A2E] text-[12px] font-bold text-white">{i + 1}</span>
                <video src={c.url} className="h-14 w-10 rounded object-cover bg-black" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#1A1A2E]">{c.file.name}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#6B7280]">
                    <Scissors className="h-3 w-3" />
                    <input type="number" step="0.1" min={0} max={c.duration} value={c.trimStart}
                      onChange={(e) => setClips((p) => p.map((x) => x.id === c.id ? { ...x, trimStart: Math.max(0, Math.min(parseFloat(e.target.value) || 0, x.trimEnd - 0.5)) } : x))}
                      className="w-16 rounded border border-[#E5E7EB] px-1.5 py-0.5" />
                    <span>→</span>
                    <input type="number" step="0.1" min={0} max={c.duration} value={c.trimEnd}
                      onChange={(e) => setClips((p) => p.map((x) => x.id === c.id ? { ...x, trimEnd: Math.min(x.duration, Math.max(parseFloat(e.target.value) || 0, x.trimStart + 0.5)) } : x))}
                      className="w-16 rounded border border-[#E5E7EB] px-1.5 py-0.5" />
                    <span>= {(c.trimEnd - c.trimStart).toFixed(1)}s</span>
                  </div>
                </div>
                <button onClick={() => setClips((p) => p.map((x) => x.id === c.id ? { ...x, muted: !x.muted } : x))}
                  className="rounded-md p-1.5 text-[#6B7280] hover:text-[#1A1A2E]" title={c.muted ? "Unmute" : "Mute"}>
                  {c.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <div className="flex flex-col">
                  <button onClick={() => moveClip(i, -1)} disabled={i === 0} className="rounded p-0.5 text-[#6B7280] hover:text-[#7C3AED] disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => moveClip(i, 1)} disabled={i === clips.length - 1} className="rounded p-0.5 text-[#6B7280] hover:text-[#7C3AED] disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <button onClick={() => removeClip(i)} className="rounded-md p-1.5 text-[#6B7280] hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Captions + audio */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-[#1A1A2E]"><Type className="h-3.5 w-3.5" /> Captions (burned in)</p>
          <textarea value={captions} onChange={(e) => setCaptions(e.target.value)} rows={6}
            placeholder="One sentence per line. Auto-timed across your clips."
            className="ps-input w-full" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-[#1A1A2E]"><Music2 className="h-3.5 w-3.5" /> Background music</p>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A1A2E] hover:border-[#7C3AED]">
              <Upload className="h-3.5 w-3.5" /> {musicFile ? musicFile.name.slice(0, 24) : "Upload .mp3"}
              <input type="file" accept="audio/*" className="hidden" onChange={onMusic} />
            </label>
            {musicUrl && (
              <div className="mt-2">
                <audio controls src={musicUrl} className="w-full" />
                <label className="mt-2 block text-[11px] text-[#6B7280]">Volume {Math.round(musicVol * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={musicVol} onChange={(e) => setMusicVol(parseFloat(e.target.value))} className="w-full" />
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-[#1A1A2E]"><Mic className="h-3.5 w-3.5" /> Voiceover</p>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A1A2E] hover:border-[#7C3AED]">
              <Upload className="h-3.5 w-3.5" /> {voFile ? voFile.name.slice(0, 24) : "Upload .mp3 / .wav"}
              <input type="file" accept="audio/*" className="hidden" onChange={onVo} />
            </label>
            {voUrl && <audio controls src={voUrl} className="mt-2 w-full" />}
            <p className="mt-2 text-[11px] text-[#9CA3AF]">Tip: generate one in Shorts Studio and drop it here.</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#0B0B1F] p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-bold text-white">Preview (9:16)</p>
          <button onClick={togglePlay} disabled={!clips.length}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-[#1A1A2E] hover:bg-[#F3F0FF] disabled:opacity-50">
            {playing ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Play</>}
          </button>
        </div>
        <div className="mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-xl bg-black ring-2 ring-white/10">
          <video ref={previewRef} className="h-full w-full object-cover" playsInline muted />
        </div>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-bold text-[#1A1A2E]">Export</p>
            <p className="text-[12px] text-[#6B7280]">{W}×{H} · {FPS}fps · WebM</p>
          </div>
          <button onClick={exportVideo} disabled={exporting || !clips.length || !supportsExport}
            className="ps-generate-btn !w-auto !px-6">
            {exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Rendering {(progress * 100).toFixed(0)}%</> : <><Film className="h-4 w-4" /> Export Video</>}
          </button>
        </div>
        {exporting && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F0FF]">
            <div className="h-full bg-[#7C3AED] transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        {exportUrl && (
          <div className="mt-4 space-y-2">
            <video src={exportUrl} controls className="mx-auto w-full max-w-[280px] rounded-xl bg-black" />
            <button onClick={downloadExport} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-4 py-2 text-[13px] font-bold text-white hover:bg-black">
              <Download className="h-3.5 w-3.5" /> Download .webm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
