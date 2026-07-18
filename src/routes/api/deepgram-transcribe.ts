import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Auth-protected transcription proxy. Client posts raw audio bytes; server
// forwards to Deepgram with word-level timestamps. Placed at /api/* (not
// /api/public/*) so the published site enforces Supabase auth.
export const Route = createFileRoute("/api/deepgram-transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } },
        );
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) return Response.json({ error: "Deepgram not configured" }, { status: 503 });

        const contentType = request.headers.get("content-type") || "audio/mpeg";
        const audio = await request.arrayBuffer();
        if (!audio.byteLength) return Response.json({ error: "empty audio" }, { status: 400 });
        // 25 MB cap
        if (audio.byteLength > 25 * 1024 * 1024) {
          return Response.json({ error: "audio too large (max 25MB)" }, { status: 413 });
        }

        const params = new URLSearchParams({
          model: "nova-2",
          smart_format: "true",
          punctuate: "true",
          utterances: "false",
          diarize: "false",
        });

        const upstream = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": contentType,
          },
          body: audio,
        });

        if (!upstream.ok) {
          const err = await upstream.text().catch(() => upstream.statusText);
          console.error("[deepgram] error", upstream.status, err);
          return Response.json({ error: `Transcribe failed: ${upstream.status}` }, { status: 502 });
        }

        const data: any = await upstream.json();
        const alt = data?.results?.channels?.[0]?.alternatives?.[0];
        const words = (alt?.words || []).map((w: any) => ({
          word: w.punctuated_word || w.word,
          start: w.start,
          end: w.end,
        }));
        return Response.json({ transcript: alt?.transcript || "", words });
      },
    },
  },
});
