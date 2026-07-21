// Color math shared by the Brand Kit UI (picker tabs, ramps, extractor, auto-fix).
// Pure client-side, no dependencies.

import { contrastRatio } from "./contrast";

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return "#" + raw.split("").map((c) => c + c).join("").toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return "#" + raw.toLowerCase();
  return null;
}

export function hexToRgb(hex: string): RGB | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const n = parseInt(norm.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case rn: h = ((gn - bn) / d) % 6; break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const S = s / 100, L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const H = (h % 360) / 60;
  const x = c * (1 - Math.abs((H % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (0 <= H && H < 1) [r, g, b] = [c, x, 0];
  else if (H < 2) [r, g, b] = [x, c, 0];
  else if (H < 3) [r, g, b] = [0, c, x];
  else if (H < 4) [r, g, b] = [0, x, c];
  else if (H < 5) [r, g, b] = [x, 0, c];
  else[r, g, b] = [c, 0, x];
  const m = L - c / 2;
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

// ------- Tint / shade ramp -------
// Produce 11 stops (5 lighter, base, 5 darker) using HSL lightness offsets.
export function generateRamp(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex];
  const steps: number[] = [];
  // lighter → base → darker, evenly distributed relative to base lightness
  const lighterCount = 5, darkerCount = 5;
  const maxLight = 95, minLight = 8;
  for (let i = lighterCount; i >= 1; i--) {
    const t = i / lighterCount;
    steps.push(hsl.l + (maxLight - hsl.l) * t);
  }
  steps.push(hsl.l);
  for (let i = 1; i <= darkerCount; i++) {
    const t = i / darkerCount;
    steps.push(hsl.l - (hsl.l - minLight) * t);
  }
  return steps.map((l) => hslToHex({ h: hsl.h, s: Math.min(hsl.s, 92), l: Math.max(0, Math.min(100, Math.round(l))) }));
}

// ------- Contrast auto-fix -------
// Given a foreground and background, walk lightness of `adjust` (fg | bg)
// toward extreme until AA (4.5) is met. Returns null when unreachable.
export function suggestPassingShade(
  fg: string,
  bg: string,
  target: number = 4.5,
  adjust: "fg" | "bg" = "fg",
): string | null {
  const base = adjust === "fg" ? hexToHsl(fg) : hexToHsl(bg);
  const other = adjust === "fg" ? bg : fg;
  if (!base) return null;

  // Try darker first, then lighter — take the closest match.
  const tries: HSL[] = [];
  for (let l = base.l; l >= 0; l -= 2) tries.push({ ...base, l });
  for (let l = base.l + 2; l <= 100; l += 2) tries.push({ ...base, l });

  let best: { hex: string; ratio: number; distance: number } | null = null;
  for (const cand of tries) {
    const hex = hslToHex(cand);
    const ratio = adjust === "fg" ? contrastRatio(hex, other) : contrastRatio(other, hex);
    if (ratio >= target) {
      const distance = Math.abs(cand.l - base.l);
      if (!best || distance < best.distance) best = { hex, ratio, distance };
    }
  }
  return best?.hex ?? null;
}

// ------- Image → palette (k-means, client-side) -------
// Uses a downscaled canvas + fixed-iteration k-means for speed. No API needed.
export async function extractPaletteFromImage(
  fileOrUrl: File | string,
  k: number = 5,
): Promise<string[]> {
  const img = await loadImage(fileOrUrl);
  const size = 100; // downscale for speed
  const scale = Math.min(size / img.width, size / img.height, 1);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 200) continue; // skip transparency
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  if (pixels.length === 0) return [];

  // K-means++ seeding
  const centroids: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]];
  while (centroids.length < k) {
    const dists = pixels.map((p) => Math.min(...centroids.map((c) => distSq(p, c))));
    const total = dists.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let r = Math.random() * total;
    for (let i = 0; i < pixels.length; i++) {
      r -= dists[i];
      if (r <= 0) { centroids.push(pixels[i]); break; }
    }
  }

  // Iterate
  const assignments = new Array(pixels.length).fill(0);
  for (let iter = 0; iter < 12; iter++) {
    // Assign
    for (let i = 0; i < pixels.length; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = distSq(pixels[i], centroids[c]);
        if (d < bd) { bd = d; best = c; }
      }
      assignments[i] = best;
    }
    // Recompute
    const sums: (RGB & { n: number })[] = centroids.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r; sums[c].g += pixels[i].g; sums[c].b += pixels[i].b; sums[c].n++;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c].n > 0) {
        centroids[c] = { r: sums[c].r / sums[c].n, g: sums[c].g / sums[c].n, b: sums[c].b / sums[c].n };
      }
    }
  }

  // Sort by cluster size, dominant first
  const counts = new Array(centroids.length).fill(0);
  for (const a of assignments) counts[a]++;
  const ranked = centroids
    .map((c, i) => ({ c, n: counts[i] }))
    .sort((a, b) => b.n - a.n)
    .map((x) => rgbToHex(x.c));
  return ranked;
}

function distSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function loadImage(fileOrUrl: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof fileOrUrl === "string") {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrUrl);
    }
  });
}
