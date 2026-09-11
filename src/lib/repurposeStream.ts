/**
 * Client for the authenticated repurpose SSE endpoint.
 *
 * Emits token deltas as they arrive and resolves once the format is complete,
 * cancelled or failed. Pass an AbortSignal to cancel a single format.
 */
export interface StreamFormatArgs {
  token: string;
  signal?: AbortSignal;
  body: Record<string, unknown>;
  onDelta: (fullText: string, chunk: string) => void;
}

export async function streamRepurposeFormat({
  token,
  signal,
  body,
  onDelta,
}: StreamFormatArgs): Promise<{ output: string; error?: string; cancelled?: boolean }> {
  let res: Response;
  try {
    res = await fetch("/api/repurpose-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return { output: "", cancelled: true };
    return { output: "", error: "Network error — please try again." };
  }

  if (!res.ok || !res.body) {
    if (res.status === 402) return { output: "", error: "LIMIT_REACHED" };
    const text = await res.text().catch(() => "");
    let msg = text || `Generation failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) msg = parsed.error;
    } catch { /* plain text */ }
    return { output: "", error: msg };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let finalOutput = "";
  let error: string | undefined;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const evtLine = frame.split("\n").find((l) => l.startsWith("event:"));
        const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!evtLine || !dataLine) continue;
        const event = evtLine.slice(6).trim();
        let payload: any = {};
        try { payload = JSON.parse(dataLine.slice(5).trim()); } catch { continue; }
        if (event === "delta" && typeof payload.text === "string") {
          full += payload.text;
          onDelta(full, payload.text);
        } else if (event === "done") {
          finalOutput = String(payload.output || full);
        } else if (event === "error") {
          error = String(payload.error || "Generation failed");
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return { output: full, cancelled: true };
    return { output: full, error: "Stream interrupted — please try again." };
  }

  if (error) return { output: "", error };
  if (!finalOutput.trim()) return { output: "", error: "Generation failed" };
  return { output: finalOutput };
}
