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
  console.error("[claude] API error", status, body.slice(0, 500));
  if (status === 401) return "AI service authentication failed.";
  if (status === 429) return "Too many requests, wait 30 seconds and try again.";
  if (status === 402 || status === 403) return "AI credits exhausted. Please check your Anthropic account.";
  if (status === 529 || status === 503) return "AI service is overloaded. Try again shortly.";
  if (status === 404) return "AI model not available (check CLAUDE_MODEL config).";
  // Surface Anthropic's own error message when possible so misconfigurations
  // (bad model id, invalid schema, etc.) don't hide behind a generic string.
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; type?: string } };
    const msg = parsed?.error?.message;
    if (msg) return `AI error (${status}): ${msg.slice(0, 180)}`;
  } catch { /* not JSON */ }
  return `Generation failed (${status}). Please try again.`;
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

/**
 * Streaming text completion. Calls `onDelta` with every token chunk and
 * resolves with the full text once the stream closes.
 *
 * No artificial timeout: generation takes as long as the model needs. The only
 * cancellation path is the caller's `signal` (an explicit user cancel).
 */
export async function streamClaude({
  systemPrompt,
  userPrompt,
  maxTokens = 4000,
  model = DEFAULT_MODEL,
  signal,
  onDelta,
}: CallOptions & {
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}): Promise<ClaudeTextResult> {
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
      signal,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        stream: true,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      return { text: "", error: mapStatusError(res.status, body) };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as {
            type?: string;
            delta?: { type?: string; text?: string };
            error?: { message?: string };
          };
          if (evt.type === "content_block_delta" && typeof evt.delta?.text === "string") {
            text += evt.delta.text;
            onDelta(evt.delta.text);
          } else if (evt.type === "error") {
            return { text, error: evt.error?.message || "AI stream error." };
          }
        } catch { /* ignore keep-alive / partial frames */ }
      }
    }

    if (!text.trim()) return { text: "", error: "No content returned." };
    return { text };
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return { text: "", error: "CANCELLED" };
    console.error("Claude stream error:", err);
    return { text: "", error: "Failed to connect to AI service." };
  }
}
