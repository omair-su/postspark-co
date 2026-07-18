import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Upload, Film, X, Music2, Mic, Type, Download, Play, Pause,
  VolumeX, Volume2, Lock, Sparkles, Save, FolderOpen, Trash2,
  Loader2, Plus, ChevronLeft, ChevronRight, Scissors, Copy as CopyIcon,
  Wand2, Captions,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  listEditorProjects, loadEditorProject, saveEditorProject, deleteEditorProject,
} from "@/lib/editorProjects.functions";
import { startMp4Render, pollMp4Render } from "@/lib/cloudRender.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { captionsToSrt, transcodeWebmToMp4 } from "@/lib/ffmpegExport";

// ── domain types ───────────────────────────────────────────────
interface Clip {
  id: string;
  name: string;
  url: string;            // object URL (volatile) or remote URL
  duration: number;       // source duration (s)
  trimStart: number;
  trimEnd: number;
  muted: boolean;
}
interface Caption {
  id: string;
  start: number; // s
  end: number;   // s
  text: string;
}
interface Track {
  name: string;
  url: string | null;
  volume: number;
}
interface EditorProject {
  clips: Clip[];
  captions: Caption[];
  music: Track;
  vo: Track;
}

const W = 1080;
const H = 1920;
const FPS = 30;
const MAX_TOTAL_S = 90;
const DEFAULT_PXS = 50; // px per second

const emptyProject = (): EditorProject => ({
  clips: [],
  captions: [],
  music: { name: "", url: null, volume: 0.3 },
  vo: { name: "", url: null, volume: 1.0 },
});

