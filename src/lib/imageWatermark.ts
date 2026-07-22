// Shared watermark helpers used by Image Studio, Thumbnail, and Carousel.
// Brand Kit mirrors watermark_settings into localStorage on save so generators
// can read the current settings synchronously.

const WM_ON_KEY = "ps_watermark_on";
const WM_TEXT_KEY = "ps_watermark_text";
const WM_OPACITY_KEY = "ps_watermark_opacity"; // 10..100 (percent)
const WM_PLACEMENT_KEY = "ps_watermark_placement";

export type WatermarkPlacement =
  | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

export interface WatermarkOptions {
  opacity?: number;         // 0..1 (default 0.9 for text, background 0.5)
  placement?: WatermarkPlacement; // default bottom-right
}

export function getWatermarkState(): {
  on: boolean; text: string; opacity: number; placement: WatermarkPlacement;
} {
  if (typeof window === "undefined") {
    return { on: false, text: "@yourbrand", opacity: 90, placement: "bottom-right" };
  }
  const opacityRaw = Number(localStorage.getItem(WM_OPACITY_KEY) || "90");
  const opacity = Number.isFinite(opacityRaw) ? Math.max(10, Math.min(100, opacityRaw)) : 90;
  const placement = (localStorage.getItem(WM_PLACEMENT_KEY) as WatermarkPlacement) || "bottom-right";
  return {
    on: localStorage.getItem(WM_ON_KEY) === "1",
    text: localStorage.getItem(WM_TEXT_KEY) || "@yourbrand",
    opacity,
    placement,
  };
}

export function setWatermarkState(
  on: boolean,
  text: string,
  opacity?: number,
  placement?: WatermarkPlacement,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WM_ON_KEY, on ? "1" : "0");
  localStorage.setItem(WM_TEXT_KEY, text);
  if (typeof opacity === "number") {
    localStorage.setItem(WM_OPACITY_KEY, String(Math.max(10, Math.min(100, Math.round(opacity)))));
  }
  if (placement) localStorage.setItem(WM_PLACEMENT_KEY, placement);
}

export function drawWatermarkOnCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  opts: WatermarkOptions = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !text) return;
  const opacity = Math.max(0, Math.min(1, opts.opacity ?? 0.9));
  const placement = opts.placement || "bottom-right";
  const fontSize = Math.max(14, Math.round(canvas.width * 0.022));
  ctx.save();
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  const padding = Math.round(fontSize * 0.6);
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width + padding * 2);
  const h = Math.ceil(fontSize * 1.6);
  let x = canvas.width - w - padding;
  let y = canvas.height - h - padding;
  if (placement === "bottom-left") { x = padding; }
  else if (placement === "top-right") { y = padding; }
  else if (placement === "top-left") { x = padding; y = padding; }
  else if (placement === "center") { x = (canvas.width - w) / 2; y = (canvas.height - h) / 2; }
  ctx.fillStyle = `rgba(0,0,0,${opacity * 0.55})`;
  ctx.beginPath();
  const r = h / 4;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${opacity})`;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padding, y + h / 2);
  ctx.restore();
}

// Apply watermark to a data: URL (or remote URL) and return a new PNG data URL.
export async function applyWatermark(srcUrl: string, text: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(srcUrl);
      ctx.drawImage(img, 0, 0);
      drawWatermarkOnCanvas(canvas, text);
      try { resolve(canvas.toDataURL("image/png")); } catch { resolve(srcUrl); }
    };
    img.onerror = () => resolve(srcUrl);
    img.src = srcUrl;
  });
}

// Download any URL (data or remote) as a PNG file. Re-encodes when source is JPEG.
export async function downloadAsPng(srcUrl: string, filename: string, watermarkText?: string) {
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = srcUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(img, 0, 0);
    if (watermarkText) drawWatermarkOnCanvas(canvas, watermarkText);
    const blob: Blob = await new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Fallback: open in a new tab so user can save manually
    window.open(srcUrl, "_blank", "noopener,noreferrer");
  }
}
