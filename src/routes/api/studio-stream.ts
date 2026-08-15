/**
 * Streaming image generation for the Image Studio.
 *
 * Quota is enforced up front (monthly image allowance) and every *completed*
 * tile is persisted to storage + `generated_images`, which is the same table the
 * monthly usage counter reads — so streamed renders count exactly like batch
 * renders. Partial frames are streamed to the client but never counted.
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
        } | null;
        const prompt = (body?.prompt || "").trim();
        if (prompt.length < 3 || prompt.length > 2000)
          return new Response("Invalid prompt", { status: 400 });
        const aspect = body?.aspect === "portrait" || body?.aspect === "landscape" ? body.aspect : "square";
        const style = (body?.style || "").slice(0, 40);
        const template = (body?.template || "").slice(0, 40) || undefined;

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

        const fullPrompt = [prompt, style && `${style} style`, ASPECT_HINT[aspect]]
          .filter(Boolean)
          .join(". ");

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image",
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

        // Tee the stream: one half goes to the client untouched, the other half is
        // scanned server-side so the completed tile is persisted and counted.
        const [toClient, toCounter] = upstream.body.tee();

        (async () => {
          const reader = toCounter.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          let finalB64: string | null = null;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const frames = buf.split("\n\n");
              buf = frames.pop() || "";
              for (const frame of frames) {
                const isFinal = /event:\s*\S*completed/.test(frame);
                if (!isFinal) continue;
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
            }
          } catch {
            /* aborted or upstream error — nothing to count */
          }
          if (!finalB64) return;
          const imageUrl = finalB64.startsWith("data:") ? finalB64 : `data:image/png;base64,${finalB64}`;
          const persisted = await persistGeneratedImage({
            userId,
            imageUrl,
            prompt,
            style,
            aspect,
            template,
            source: "stream",
          });
          if (persisted) {
            await logToHistory({
              userId,
              tool: isThumb ? "thumbnail" : "image",
              title: prompt.slice(0, 80),
              inputText: prompt,
              outputs: { image_url: persisted, style, aspect, template: template || "", prompt, streamed: true },
            });
          }
        })();

        return new Response(toClient, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
