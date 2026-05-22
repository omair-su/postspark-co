import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callClaude } from "@/server/anthropic.server";

const Schema = z.object({
  input: z.string().min(40).max(4000),
});

const DAILY_LIMIT = 3;

function hashIp(req: Request): string {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || "salt")).digest("hex").slice(0, 32);
}

export const Route = createFileRoute("/api/public/demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try { json = await request.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
        const parsed = Schema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "Please paste at least 40 characters (up to 4000)." }, { status: 400 });
        }

        const ipHash = hashIp(request);
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("demo_uses")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", since);

        if ((count ?? 0) >= DAILY_LIMIT) {
          return Response.json(
            { error: "You've reached the free demo limit. Sign up free to keep going — 10 repurposes/month, no card required." },
            { status: 429 },
          );
        }

        const systemPrompt = `You are PostSpark's AI content engine. Given any source content (blog excerpt, transcript, idea), produce a short content pack as PURE JSON (no markdown fences) matching this exact shape:
{
  "tweet": "<one punchy tweet under 270 chars, no hashtags>",
  "linkedin": "<one LinkedIn post 120-220 words, line breaks, hook first line, ends with a soft question>",
  "hook": "<one short attention-grabbing opening line a creator could use, under 140 chars>"
}
Be platform-native, human, specific. Never include the word "JSON" or any prose outside the object.`;

        const result = await callClaude({
          systemPrompt,
          userPrompt: parsed.data.input,
          maxTokens: 900,
        });

        if (result.error || !result.text) {
          return Response.json({ error: "Generation failed. Try again in a moment." }, { status: 502 });
        }

        let pack: { tweet: string; linkedin: string; hook: string } | null = null;
        try {
          const clean = result.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
          pack = JSON.parse(clean);
        } catch {
          return Response.json({ error: "Could not parse output. Try a different input." }, { status: 502 });
        }
        if (!pack?.tweet || !pack?.linkedin || !pack?.hook) {
          return Response.json({ error: "Incomplete output. Try again." }, { status: 502 });
        }

        await supabaseAdmin.from("demo_uses").insert({
          ip_hash: ipHash,
          input_chars: parsed.data.input.length,
        });

        const remaining = Math.max(0, DAILY_LIMIT - ((count ?? 0) + 1));
        return Response.json({ pack, remaining });
      },
    },
  },
});
