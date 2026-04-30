import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get templates error:", error);
      return { templates: [] };
    }
    return { templates: data || [] };
  });

export const createTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(1).max(100),
      tone: z.string().max(50),
      customInstructions: z.string().max(500),
      selectedTypes: z.array(z.string()).min(1).max(10),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase.from("templates").insert({
      user_id: userId,
      name: data.name,
      tone: data.tone,
      custom_instructions: data.customInstructions,
      selected_types: data.selectedTypes,
    });

    if (error) {
      console.error("Create template error:", error);
      return { success: false, error: "Failed to save template" };
    }
    return { success: true };
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ id: z.string().uuid() }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete template error:", error);
      return { success: false };
    }
    return { success: true };
  });
