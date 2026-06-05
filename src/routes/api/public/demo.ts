import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callClaudeWithTool } from "@/server/anthropic.server";
import { scrapeUrl, isBlockedHost } from "@/server/import.server";

const Schema = z.object({
  sourceType: z.enum(["text", "url"]).default("text"),
  input: z.string().min(1).max(8000).optional(),
  url: z.string().url().max(500).optional(),
  tone: z.enum(["professional", "casual", "bold", "storyteller"]).default("professional"),
});

const DAILY_LIMIT = 3;

function hashIp(req: Request): string {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256")
    .update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || "salt"))
    .digest("hex")
    .slice(0, 32);
}

const TONE_GUIDANCE: Record<string, string> = {
  professional: "Polished, authoritative, no slang. Confident expert voice.",
  casual: "Warm, conversational, contractions, like texting a friend.",
  bold: "Punchy, contrarian, short sentences, takes a strong stance.",
  storyteller: "Narrative arc, vivid detail, emotional hook, scene-setting.",
};

export const Route = createFileRoute("/api/public/demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "bad_json" }, { status: 400 });
        }
        const parsed = Schema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input." }, { status: 400 });
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
            {
              error:
                "You've reached the free demo limit. Sign up free to keep going — 10 repurposes/month, no card required.",
              limited: true,
            },
            { status: 429 },
          );
        }

        // Resolve source text
        let sourceText = "";
        let sourceLabel = "text";
        if (parsed.data.sourceType === "url" && parsed.data.url) {
          try {
            const u = new URL(parsed.data.url);
            if (!/^https?:$/.test(u.protocol) || isBlockedHost(u.hostname)) {
              return Response.json({ error: "URL is not allowed." }, { status: 400 });
            }
          } catch {
            return Response.json({ error: "Invalid URL." }, { status: 400 });
          }
          const scraped = await scrapeUrl(parsed.data.url);
          if (scraped.error || !scraped.text || scraped.text.length < 60) {
            return Response.json(
              { error: scraped.error || "Couldn't extract enough content from that URL. Paste text instead?" },
              { status: 400 },
            );
          }
          sourceText = scraped.text.slice(0, 6000);
          sourceLabel = scraped.title || parsed.data.url;
        } else if (parsed.data.input && parsed.data.input.trim().length >= 20) {
          sourceText = parsed.data.input.trim();
        } else {
          return Response.json(
            { error: "Please paste at least 20 characters, or a valid URL." },
            { status: 400 },
          );
        }

        const tone = parsed.data.tone;
        const systemPrompt = `You are PostSpark's AI content engine. Repurpose ANY source content into 6 platform-native pieces.

TONE: ${tone.toUpperCase()} — ${TONE_GUIDANCE[tone]}

Rules:
- Each output must be platform-native (length, format, register).
- No hashtags unless they add real value. No emojis in LinkedIn/newsletter headers.
- Hook first. Specific over generic.
- Tweet: max 270 chars, single tweet, one clear idea.
- LinkedIn: 120-220 words, line breaks between thoughts, ends with soft question.
- Subject line: max 60 chars, curiosity-driven, no clickbait.
- Thread: exactly 5 tweets, each <270 chars, numbered "1/" through "5/", strong hook in tweet 1, payoff in tweet 5.
- Newsletter: 90-140 word intro paragraph, hook + promise of value.
- Short script: 30-second YouTube Short script, format as "[0-3s HOOK] ...\\n[3-10s] ...\\n[10-25s] ...\\n[25-30s CTA] ...".

Return the result via the "content_pack" tool. No prose outside the tool call.`;

        const result = await callClaudeWithTool<{
          tweet: string;
          linkedin: string;
          subject: string;
          thread: string;
          newsletter: string;
          short_script: string;
        }>({
          systemPrompt,
          userPrompt: `SOURCE (${sourceLabel}):\n\n${sourceText}`,
          maxTokens: 2200,
          toolName: "content_pack",
          toolDescription: "Six platform-native pieces repurposed from the source content.",
          toolSchema: {
            type: "object",
            required: ["tweet", "linkedin", "subject", "thread", "newsletter", "short_script"],
            properties: {
              tweet: { type: "string", description: "Single tweet under 270 chars" },
              linkedin: { type: "string", description: "LinkedIn post 120-220 words" },
              subject: { type: "string", description: "Email subject line under 60 chars" },
              thread: { type: "string", description: "5-tweet thread, numbered 1/ through 5/, separated by double newlines" },
              newsletter: { type: "string", description: "Newsletter intro, 90-140 words" },
              short_script: { type: "string", description: "30-sec YouTube Short script with timestamps" },
            },
          },
        });

        if (result.error || !result.data) {
          return Response.json(
            { error: result.error || "Generation failed. Try again in a moment." },
            { status: 502 },
          );
        }

        const pack = {
          tweet: result.data.tweet,
          linkedin: result.data.linkedin,
          subject: result.data.subject,
          thread: result.data.thread,
          newsletter: result.data.newsletter,
          short_script: result.data.short_script,
        };

        await supabaseAdmin.from("demo_uses").insert({
          ip_hash: ipHash,
          input_chars: sourceText.length,
        });

        const remaining = Math.max(0, DAILY_LIMIT - ((count ?? 0) + 1));
        return Response.json({ pack, remaining, sourceLabel });
      },
    },
  },
});
