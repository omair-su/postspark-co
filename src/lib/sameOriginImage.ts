/**
 * Loads images in a way that never taints a canvas.
 *
 * `new Image()` with `crossOrigin = "anonymous"` fails (or worse: loads but
 * taints the canvas) whenever the remote host doesn't return permissive CORS
 * headers. Every canvas feature in the studio — watermark, brand logo lock,
 * platform export pack, PNG download — then dies inside `toDataURL()`.
 *
 * Strategy: pull the bytes with `fetch` (direct first, then through the app's
 * own `/api/public/image-proxy`), turn them into a blob URL, and load *that*.
 * Blob URLs are same-origin, so the canvas is always readable.
 *
 * Browser-only module.
 */

export class ImageAccessError extends Error {
  constructor(message = "This image could not be opened for editing") {
    super(message);
    this.name = "ImageAccessError";
  }
}

async function fetchBlob(url: string): Promise<Blob | null> {
  try {
    const r = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!r.ok) return null;
    const b = await r.blob();
    return b.size ? b : null;
  } catch {
    return null;
  }
}

/** Returns a same-origin (blob: or data:) URL for any image source. */
export async function toSameOriginUrl(src: string): Promise<{ url: string; revoke: () => void }> {
  if (src.startsWith("data:") || src.startsWith("blob:")) return { url: src, revoke: () => {} };

  let blob = await fetchBlob(src);
  if (!blob) blob = await fetchBlob(`/api/public/image-proxy?url=${encodeURIComponent(src)}`);
  if (!blob) throw new ImageAccessError();

  const objectUrl = URL.createObjectURL(blob);
  return { url: objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) };
}

/**
 * Loads an image element whose pixels are guaranteed readable from canvas.
 * Throws `ImageAccessError` instead of failing silently.
 */
export async function loadReadableImage(src: string): Promise<HTMLImageElement> {
  const { url, revoke } = await toSameOriginUrl(src);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new ImageAccessError());
      img.src = url;
    });
  } finally {
    // Give the decoder a tick before releasing the blob URL.
    setTimeout(revoke, 5_000);
  }
}

/** `canvas.toDataURL` that reports a real error instead of returning nothing. */
export function readCanvas(canvas: HTMLCanvasElement, type = "image/png"): string {
  try {
    return canvas.toDataURL(type);
  } catch {
    throw new ImageAccessError("This image's pixels are locked by its host, so it can't be edited here");
  }
}

/** `canvas.toBlob` with the same explicit failure behaviour. */
export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageAccessError())), type);
    } catch {
      reject(new ImageAccessError("This image's pixels are locked by its host, so it can't be edited here"));
    }
  });
}
