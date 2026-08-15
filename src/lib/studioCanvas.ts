/**
 * Client-side canvas helpers for Image Studio pro features:
 * platform export packs, outpaint padding, inpaint masks, logo compositing.
 * All pure browser code — no server calls.
 */

export type ExportSize = { id: string; label: string; w: number; h: number };

export const EXPORT_PACK: ExportSize[] = [
  { id: "x", label: "X / Twitter", w: 1600, h: 900 },
  { id: "linkedin", label: "LinkedIn", w: 1200, h: 627 },
  { id: "ig-square", label: "Instagram square", w: 1080, h: 1080 },
  { id: "ig-story", label: "Instagram story", w: 1080, h: 1920 },
  { id: "yt", label: "YouTube thumbnail", w: 1280, h: 720 },
];

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/** Center-crop + cover-resize an image into an exact w×h data URL. */
export async function resizeCover(src: string, w: number, h: number): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return canvas.toDataURL("image/png");
}

/**
 * Pad an image out to a new aspect ratio with transparent-ish canvas so the
 * model can outpaint (fill) the empty margins.
 */
export async function padToAspect(
  src: string,
  target: "square" | "portrait" | "landscape",
): Promise<string> {
  const ratio = target === "square" ? 1 : target === "portrait" ? 9 / 16 : 16 / 9;
  const img = await loadImage(src);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let w = iw;
  let h = ih;
  if (iw / ih > ratio) h = Math.round(iw / ratio);
  else w = Math.round(ih * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2);
  return canvas.toDataURL("image/png");
}

/** Composite a logo onto an image at a corner, sized as a % of the width. */
export async function compositeLogo(
  src: string,
  logoUrl: string,
  placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" = "bottom-right",
  scale = 0.16,
): Promise<string> {
  const [img, logo] = await Promise.all([loadImage(src), loadImage(logoUrl)]);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const lw = canvas.width * scale;
  const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
  const pad = canvas.width * 0.04;
  const x = placement.includes("left") ? pad : canvas.width - lw - pad;
  const y = placement.includes("top") ? pad : canvas.height - lh - pad;
  ctx.drawImage(logo, x, y, lw, lh);
  return canvas.toDataURL("image/png");
}

/** Random 9-digit seed used for consistency locking. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 999_999_999);
}
