import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateRepurposedContent } from "./repurpose.server";

const FREE_MONTHLY_LIMIT = 3;

export const getMonthlyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("repurpose_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) {
      console.error("Usage count error:", error);
      return { used: 0, limit: FREE_MONTHLY_LIMIT };
    }

    return { used: count ?? 0, limit: FREE_MONTHLY_LIMIT };
  });

export const repurposeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      inputText: z.string().min(1).max(50000),
      selectedTypes: z.array(z.string().min(1).max(20)).min(1).max(4),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("repurpose_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (!countError && (count ?? 0) >= FREE_MONTHLY_LIMIT) {
      return { output: "", error: "LIMIT_REACHED" };
    }

    const result = await generateRepurposedContent(data.inputText, data.selectedTypes);

    // Save to DB on success (server-side, using authenticated client)
    if (!result.error && result.output) {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        input_text: data.inputText,
        outputs: { raw: result.output },
      });
    }

    return result;
  });
