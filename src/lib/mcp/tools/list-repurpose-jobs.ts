import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_repurpose_jobs",
  title: "List repurposed content",
  description:
    "List the signed-in user's recent PostSpark repurpose jobs (blog/podcast/video turned into social posts, threads, newsletters, etc.). Returns id, title, tool, and creation date.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max number of jobs to return (default 20)."),
    tool: z
      .string()
      .max(60)
      .optional()
      .describe("Optional tool filter, e.g. 'humanizer', 'reply_generator', 'repurpose'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, tool }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("repurpose_jobs")
      .select("id, title, tool, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (tool) query = query.eq("tool", tool);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { jobs: data ?? [] },
    };
  },
});
