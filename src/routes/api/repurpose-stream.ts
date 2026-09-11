/**
 * Streaming generation for one repurpose format.
 *
 * Authenticated SSE endpoint: the client sends the same payload it would send to
 * the `repurposeOneFormat` server function and receives token deltas as they
 * arrive, so each format card fills in live and can be cancelled individually.
 *
 * Quota, Brand Voice and Brand Kit resolution are shared with the buffered
 * server function via `prepareFormatGeneration`. Only *completed* output is
 * persisted — a cancelled stream writes nothing.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { rateLimitedDurable } from "@/lib/rateLimit.server";
import { streamOneFormat } from "@/lib/repurpose.server";
import { prepareFormatGeneration, persistFormatOutput } from "@/lib/repurposePrep.server";

/** Must mirror the Repurpose Studio format catalogue (src/routes/dashboard.repurpose.tsx). */
const FORMATS = new Set([
  "tweets", "linkedin", "instagram", "facebook", "tiktok", "thread",
  "email", "video", "seo", "podcast", "carousel",
]);

export const Route = createFileRoute("/api/repurpose-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env["SUPABASE_URL"];
        const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)
          return new Response("Backend not configured", { status: 500 });

        const auth = request.headers.get("authorization") || "";
        if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub as string | undefined;
        if (claimsErr || !userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json().catch(() => null)) as Record<string, any> | null;
        const packId = String(body?.packId || "");
        const format = String(body?.format || "");
        const inputText = String(body?.inputText || "");
        if (!/^[0-9a-f-]{36}$/i.test(packId)) return new Response("Invalid packId", { status: 400 });
        if (!FORMATS.has(format)) return new Response("Invalid format", { status: 400 });
        if (inputText.length < 1 || inputText.length > 50000)
          return new Response("Invalid input", { status: 400 });

        if (await rateLimitedDurable(userId, "repurpose"))
          return new Response("Rate limit: please wait a minute and try again.", { status: 429 });

        const prep = await prepareFormatGeneration(supabase, userId, {
          packId,
          inputText,
          format,
          count: Number.isFinite(body?.count) ? Number(body?.count) : undefined,
          style: body?.style ? String(body.style).slice(0, 80) : undefined,
          length: body?.length ? String(body.length).slice(0, 40) : undefined,
          tone: body?.tone ? String(body.tone).slice(0, 50) : undefined,
          styleModifiers: Array.isArray(body?.styleModifiers)
            ? body.styleModifiers.slice(0, 15).map((s: unknown) => String(s).slice(0, 60))
            : [],
          customInstructions: body?.customInstructions
            ? String(body.customInstructions).slice(0, 500)
            : undefined,
          language: body?.language ? String(body.language).slice(0, 40) : undefined,
        });

        if (!prep.ok) {
          return new Response(JSON.stringify({ error: prep.error }), {
            status: prep.error === "LIMIT_REACHED" ? 402 : 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (event: string, payload: unknown) => {
              try {
                controller.enqueue(
                  encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
                );
              } catch { /* client already gone */ }
            };

            const upstream = new AbortController();
            const onAbort = () => upstream.abort();
            request.signal.addEventListener("abort", onAbort);

            try {
              const result = await streamOneFormat(
                prep.opts,
                (chunk) => send("delta", { text: chunk }),
                upstream.signal,
              );

              if (request.signal.aborted) return;

              if (result.error || !result.output.trim()) {
                send("error", { error: result.error || "Generation failed" });
              } else {
                await persistFormatOutput(
                  supabase, userId, packId, format, result.output, prep.packTitle,
                );
                send("done", { output: result.output, jobId: packId });
              }
            } catch (err) {
              console.error("repurpose-stream error:", err);
              send("error", { error: "Generation failed" });
            } finally {
              request.signal.removeEventListener("abort", onAbort);
              try { controller.close(); } catch { /* already closed */ }
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
