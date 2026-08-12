import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ToolHistoryEntry {
  id: string;
  title: string | null;
  input_text: string;
  outputs: Record<string, string> | null;
  created_at: string;
}

/** Recent generations for one tool, newest first. */
export const listToolHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      tool: z.string().min(2).max(40),
      limit: z.number().int().min(1).max(50).default(20),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("repurpose_jobs")
      .select("id, title, input_text, outputs, created_at")
      .eq("user_id", userId)
      .eq("tool", data.tool)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) {
      console.error("tool history error", error);
      return { entries: [] as ToolHistoryEntry[] };
    }
    return { entries: (rows || []) as unknown as ToolHistoryEntry[] };
  });
