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
        if (!text) return Response.json({ error: "text is required" }, { status: 400 });
        if (text.length > 4000) {
          return Response.json({ error: "text too long (max 4000 chars)" }, { status: 400 });
        }

        // ElevenLabs voice IDs (top-quality voices from voice library)
        const ELEVEN_VOICES: Record<string, string> = {
          sarah: "EXAVITQu4vr4xnSDxMaL",
          george: "JBFqnCBsd6RMkjVDRZzb",
          laura: "FGY2WhTYpPnrIDTdsKH5",
          charlie: "IKne3meq5aSn9XLyUdCD",
          liam: "TX3LPaxmHKxFdv7VOQHJ",
          alice: "Xb7hH8MSUJpSbSDYk0k2",
          brian: "nPczCjzI2devNBz1zQrb",
          lily: "pFZP5JQG7iQjIQuC4Bku",
        };
        const voiceKey = (body.voice || "sarah").toLowerCase();
        const voiceId = ELEVEN_VOICES[voiceKey] || ELEVEN_VOICES.sarah;

        // Prefer ElevenLabs when configured; fall back to Lovable AI TTS.
        const elevenKey = process.env.ELEVENLABS_API_KEY;
        if (elevenKey) {
          const upstream = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
              method: "POST",
              headers: {
                "xi-api-key": elevenKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
              }),
            },
          );
          if (!upstream.ok) {
            const errText = await upstream.text().catch(() => upstream.statusText);
            console.error("[narrate-short] eleven error", upstream.status, errText);
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
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "TTS not configured" }, { status: 503 });
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "alloy",
            response_format: "mp3",
            stream_format: "audio",
          }),
        });
        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => upstream.statusText);
          console.error("[narrate-short] gateway error", upstream.status, errText);
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
