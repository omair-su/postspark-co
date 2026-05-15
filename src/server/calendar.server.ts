import { callClaudeWithTool } from "./anthropic.server";

export interface PlannedPost {
  day: number; // 1..N (offset from start)
  platform: string;
  title: string;
  content: string;
  hook?: string;
}

export interface PlanResult {
  posts: PlannedPost[];
  error?: string;
}

interface ClaudePlanResponse {
  posts: PlannedPost[];
}

const PLATFORMS = ["twitter", "linkedin", "instagram", "facebook", "tiktok", "youtube", "blog", "email"];

export async function generateContentPlan(
  niche: string,
  platforms: string[],
  cadence: "daily" | "3x" | "weekly",
  days: number,
  brandVoiceSummary = "",
  brandTone = "professional",
): Promise<PlanResult> {
  const safePlatforms = platforms.filter((p) => PLATFORMS.includes(p));
  if (safePlatforms.length === 0) safePlatforms.push("twitter");

  const targetCount =
    cadence === "daily" ? days :
    cadence === "3x" ? Math.ceil(days * 3 / 7) :
    Math.ceil(days / 7);

  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are an elite content strategist building a ${days}-day editorial calendar.
Niche/topic: ${niche}
Platforms to cycle through: ${safePlatforms.join(", ")}
Cadence: ${cadence} (≈${targetCount} total posts over ${days} days)
Tone: ${brandTone}

Rules:
- Vary post angles: educational, story, contrarian, listicle, behind-the-scenes, tip, question, case study.
- Spread "day" values evenly between 1 and ${days}. Never assign two posts to the same (day, platform).
- Cycle platforms — don't put all posts on one channel unless only one was provided.
- Each "content" must be ready-to-post copy native to its platform (Twitter ≤280 chars, LinkedIn 100-250 words, etc).
- Each "title" is a short internal label (≤60 chars) — not the post body.
- Each "hook" is the opening line designed to stop scroll.
- No filler, no emojis unless the platform calls for it.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudePlanResponse>({
    systemPrompt,
    userPrompt: `Generate ${targetCount} posts for the next ${days} days. Return via the return_plan tool.`,
    toolName: "return_plan",
    toolDescription: "Return the full content calendar.",
    toolSchema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "integer", minimum: 1, maximum: days },
              platform: { type: "string", enum: safePlatforms },
              title: { type: "string" },
              content: { type: "string" },
              hook: { type: "string" },
            },
            required: ["day", "platform", "title", "content"],
          },
        },
      },
      required: ["posts"],
    },
    maxTokens: 6000,
  });

  if (result.error || !result.data) {
    return { posts: [], error: result.error || "No plan returned." };
  }
  const posts = (result.data.posts || []).filter(
    (p) => p && p.day >= 1 && p.day <= days && safePlatforms.includes(p.platform) && p.content,
  );
  return { posts };
}
