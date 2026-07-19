import { callClaudeWithTool } from "./anthropic.server";

export interface FounderPost {
  archetype: string; // "milestone", "lesson", "before-after", "question", "behind-the-scenes"
  x: string; // ≤ 280
  linkedin: string; // ≤ 1300
  hook: string;
}

interface Metrics {
  signupsLast7d: number;
  repurposesLast7d: number;
  totalUsers: number;
  totalRepurposes: number;
  mrrUsd: number;
  topTool: string;
}

export async function generateFounderPosts(metrics: Metrics, tone = "honest, founder voice"): Promise<{ posts: FounderPost[]; error?: string }> {
  const systemPrompt = `You are a build-in-public ghostwriter for solo SaaS founders. You write posts that get engagement WITHOUT being cringe.

TASK: Generate exactly 5 build-in-public post variants based on the founder's REAL metrics. Each variant uses a different archetype:
1. "milestone" — a real number reached, framed honestly (small or large)
2. "lesson" — something the founder learned this week
3. "before-after" — a concrete change/improvement shipped
4. "question" — an authentic question to the audience
5. "behind-the-scenes" — a real founder moment / decision

REAL METRICS TO GROUND THE POSTS:
- Signups last 7 days: ${metrics.signupsLast7d}
- Repurposes last 7 days: ${metrics.repurposesLast7d}
- Total users: ${metrics.totalUsers}
- Total repurposes generated: ${metrics.totalRepurposes}
- MRR (USD): $${metrics.mrrUsd}
- Most used tool: ${metrics.topTool}

OUTPUT REQUIREMENTS PER POST:
- hook: the first line (also the X opening line). ≤ 70 chars. Stop-scroll.
- x: full X/Twitter post, ≤ 280 chars total including hook. Line breaks allowed. No hashtags. No emojis unless they actually add meaning. NEVER start with "I".
- linkedin: full LinkedIn post, ≤ 1300 chars. Hook on line 1, blank line, body, blank line, CTA or question. Concrete numbers. No corporate fluff. Plain paragraphs, optionally one bulleted list.

TONE: ${tone}

RULES:
- Use the real numbers above verbatim — never round up, never invent metrics.
- Small numbers are fine: "got 12 signups this week" is more honest than "growing fast".
- One post per archetype, exactly 5 posts total.
- Product is called PostSpark, AI content repurposing for creators.`;

  const result = await callClaudeWithTool<{ posts: FounderPost[] }>({
    systemPrompt,
    userPrompt: `Generate 5 build-in-public posts grounded in the metrics above. Return via return_founder_posts.`,
    toolName: "return_founder_posts",
    toolDescription: "Return 5 build-in-public posts, one per archetype.",
    toolSchema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          minItems: 5, maxItems: 5,
          items: {
            type: "object",
            properties: {
              archetype: { type: "string" },
              hook: { type: "string" },
              x: { type: "string" },
              linkedin: { type: "string" },
            },
            required: ["archetype", "hook", "x", "linkedin"],
          },
        },
      },
      required: ["posts"],
    },
    maxTokens: 3000,
  });

  if (result.error || !result.data) return { posts: [], error: result.error || "Generation failed" };
  return { posts: result.data.posts || [] };
}
