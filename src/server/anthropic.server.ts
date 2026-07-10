/**
 * Shared Anthropic Claude client for all PostSpark AI features.
 * Server-only — never import from client code.
 *
 * Uses the Messages API. Supports plain text completion and structured
 * "tool use" responses (Claude's equivalent of OpenAI tool calls / JSON mode).
 */

import { CLAUDE_MODEL_ID } from "@/lib/aiModel";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = CLAUDE_MODEL_ID;
const ANTHROPIC_VERSION = "2023-06-01";

export interface ClaudeError {
  error: string;
}

export interface ClaudeTextResult {
  text: string;
  error?: string;
}

export interface ClaudeToolResult<T = unknown> {
  data: T | null;
  error?: string;
}

interface CallOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  model?: string;
}

interface ToolCallOptions<T> extends CallOptions {
  toolName: string;
  toolDescription: string;
  toolSchema: Record<string, unknown>;
}

function mapStatusError(status: number, body: string): string {
  if (status === 401) return "AI service authentication failed.";
  if (status === 429) return "Too many requests, wait 30 seconds and try again.";
  if (status === 402 || status === 403) return "AI credits exhausted. Please check your Anthropic account.";
  if (status === 529 || status === 503) return "AI service is overloaded. Try again shortly.";
  console.error("Claude API error:", status, body);
  return "Generation failed. Please try again.";
}

/** Plain text completion. */
export async function callClaude({
  systemPrompt,
  userPrompt,
  maxTokens = 4000,
  model = DEFAULT_MODEL,
}: CallOptions): Promise<ClaudeTextResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { text: "", error: "AI service not configured (missing ANTHROPIC_API_KEY)." };
  }

  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { text: "", error: mapStatusError(res.status, body) };
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content || [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n")
      .trim();

    if (!text) return { text: "", error: "No content returned." };
    return { text };
  } catch (err) {
    console.error("Claude request error:", err);
    return { text: "", error: "Failed to connect to AI service." };
  }
}

/**
 * Structured output via Claude tool use.
 * Forces Claude to respond by invoking the named tool, returning its parsed input.
 */
export async function callClaudeWithTool<T = unknown>({
  systemPrompt,
  userPrompt,
  toolName,
  toolDescription,
  toolSchema,
  maxTokens = 4000,
  model = DEFAULT_MODEL,
}: ToolCallOptions<T>): Promise<ClaudeToolResult<T>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { data: null, error: "AI service not configured (missing ANTHROPIC_API_KEY)." };
  }

  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: [
          {
            name: toolName,
            description: toolDescription,
            input_schema: toolSchema,
          },
        ],
        tool_choice: { type: "tool", name: toolName },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { data: null, error: mapStatusError(res.status, body) };
    }

    const json = (await res.json()) as {
      content?: Array<{ type: string; name?: string; input?: unknown }>;
    };
    const toolBlock = (json.content || []).find(
      (b) => b.type === "tool_use" && b.name === toolName,
    );
    if (!toolBlock || !toolBlock.input) {
      return { data: null, error: "No structured response returned." };
    }
    return { data: toolBlock.input as T };
  } catch (err) {
    console.error("Claude tool request error:", err);
    return { data: null, error: "Failed to connect to AI service." };
  }
}
