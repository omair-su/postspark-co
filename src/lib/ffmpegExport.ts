// In-browser FFmpeg helpers. Lazy-loaded from CDN so the wasm never ships
// with the SSR bundle.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

async function getFFmpeg(onProgress?: (p: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loading) return loading;
  loading = (async () => {
    const ff = new FFmpeg();
    const base = "https://unpkg.com/@ffmpeg/[email protected]/dist/umd";
    await ff.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    if (onProgress) ff.on("progress", ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))));
    ffmpegInstance = ff;
    return ff;
  })();
  return loading;
}

// Format seconds → SRT timestamp "HH:MM:SS,mmm"
function srtTs(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t - Math.floor(t)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function captionsToSrt(caps: Array<{ start: number; end: number; text: string }>): string {
  return caps
    .filter((c) => c.end > c.start)
    .sort((a, b) => a.start - b.start)
    .map((c, i) => `${i + 1}\n${srtTs(c.start)} --> ${srtTs(c.end)}\n${c.text}\n`)
    .join("\n");
}

/**
 * Transcode an in-memory WebM (produced by MediaRecorder) into an MP4 with
 * H.264 video + AAC audio, optionally burning captions via the subtitles
 * filter. Returns a Blob you can hand to the user.
 */
export async function transcodeWebmToMp4(
  webm: Blob,
  opts: { srt?: string; onProgress?: (p: number) => void } = {},
): Promise<Blob> {
  const ff = await getFFmpeg(opts.onProgress);
  await ff.writeFile("in.webm", await fetchFile(webm));

  const args: string[] = ["-i", "in.webm"];
  if (opts.srt) {
    await ff.writeFile("subs.srt", new TextEncoder().encode(opts.srt));
    args.push(
      "-vf",
      "subtitles=subs.srt:force_style='FontName=Inter,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,Alignment=2,MarginV=120,Bold=1'",
    );
  }
  args.push(
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "160k",
    "-movflags", "+faststart",
    "out.mp4",
  );

  await ff.exec(args);
  const data = (await ff.readFile("out.mp4")) as Uint8Array;
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  try { await ff.deleteFile("in.webm"); } catch { /* ignore */ }
  try { if (opts.srt) await ff.deleteFile("subs.srt"); } catch { /* ignore */ }
  try { await ff.deleteFile("out.mp4"); } catch { /* ignore */ }
  return new Blob([bytes.buffer as ArrayBuffer], { type: "video/mp4" });
}
