import { callClaudeWithTool } from "./anthropic.server";

export interface HookVariant {
  style: string;
  text: string;
  rationale: string;
}

interface ClaudeResp {
  variants: HookVariant[];
}

export async function generateHookVariants(
  inputText: string,
  platform: string,
  brandVoiceSummary = ""
): Promise<{ variants: HookVariant[]; error?: string }> {
  const voiceBlock = brandVoiceSummary.trim()
    ? `\n\nMatch this brand voice:\n${brandVoiceSummary.trim()}`
    : "";

  const systemPrompt = `You are a viral hook A/B testing expert for ${platform}. Generate exactly 3 distinct opening hooks for the same piece of content. Each hook should use a different psychological angle so the user can A/B test which one performs best.

Use exactly these 3 styles in order:
1. "Curiosity Gap" — open a loop the reader must close
2. "Bold Claim" — a contrarian or surprising statement
3. "Story" — a vivid 1-line scene or personal moment

Each hook ≤ 220 characters, platform-native, no hashtags, no emojis unless natural.${voiceBlock}`;

  const result = await callClaudeWithTool<ClaudeResp>({
    systemPrompt,
    userPrompt: `Source content:\n"""\n${inputText.slice(0, 4000)}\n"""\n\nReturn exactly 3 hook variants via the return_variants tool.`,
    toolName: "return_variants",
    toolDescription: "Return the 3 A/B hook variants.",
    toolSchema: {
      type: "object",
      properties: {
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              style: { type: "string" },
              text: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["style", "text", "rationale"],
          },
        },
      },
      required: ["variants"],
    },
    maxTokens: 800,
  });

  if (result.error || !result.data) {
    return { variants: [], error: result.error || "No variants returned." };
  }
  const variants = Array.isArray(result.data.variants) ? result.data.variants.slice(0, 3) : [];
  return { variants };
}
