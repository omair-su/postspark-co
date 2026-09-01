import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Status = { ok: boolean; latencyMs: number; error?: string };

async function pingOpenAI(): Promise<Status> {
  const start = Date.now();
  const key = process.env.Openai_api || process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: "Openai_api secret not set" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (r.ok) return { ok: true, latencyMs: Date.now() - start };
    return { ok: false, latencyMs: Date.now() - start, error: `OpenAI ${r.status}` };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e?.message || "OpenAI unreachable" };
  }
}

async function pingReplicate(): Promise<Status> {
  const start = Date.now();
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { ok: false, latencyMs: 0, error: "REPLICATE_API_TOKEN not set" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch("https://api.replicate.com/v1/account", {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (r.ok) return { ok: true, latencyMs: Date.now() - start };
    return { ok: false, latencyMs: Date.now() - start, error: `Replicate ${r.status}` };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e?.message || "Replicate unreachable" };
  }
}

async function pingGemini(): Promise<Status> {
  const start = Date.now();
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: "LOVABLE_API_KEY not set" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: STUDIO_TEXT_MODEL_LITE,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    }).finally(() => clearTimeout(t));
    if (r.ok) return { ok: true, latencyMs: Date.now() - start };
    return { ok: false, latencyMs: Date.now() - start, error: `Gateway ${r.status}` };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e?.message || "Gateway unreachable" };
  }
}

export const pingImageModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [gpt, flux, gemini] = await Promise.all([pingOpenAI(), pingReplicate(), pingGemini()]);
    return { gpt, flux, gemini, checkedAt: new Date().toISOString() };
  });
