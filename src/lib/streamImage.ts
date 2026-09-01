/**
 * Client SSE reader for the Image Studio streaming route.
 * Emits progressive frames (blurred previews) and a final frame.
 * Fully cancelable through the passed AbortSignal.
 */
export async function streamImage(
  url: string,
  body: Record<string, unknown>,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
  opts: { headers?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<{ imageUrl: string | null; savedUrl?: string; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let error = `Streaming failed (${res.status})`;
    try {
      const txt = await res.text();
      const json = JSON.parse(txt);
      if (json?.error) error = json.error;
      else if (txt) error = txt.slice(0, 200);
    } catch {
      /* keep default */
    }
    return { imageUrl: null, error };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let last: string | null = null;
  let final: string | null = null;
  /** Public storage URL emitted by the server once the tile is persisted. */
  let savedUrl: string | undefined;

  const toDataUrl = (v: string) => (v.startsWith("data:") ? v : `data:image/png;base64,${v}`);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() || "";
    for (const frame of frames) {
      if (/event:\s*studio\.saved/.test(frame)) {
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const j = JSON.parse(line.slice(5).trim());
            if (j?.url) savedUrl = j.url as string;
          } catch {
            /* ignore */
          }
        }
        continue;
      }
      const isFinal = /event:\s*\S*completed/.test(frame);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const b64 =
            json.b64_json ||
            json?.data?.[0]?.b64_json ||
            json?.image?.b64_json ||
            json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
            null;
          if (!b64) continue;
          last = toDataUrl(b64);
          if (isFinal) final = last;
          onFrame(last, isFinal);
        } catch {
          /* partial JSON — ignore */
        }
      }
    }
  }

  const result = final || last;
  // Prefer the persisted storage URL: keeping a multi-MB data URL in React
  // state causes jank and breaks downloads/exports.
  if (savedUrl) return { imageUrl: savedUrl, savedUrl };
  return result ? { imageUrl: result } : { imageUrl: null, error: "NO_FRAMES" };
}
