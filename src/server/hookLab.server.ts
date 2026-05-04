import { callClaudeWithTool } from "./anthropic.server";

export interface HookResult {
  hooks: { framework: string; text: string }[];
  error?: string;
}

interface ClaudeHookResponse {
  hooks: { framework: string; text: string }[];
}

export async function generateViralHooks(
  topic: string,
  platform: string,
  brandVoiceSummary = ""
): Promise<HookResult> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice exactly:\n${brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are a viral content hook specialist. You have studied thousands of viral posts on ${platform} and understand exactly what makes people stop scrolling. You write hooks that create curiosity, challenge assumptions, and demand attention.

Generate exactly 20 scroll-stopping hooks. Use a diverse mix of these proven frameworks (label each in the "framework" field):
Contrarian, Curiosity Gap, Pain Point, Bold Claim, Story, List, Question, Stat Shock, Mistake, Secret.

Each hook must be under 220 chars, platform-native for ${platform}, and instantly compelling.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeHookResponse>({
    systemPrompt,
    userPrompt: `Topic: ${topic}\nPlatform: ${platform}\n\nReturn 20 hooks via the return_hooks tool.`,
    toolName: "return_hooks",
    toolDescription: "Return the 20 generated viral hooks.",
    toolSchema: {
      type: "object",
      properties: {
        hooks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              framework: { type: "string" },
              text: { type: "string" },
            },
            required: ["framework", "text"],
          },
        },
      },
      required: ["hooks"],
    },
    maxTokens: 2000,
  });

  if (result.error || !result.data) {
    return { hooks: [], error: result.error || "No hooks returned." };
  }
  return { hooks: Array.isArray(result.data.hooks) ? result.data.hooks : [] };
}