export function TimelineEditor({ initialCaptions = "" }: { initialCaptions?: string }) {
  const { tier } = useSubscription();
  const isPro = tier === "pro" || tier === "agency";

  const [project, setProject] = useState<EditorProject>(emptyProject);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled project");
  const [drafts, setDrafts] = useState<Array<{ id: string; name: string; updated_at: string }>>([]);
  const [pxs, setPxs] = useState(DEFAULT_PXS); // px per second
  const [playhead, setPlayhead] = useState(0); // seconds
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [mp4Rendering, setMp4Rendering] = useState(false);
  const [mp4Status, setMp4Status] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const { user } = useAuth();

  const dragClipIdxRef = useRef<number | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const voAudioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const playStartWallRef = useRef<number>(0);
  const playStartHeadRef = useRef<number>(0);

  const supportsExport = typeof MediaRecorder !== "undefined" &&
    (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ||
     MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ||
     MediaRecorder.isTypeSupported("video/webm"));

  // ── derived ───────────────────────────────────────────────────
  const totalDuration = useMemo(
    () => project.clips.reduce((s, c) => s + (c.trimEnd - c.trimStart), 0),
    [project.clips],
  );

  const clipRanges = useMemo(() => {
    let acc = 0;
    return project.clips.map((c) => {
      const start = acc;
      const dur = c.trimEnd - c.trimStart;
      acc += dur;
      return { start, end: acc, dur, clip: c };
    });
  }, [project.clips]);

  const activeClipIdx = useMemo(() => {
    const i = clipRanges.findIndex((r) => playhead >= r.start && playhead < r.end);
    return i === -1 ? Math.max(0, clipRanges.length - 1) : i;
  }, [clipRanges, playhead]);

  // ── seed captions from SRT-ish text on first mount ────────────
  useEffect(() => {
    if (!initialCaptions || project.captions.length || !totalDuration) return;
    const sentences = initialCaptions
      .split(/\r?\n+/).map((s) => s.trim()).filter(Boolean)
      .flatMap((l) => l.split(/(?<=[.!?])\s+/)).filter(Boolean);
    if (!sentences.length) return;
    const per = totalDuration / sentences.length;
    setProject((p) => ({
      ...p,
      captions: sentences.map((text, i) => ({
        id: Math.random().toString(36).slice(2),
        start: i * per, end: (i + 1) * per, text,
      })),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCaptions, totalDuration]);

  // ── drafts list ───────────────────────────────────────────────
  const refreshDrafts = useCallback(() => {
    listEditorProjects().then((r: any) => setDrafts(r?.projects || [])).catch(() => {});
  }, []);
  useEffect(() => { if (isPro) refreshDrafts(); }, [isPro, refreshDrafts]);

  // ── autosave (Pro only, 4s debounce) ──────────────────────────
  const lastSerializedRef = useRef("");
  useEffect(() => {
    if (!isPro || !projectId) return;
    const serial = JSON.stringify({ name: projectName, project });
    if (serial === lastSerializedRef.current) return;
    lastSerializedRef.current = serial;
    const t = setTimeout(async () => {
      try {
        // strip object URLs — they don't survive page reloads
        const serializable = {
          ...project,
          clips: project.clips.map((c) => ({ ...c, url: c.url.startsWith("blob:") ? "" : c.url })),
        };
        await saveEditorProject({ data: { id: projectId, name: projectName, projectJson: serializable as any } });
      } catch { /* ignore */ }
    }, 4000);
    return () => clearTimeout(t);
  }, [project, projectName, projectId, isPro]);

  // ── clip add / mutate ─────────────────────────────────────────
  const addClips = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newClips: Clip[] = [];
    for (const file of arr) {
      if (!file.type.startsWith("video/")) { toast.error(`${file.name}: not a video`); continue; }
      if (file.size > 80 * 1024 * 1024) { toast.error(`${file.name}: > 80MB`); continue; }
      if (project.clips.length + newClips.length >= 8) { toast.error("Max 8 clips"); break; }
      const url = URL.createObjectURL(file);
      const dur = await new Promise<number>((res) => {
        const v = document.createElement("video");
        v.preload = "metadata"; v.src = url;
        v.onloadedmetadata = () => res(v.duration || 10);
        v.onerror = () => res(10);
      });
      newClips.push({
        id: Math.random().toString(36).slice(2),
        name: file.name, url, duration: dur,
        trimStart: 0, trimEnd: Math.min(dur, 15), muted: false,
      });
    }
    if (newClips.length) setProject((p) => ({ ...p, clips: [...p.clips, ...newClips] }));
  };

  const updateClip = (id: string, patch: Partial<Clip>) =>
    setProject((p) => ({ ...p, clips: p.clips.map((c) => c.id === id ? { ...c, ...patch } : c) }));

  const removeClip = (id: string) =>
    setProject((p) => ({ ...p, clips: p.clips.filter((c) => c.id !== id) }));

  const duplicateClip = (id: string) =>
    setProject((p) => {
      const i = p.clips.findIndex((c) => c.id === id);
      if (i < 0) return p;
      const orig = p.clips[i];
      const copy: Clip = { ...orig, id: Math.random().toString(36).slice(2), name: `${orig.name} (copy)` };
      const next = [...p.clips]; next.splice(i + 1, 0, copy);
      return { ...p, clips: next };
    });

  const splitClipAtPlayhead = (id: string) => {
    const range = clipRanges.find((r) => r.clip.id === id);
    if (!range) return;
    const localT = playhead - range.start + range.clip.trimStart;
    if (localT <= range.clip.trimStart + 0.5 || localT >= range.clip.trimEnd - 0.5) {
      toast.error("Move playhead inside the clip to split");
      return;
    }
    setProject((p) => {
      const i = p.clips.findIndex((c) => c.id === id);
      if (i < 0) return p;
      const orig = p.clips[i];
      const left: Clip = { ...orig, id: Math.random().toString(36).slice(2), trimEnd: localT };
      const right: Clip = { ...orig, id: Math.random().toString(36).slice(2), trimStart: localT };
      const next = [...p.clips]; next.splice(i, 1, left, right);
      return { ...p, clips: next };
    });
    toast.success("Clip split at playhead");
  };

  // ── drag-reorder (HTML5 DnD) ─────────────────────────────────
  const onClipDragStart = (i: number) => () => { dragClipIdxRef.current = i; };
  const onClipDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault(); setDragOverIdx(i);
  };
  const onClipDrop = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragClipIdxRef.current;
    setDragOverIdx(null);
    dragClipIdxRef.current = null;
    if (from === null || from === i) return;
    setProject((p) => {
      const next = [...p.clips];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return { ...p, clips: next };
    });
  };

  // ── trim handles (drag on timeline) ──────────────────────────
  const startTrimDrag = (clipId: string, side: "L" | "R") => (e: React.MouseEvent) => {
    e.preventDefault();
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const startX = e.clientX;
    const origTrimStart = clip.trimStart;
    const origTrimEnd = clip.trimEnd;
    const onMove = (ev: MouseEvent) => {
      const deltaSec = (ev.clientX - startX) / pxs;
      const snap = (n: number) => Math.round(n * 10) / 10; // 100ms snap
      if (side === "L") {
        const next = Math.max(0, Math.min(snap(origTrimStart + deltaSec), origTrimEnd - 0.5));
        updateClip(clipId, { trimStart: next });
      } else {
        const next = Math.max(origTrimStart + 0.5, Math.min(snap(origTrimEnd + deltaSec), clip.duration));
        updateClip(clipId, { trimEnd: next });
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── playhead scrubbing on ruler ──────────────────────────────
  const onRulerClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setPlayhead(Math.max(0, Math.min(totalDuration, x / pxs)));
  };

  // ── playback loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      previewVideoRef.current?.pause();
      return;
    }
    playStartWallRef.current = performance.now();
    playStartHeadRef.current = playhead;
    const tick = () => {
      const wallS = (performance.now() - playStartWallRef.current) / 1000;
      const t = playStartHeadRef.current + wallS;
      if (t >= totalDuration) { setPlaying(false); setPlayhead(totalDuration); return; }
      setPlayhead(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // ── drive preview <video> from playhead ──────────────────────
  useEffect(() => {
    const v = previewVideoRef.current; if (!v) return;
    const r = clipRanges[activeClipIdx]; if (!r) return;
    const localT = playhead - r.start + r.clip.trimStart;
    if (v.src !== r.clip.url) { v.src = r.clip.url; v.muted = r.clip.muted; }
    if (Math.abs(v.currentTime - localT) > 0.2) {
      try { v.currentTime = localT; } catch { /* ignore */ }
    }
    if (playing) { v.play().catch(() => {}); } else { v.pause(); }
  }, [playhead, activeClipIdx, clipRanges, playing]);

  // ── preview: music + voiceover audio synced to playhead ──────
  useEffect(() => {
    const ensure = (ref: React.MutableRefObject<HTMLAudioElement | null>, url: string | null, volume: number) => {
      if (!url) {
        if (ref.current) { ref.current.pause(); ref.current.src = ""; ref.current = null; }
        return;
      }
      if (!ref.current || ref.current.src !== url) {
        if (ref.current) ref.current.pause();
        const a = new Audio(url);
        a.preload = "auto";
        a.crossOrigin = "anonymous";
        ref.current = a;
      }
      ref.current.volume = Math.max(0, Math.min(1, volume));
    };
    ensure(musicAudioRef, project.music.url, project.music.volume);
    ensure(voAudioRef, project.vo.url, project.vo.volume);
  }, [project.music.url, project.music.volume, project.vo.url, project.vo.volume]);

  useEffect(() => {
    const sync = (a: HTMLAudioElement | null) => {
      if (!a) return;
      if (Math.abs(a.currentTime - playhead) > 0.25) {
        try { a.currentTime = Math.min(playhead, Number.isFinite(a.duration) ? a.duration : playhead); } catch { /* ignore */ }
      }
      if (playing) a.play().catch(() => {}); else a.pause();
    };
    sync(musicAudioRef.current);
    sync(voAudioRef.current);
  }, [playing, playhead]);

  useEffect(() => () => {
    musicAudioRef.current?.pause();
    voAudioRef.current?.pause();
  }, []);

  // ── spacebar play/pause ──────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── caption editing ──────────────────────────────────────────
  const addCaption = () => {
    const start = Math.min(playhead, Math.max(0, totalDuration - 2));
    setProject((p) => ({
      ...p,
      captions: [...p.captions, {
        id: Math.random().toString(36).slice(2),
        start, end: Math.min(start + 2, totalDuration || start + 2),
        text: "New caption",
      }],
    }));
  };
  const updateCaption = (id: string, patch: Partial<Caption>) =>
    setProject((p) => ({ ...p, captions: p.captions.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  const removeCaption = (id: string) =>
    setProject((p) => ({ ...p, captions: p.captions.filter((c) => c.id !== id) }));

  // ── music / VO ──────────────────────────────────────────────
  const pickAudio = (which: "music" | "vo") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const cur = project[which];
    if (cur.url && cur.url.startsWith("blob:")) URL.revokeObjectURL(cur.url);
    const url = URL.createObjectURL(f);
    setProject((p) => ({ ...p, [which]: { ...p[which], name: f.name, url } } as any));
  };

  // ── draft ops ────────────────────────────────────────────────
  const saveDraft = async () => {
    if (!isPro) return toast.error("Pro feature — upgrade to save drafts");
    setSaving(true);
    try {
      const serializable = {
        ...project,
        clips: project.clips.map((c) => ({ ...c, url: c.url.startsWith("blob:") ? "" : c.url })),
      };
      const r: any = await saveEditorProject({ data: { id: projectId || undefined, name: projectName, projectJson: serializable as any } });
      if (r.error) throw new Error(r.error);
      setProjectId(r.id);
      refreshDrafts();
      toast.success("Draft saved");
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };
  const openDraft = async (id: string) => {
    try {
      const r: any = await loadEditorProject({ data: { id } });
      if (!r.project) return toast.error("Couldn't load");
      const pj = r.project.project_json as EditorProject;
      setProject({ ...emptyProject(), ...pj });
      setProjectId(r.project.id);
      setProjectName(r.project.name);
      setPlayhead(0);
      toast.success(`Loaded "${r.project.name}"`);
    } catch { toast.error("Load failed"); }
  };
  const trashDraft = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    await deleteEditorProject({ data: { id } });
    if (projectId === id) setProjectId(null);
    refreshDrafts();
    toast.success("Deleted");
  };
  const newDraft = () => {
    setProject(emptyProject());
    setProjectId(null);
    setProjectName("Untitled project");
    setPlayhead(0);
  };

  // ── export (WebM) ────────────────────────────────────────────
  const exportVideo = async () => {
    if (!isPro) return toast.error("Pro feature — upgrade to export");
    if (!project.clips.length) return toast.error("Add at least one clip");
    if (totalDuration > MAX_TOTAL_S) return toast.error(`Total exceeds ${MAX_TOTAL_S}s`);
    if (!supportsExport) return toast.error("Browser export not supported — use Chrome/Edge");
    setExporting(true); setProgress(0); setExportUrl(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const stream = (canvas as any).captureStream(FPS) as MediaStream;

      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = ac.createMediaStreamDestination();
      const audioEls: HTMLAudioElement[] = [];
      const startAudio = (url: string, vol: number) => {
        const a = new Audio(url); a.crossOrigin = "anonymous";
        const src = ac.createMediaElementSource(a);
        const g = ac.createGain(); g.gain.value = vol;
        src.connect(g); g.connect(dest);
        audioEls.push(a);
        return a;
      };
      const musicAudio = project.music.url ? startAudio(project.music.url, project.music.volume) : null;
      const voAudio = project.vo.url ? startAudio(project.vo.url, project.vo.volume) : null;

      const combined = new MediaStream([...stream.getTracks(), ...dest.stream.getTracks()]);
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

      const drawCaptionsAt = (t: number) => {
        const caps = project.captions.filter((c) => t >= c.start && t < c.end);
        for (const cap of caps) {
          ctx.font = "700 64px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          const lines = cap.text.split("\n");
          const lineH = 78;
          const baseY = H - 320 - (lines.length - 1) * lineH;
          for (let i = 0; i < lines.length; i++) {
            const y = baseY + i * lineH;
            const m = ctx.measureText(lines[i]);
            ctx.fillStyle = "rgba(0,0,0,0.78)";
            ctx.fillRect((W - m.width) / 2 - 36, y - 56, m.width + 72, 72);
            ctx.fillStyle = "#fff";
            ctx.fillText(lines[i], W / 2, y);
          }
        }
      };

      let elapsed = 0;
      const playClip = (clip: Clip) => new Promise<void>((resolve) => {
        const v = document.createElement("video");
        v.src = clip.url; v.muted = clip.muted; v.playsInline = true;
        v.crossOrigin = "anonymous"; v.preload = "auto";
        const onLoaded = () => {
          try { v.currentTime = clip.trimStart; } catch {}
          v.play().catch(() => {});
          const clipDur = clip.trimEnd - clip.trimStart;
          const startWall = performance.now();
          const tick = () => {
            const wall = (performance.now() - startWall) / 1000;
            const t = elapsed + wall;
            ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
            const vw = v.videoWidth, vh = v.videoHeight;
            if (vw && vh) {
              const tr = W / H, sr = vw / vh;
              let sx = 0, sy = 0, sw = vw, sh = vh;
              if (sr > tr) { sw = vh * tr; sx = (vw - sw) / 2; }
              else { sh = vw / tr; sy = (vh - sh) / 2; }
              ctx.drawImage(v, sx, sy, sw, sh, 0, 0, W, H);
            }
            drawCaptionsAt(t);
            setProgress(Math.min(1, t / totalDuration));
            if (wall >= clipDur) { v.pause(); elapsed += clipDur; resolve(); return; }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        };
        v.addEventListener("loadedmetadata", onLoaded, { once: true });
        v.onerror = () => resolve();
      });

      for (const c of project.clips) await playClip(c);
      rec.stop();
      audioEls.forEach((a) => a.pause());
      await done;
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setExportBlob(blob);
      setMp4Url(null);
      toast.success("Export ready");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally { setExporting(false); }
  };

  const downloadExport = () => {
    if (!exportUrl) return;
    const a = document.createElement("a"); a.href = exportUrl;
    a.download = `${projectName.replace(/\W+/g, "-")}-${Date.now()}.webm`; a.click();
  };

  const downloadMp4 = () => {
    if (!mp4Url) return;
    const a = document.createElement("a"); a.href = mp4Url;
    a.download = `${projectName.replace(/\W+/g, "-")}-${Date.now()}.mp4`;
    a.target = "_blank"; a.rel = "noopener"; a.click();
  };

  const renderMp4Cloud = async () => {
    if (!isPro) return toast.error("Pro feature — upgrade to render MP4");
    if (!exportBlob || !user?.id) return toast.error("Export WebM first");
    setMp4Rendering(true); setMp4Status("Uploading…"); setMp4Url(null);
    try {
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `${user.id}/render-source/${uid}.webm`;
      const up = await supabase.storage.from("shorts-videos")
        .upload(path, exportBlob, { contentType: "video/webm", upsert: true });
      if (up.error) throw new Error(up.error.message);

      setMp4Status("Starting render…");
      const started: any = await startMp4Render({ data: { webmPath: path } });
      const predictionId = started.predictionId;
      if (!predictionId) throw new Error("No prediction id");

      setMp4Status("Rendering MP4…");
      const deadline = Date.now() + 6 * 60 * 1000;
      let delay = 3000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay + 1000, 7000);
        const r: any = await pollMp4Render({ data: { predictionId } });
        if (r.status === "succeeded" && r.mp4Url) {
          setMp4Url(r.mp4Url);
          setMp4Status("Done");
          toast.success("MP4 ready");
          return;
        }
        if (r.status === "failed" || r.status === "canceled") {
          throw new Error(r.error || `Render ${r.status}`);
        }
        setMp4Status(`Rendering MP4… (${r.status})`);
      }
      throw new Error("Render timed out");
    } catch (e: any) {
      toast.error(e?.message || "MP4 render failed");
      setMp4Status("");
    } finally {
      setMp4Rendering(false);
    }
  };


  // ── render ──────────────────────────────────────────────────
  const timelineWidthPx = Math.max(600, totalDuration * pxs);

  return (
    <div className="space-y-5">
      {!isPro && (
        <div className="rounded-2xl border border-[#FCD34D] bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-[#B45309]" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#92400E]">Editor is a Pro feature</p>
              <p className="mt-0.5 text-[12px] text-[#B45309]">Build and preview free. Save drafts & export WebM on Pro.</p>
            </div>
            <Link to="/dashboard/billing" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#6D28D9]">
              <Sparkles className="h-3.5 w-3.5" /> Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Project bar */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 flex flex-wrap items-center gap-2">
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
        />
        <button onClick={newDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280] hover:border-[#7C3AED] hover:text-[#7C3AED]">
          <Plus className="h-3.5 w-3.5" /> New
        </button>
        <button onClick={saveDraft} disabled={saving || !isPro}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-black disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save draft
        </button>
      </div>

      {/* Saved drafts rail */}
      {isPro && drafts.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5 text-[#7C3AED]" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Drafts ({drafts.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {drafts.map((d) => (
              <div key={d.id} className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${
                projectId === d.id ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]" : "border-[#E5E7EB] bg-white text-[#1A1A2E] hover:border-[#7C3AED]/40"
              }`}>
                <button onClick={() => openDraft(d.id)} className="font-medium">
                  {d.name.slice(0, 40)}{d.name.length > 40 ? "…" : ""}
                </button>
                <button onClick={() => trashDraft(d.id)} className="opacity-0 group-hover:opacity-100 transition text-[#9CA3AF] hover:text-red-500" title="Delete">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-column: preview + asset upload */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Preview (9:16) */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#0B0B14] p-3">
          <div className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
            {project.clips.length ? (
              <video ref={previewVideoRef} className="h-full w-full object-cover" playsInline />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] text-white/40">No clips yet</div>
            )}
            {/* live captions overlay */}
            {project.captions.filter((c) => playhead >= c.start && playhead < c.end).map((c) => (
              <div key={c.id} className="absolute inset-x-2 bottom-12 text-center">
                <span className="inline-block rounded-md bg-black/80 px-2.5 py-1 text-[13px] font-bold leading-snug text-white shadow-lg">
                  {c.text}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-white/80">
            <button onClick={() => setPlaying((p) => !p)} disabled={!project.clips.length}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#6D28D9] disabled:opacity-40">
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <div className="text-[11px] tabular-nums">{playhead.toFixed(1)}s / {totalDuration.toFixed(1)}s</div>
          </div>
        </div>

        {/* Asset uploads */}
        <div className="space-y-3">
          {/* clips */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#1A1A2E]">Video clips <span className="text-[#6B7280] font-normal">({project.clips.length}/8)</span></p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black">
                <Film className="h-3.5 w-3.5" /> Add clips
                <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => e.target.files && addClips(e.target.files)} />
              </label>
            </div>
            <div onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addClips(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAF8] p-4 text-center text-[12px] text-[#6B7280]">
              <Upload className="mx-auto mb-1 h-5 w-5 text-[#9CA3AF]" />
              Drop mp4/webm/mov · up to 8 clips · 80MB each
            </div>
          </div>

          {/* music + vo */}
          <div className="grid gap-3 sm:grid-cols-2">
            <AudioRow icon={<Music2 className="h-4 w-4" />} label="Music" track={project.music}
              onPick={pickAudio("music")}
              onVolume={(v) => setProject((p) => ({ ...p, music: { ...p.music, volume: v } }))}
              onClear={() => setProject((p) => ({ ...p, music: { ...p.music, name: "", url: null } }))} />
            <AudioRow icon={<Mic className="h-4 w-4" />} label="Voiceover" track={project.vo}
              onPick={pickAudio("vo")}
              onVolume={(v) => setProject((p) => ({ ...p, vo: { ...p.vo, volume: v } }))}
              onClear={() => setProject((p) => ({ ...p, vo: { ...p.vo, name: "", url: null } }))} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
        <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Timeline</p>
          <div className="flex items-center gap-2">
            <button onClick={addCaption} className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] px-2 py-1 text-[11px] font-medium text-[#6B7280] hover:border-[#7C3AED] hover:text-[#7C3AED]" disabled={!totalDuration}>
              <Type className="h-3 w-3" /> Add caption
            </button>
            <span className="text-[10px] text-[#9CA3AF]">Zoom</span>
            <input type="range" min={20} max={120} value={pxs} onChange={(e) => setPxs(parseInt(e.target.value))} className="w-20 accent-[#7C3AED]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ width: `${timelineWidthPx}px` }} className="select-none">
            {/* Ruler */}
            <div onClick={onRulerClick} className="relative h-6 cursor-crosshair border-b border-[#E5E7EB] bg-[#FAFAF8]">
              {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, s) => (
                <div key={s} className="absolute top-0 h-full border-l border-[#E5E7EB]" style={{ left: s * pxs }}>
                  <span className="absolute left-1 top-0 text-[9px] text-[#9CA3AF]">{s}s</span>
                </div>
              ))}
              {/* playhead */}
              <div className="absolute top-0 z-20 h-full w-[2px] bg-[#EC4899]" style={{ left: playhead * pxs }} />
            </div>

            {/* Clip track */}
            <div className="relative h-14 border-b border-[#E5E7EB] bg-white">
              {clipRanges.map((r, i) => (
                <div key={r.clip.id}
                  draggable onDragStart={onClipDragStart(i)} onDragOver={onClipDragOver(i)} onDrop={onClipDrop(i)}
                  className={`absolute top-1 bottom-1 group cursor-grab active:cursor-grabbing rounded-md text-white text-[11px] overflow-hidden ${
                    i === activeClipIdx ? "ring-2 ring-[#7C3AED]" : "ring-1 ring-white/10"
                  } ${dragOverIdx === i ? "outline outline-2 outline-[#7C3AED]" : ""}`}
                  style={{
                    left: r.start * pxs, width: r.dur * pxs,
                    background: i % 2 === 0
                      ? "linear-gradient(135deg, #1A1A2E, #2D2D4A)"
                      : "linear-gradient(135deg, #2D2D4A, #4F46E5)",
                  }}
                  onClick={() => setPlayhead(r.start)}
                  title={`${r.clip.name} · ${r.dur.toFixed(1)}s`}
                >
                  {/* L trim */}
                  <div onMouseDown={startTrimDrag(r.clip.id, "L")}
                    className="absolute left-0 top-0 z-10 h-full w-2 cursor-ew-resize bg-[#EC4899]/0 hover:bg-[#EC4899]/80" />
                  {/* R trim */}
                  <div onMouseDown={startTrimDrag(r.clip.id, "R")}
                    className="absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize bg-[#EC4899]/0 hover:bg-[#EC4899]/80" />
                  <div className="px-2 py-1 truncate font-semibold">{i + 1}. {r.clip.name}</div>
                  <div className="px-2 text-[10px] opacity-70">{r.dur.toFixed(1)}s</div>
                  {/* mini context menu */}
                  <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={(e) => { e.stopPropagation(); updateClip(r.clip.id, { muted: !r.clip.muted }); }}
                      className="rounded bg-black/40 p-0.5 hover:bg-black/70" title="Mute/unmute">
                      {r.clip.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); splitClipAtPlayhead(r.clip.id); }}
                      className="rounded bg-black/40 p-0.5 hover:bg-black/70" title="Split at playhead">
                      <Scissors className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateClip(r.clip.id); }}
                      className="rounded bg-black/40 p-0.5 hover:bg-black/70" title="Duplicate">
                      <CopyIcon className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeClip(r.clip.id); }}
                      className="rounded bg-red-500/70 p-0.5 hover:bg-red-500" title="Delete">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {!project.clips.length && (
                <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#9CA3AF]">Add clips above</div>
              )}
            </div>

            {/* Caption track */}
            <div className="relative h-10 border-b border-[#E5E7EB] bg-[#F3F0FF]/40">
              {project.captions.map((c) => (
                <button key={c.id}
                  onClick={() => { setEditingCaptionId(c.id); setPlayhead(c.start); }}
                  className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-[#7C3AED] to-[#EC4899] px-2 text-left text-[10px] text-white overflow-hidden ring-1 ring-white/20 hover:ring-white ${
                    editingCaptionId === c.id ? "ring-2 ring-[#1A1A2E]" : ""
                  }`}
                  style={{ left: c.start * pxs, width: Math.max(40, (c.end - c.start) * pxs) }}
                  title={c.text}>
                  <span className="block truncate font-semibold">{c.text}</span>
                </button>
              ))}
              {!project.captions.length && (
                <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#9CA3AF]">Captions appear here · "Add caption" above</div>
              )}
            </div>

            {/* Music + VO indicator tracks */}
            <div className="relative h-7 border-b border-[#E5E7EB] bg-white text-[10px] text-[#6B7280]">
              <div className="absolute left-1 top-1.5">🎵 {project.music.url ? project.music.name : "—"}</div>
            </div>
            <div className="relative h-7 bg-white text-[10px] text-[#6B7280]">
              <div className="absolute left-1 top-1.5">🎙️ {project.vo.url ? project.vo.name : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption inline editor */}
      {editingCaptionId && (() => {
        const c = project.captions.find((x) => x.id === editingCaptionId);
        if (!c) return null;
        return (
          <div className="rounded-2xl border border-[#7C3AED]/30 bg-[#F3F0FF]/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">Edit caption</p>
              <button onClick={() => setEditingCaptionId(null)} className="text-[#9CA3AF] hover:text-[#1A1A2E]"><X className="h-4 w-4" /></button>
            </div>
            <textarea rows={2} value={c.text}
              onChange={(e) => updateCaption(c.id, { text: e.target.value })}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white p-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[#6B7280]">
              <label className="flex items-center gap-1.5">
                Start
                <input type="number" step="0.1" min={0} max={totalDuration} value={c.start}
                  onChange={(e) => updateCaption(c.id, { start: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-16 rounded border border-[#E5E7EB] px-1.5 py-0.5" />s
              </label>
              <label className="flex items-center gap-1.5">
                End
                <input type="number" step="0.1" min={0} max={totalDuration} value={c.end}
                  onChange={(e) => updateCaption(c.id, { end: Math.max(c.start + 0.1, parseFloat(e.target.value) || 0) })}
                  className="w-16 rounded border border-[#E5E7EB] px-1.5 py-0.5" />s
              </label>
              <button onClick={() => { removeCaption(c.id); setEditingCaptionId(null); }}
                className="ml-auto inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        );
      })()}

      {/* Export */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 flex-wrap">
        <div className="text-[12px] text-[#6B7280]">
          {project.clips.length ? <>Final length: <strong className="text-[#1A1A2E]">{totalDuration.toFixed(1)}s</strong> · 1080×1920 · 30fps</> : "Add clips to enable export"}
        </div>
        <div className="flex gap-2 flex-wrap">
          {exportUrl && (
            <button onClick={downloadExport} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100">
              <Download className="h-3.5 w-3.5" /> Download .webm
            </button>
          )}
          {mp4Url && (
            <button onClick={downloadMp4} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-[12px] font-bold text-sky-700 hover:bg-sky-100">
              <Download className="h-3.5 w-3.5" /> Download .mp4
            </button>
          )}
          {exportBlob && !mp4Url && (
            <button onClick={renderMp4Cloud} disabled={mp4Rendering || !isPro}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1A1A2E] bg-[#1A1A2E] px-3 py-2 text-[12px] font-bold text-white hover:bg-black disabled:opacity-50">
              {mp4Rendering ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {mp4Status || "Rendering…"}</> : <><Film className="h-3.5 w-3.5" /> Render MP4 (cloud)</>}
            </button>
          )}
          <button onClick={exportVideo} disabled={exporting || !project.clips.length || !isPro}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#EC4899] px-4 py-2 text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-40">
            {exporting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting {Math.round(progress * 100)}%</> : <><Download className="h-3.5 w-3.5" /> Export WebM</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function AudioRow({ icon, label, track, onPick, onVolume, onClear }: {
  icon: React.ReactNode; label: string; track: Track;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolume: (v: number) => void; onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[#1A1A2E]">{icon} {label}</div>
      {track.url ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-[11px] text-[#6B7280]">{track.name}</span>
            <button onClick={onClear} className="rounded p-1 text-[#9CA3AF] hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={track.volume} onChange={(e) => onVolume(parseFloat(e.target.value))} className="w-full accent-[#7C3AED]" />
          <div className="text-[10px] text-[#9CA3AF]">Volume: {Math.round(track.volume * 100)}%</div>
        </div>
      ) : (
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#6B7280] hover:border-[#7C3AED] hover:text-[#7C3AED]">
          <Upload className="h-3 w-3" /> Choose file
          <input type="file" accept="audio/*" className="hidden" onChange={onPick} />
        </label>
      )}
    </div>
  );
}
