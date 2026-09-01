/**
 * Streaming image generation for the Image Studio (gateway/Gemini path only).
 *
 * The client only routes here when the selected model is the gateway model —
 * Flux (Replicate) and GPT Image (OpenAI) have no SSE surface and go through the
 * `generateImage` server function instead, so the model picker is never a lie.
 *
 * Quota is enforced up front (monthly image allowance) and every *completed*
 * tile is persisted to storage + `generated_images`, which is the same table the
 * monthly usage counter reads. Partial frames are streamed but never counted.
 *
 * After persisting, a trailing `studio.saved` SSE event carries the public
 * storage URL so the client can keep a lightweight URL in state instead of a
 * multi-megabyte base64 data URL.
 *
 * Cancellation: the client's AbortSignal is forwarded upstream, so an aborted
 * job produces no completed tile and therefore consumes no quota.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import {
  getPlanFor,
  isProPlan,
  imageQuotaRemaining,
  persistGeneratedImage,
  logToHistory,
} from "@/lib/imageQuota.server";
import { STREAM_IMAGE_MODEL_FAST, STREAM_IMAGE_MODEL_HD } from "@/lib/imageModels";

const ASPECT_HINT: Record<string, string> = {
  square: "1:1 square composition",
  portrait: "9:16 vertical composition",
  landscape: "16:9 widescreen composition",
};

export const Route = createFileRoute("/api/studio-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const SUPABASE_URL = process.env["SUPABASE_URL"];
        const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)
          return new Response("Backend not configured", { status: 500 });

        const auth = request.headers.get("authorization") || "";
        if (!auth.startsWith("Bearer "))
          return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub as string | undefined;
        if (claimsErr || !userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json().catch(() => null)) as {
          prompt?: string;
          style?: string;
          aspect?: string;
          template?: string;
          negativePrompt?: string;
          quality?: string;
          seed?: number;
        } | null;
        const prompt = (body?.prompt || "").trim();
        if (prompt.length < 3 || prompt.length > 2000)
          return new Response("Invalid prompt", { status: 400 });
        const aspect = body?.aspect === "portrait" || body?.aspect === "landscape" ? body.aspect : "square";
        const style = (body?.style || "").slice(0, 40);
        const template = (body?.template || "").slice(0, 40) || undefined;
        const negativePrompt = (body?.negativePrompt || "").slice(0, 400).trim();
        const quality = body?.quality === "hd" ? "hd" : "standard";
        const seed = Number.isFinite(body?.seed) ? Number(body?.seed) : null;

        const plan = await getPlanFor(supabase, userId);
        const isThumb = template === "thumbnail" || template === "blog-cover";
        if (!isProPlan(plan) && !isThumb)
          return new Response(JSON.stringify({ error: "AI Image Studio is a Pro feature. Upgrade to unlock." }), {
            status: 402,
            headers: { "Content-Type": "application/json" },
          });
        if ((await imageQuotaRemaining(userId, plan)) < 1)
          return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), {
            status: 402,
            headers: { "Content-Type": "application/json" },
          });

        const gatewayModel = quality === "hd" ? STREAM_IMAGE_MODEL_HD : STREAM_IMAGE_MODEL_FAST;
        const fullPrompt = [
          prompt,
          style && `${style} style`,
          ASPECT_HINT[aspect],
          negativePrompt && `Avoid: ${negativePrompt}`,
        ]
          .filter(Boolean)
          .join(". ");

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: gatewayModel,
              messages: [{ role: "user", content: fullPrompt }],
              modalities: ["image", "text"],
              stream: true,
            }),
            signal: request.signal,
          });
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw e;
        }
        if (!upstream.ok || !upstream.body)
          return new Response(await upstream.text(), { status: upstream.status });

        // Pass every upstream chunk straight through (no buffering) while
        // scanning for the completed frame, then append a `studio.saved` event
        // carrying the persisted storage URL.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let scanBuf = "";
        let finalB64: string | null = null;

        const relay = new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            controller.enqueue(chunk);
            scanBuf += decoder.decode(chunk, { stream: true });
            const frames = scanBuf.split("\n\n");
            scanBuf = frames.pop() || "";
            for (const frame of frames) {
              if (!/event:\s*\S*completed/.test(frame)) continue;
              for (const line of frame.split("\n")) {
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                  const json = JSON.parse(payload);
                  finalB64 =
                    json.b64_json ||
                    json?.data?.[0]?.b64_json ||
                    json?.image?.b64_json ||
                    json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
                    null;
                } catch {
                  /* partial JSON — ignore */
                }
              }
            }
          },
          async flush(controller) {
            if (!finalB64) return;
            const imageUrl = finalB64.startsWith("data:")
              ? finalB64
              : `data:image/png;base64,${finalB64}`;
            try {
              const persisted = await persistGeneratedImage({
                userId,
                imageUrl,
                prompt,
                style,
                aspect,
                template,
                source: "stream",
                model: gatewayModel,
                seed,
                negativePrompt: negativePrompt || undefined,
              });
              if (persisted) {
                controller.enqueue(
                  encoder.encode(
                    `event: studio.saved\ndata: ${JSON.stringify({ url: persisted })}\n\n`,
                  ),
                );
                await logToHistory({
                  userId,
                  tool: isThumb ? "thumbnail" : "image",
                  title: prompt.slice(0, 80),
                  inputText: prompt,
                  outputs: {
                    image_url: persisted,
                    style,
                    aspect,
                    template: template || "",
                    prompt,
                    streamed: true,
                    model: gatewayModel,
                  },
                });
              }
            } catch (e) {
              console.error("studio-stream persist error:", e);
            }
          },
        });

        return new Response(upstream.body.pipeThrough(relay), {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
