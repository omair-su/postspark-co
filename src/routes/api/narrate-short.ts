import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/narrate-short")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Auth ──────────────────────────────────────────────────
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Parse body ────────────────────────────────────────────
        let body: { text?: string; voice?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "bad_json" }, { status: 400 });
        }
        const text = (body.text || "").trim();
        const voice = body.voice || "alloy";
        if (!text) return Response.json({ error: "text is required" }, { status: 400 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "TTS not configured" }, { status: 503 });
        }

        // ── Call Lovable AI Gateway TTS ───────────────────────────
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            response_format: "mp3",
            stream_format: "audio",
          }),
        });

        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => upstream.statusText);
          console.error("[narrate-short] upstream error", upstream.status, errText);
          return Response.json({ error: `TTS failed: ${upstream.status}` }, { status: 502 });
        }

        const audioBuffer = await upstream.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(audioBuffer.byteLength),
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
