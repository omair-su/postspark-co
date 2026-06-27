import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listEditorProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("shorts_editor_projects")
      .select("id, name, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) return { projects: [] as Array<{ id: string; name: string; updated_at: string }> };
    return { projects: (data || []) as any };
  });

export const loadEditorProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("shorts_editor_projects")
      .select("id, name, project_json, updated_at")
      .eq("user_id", userId)
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return { project: null };
    return { project: row as any };
  });

export const saveEditorProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(120),
      projectJson: z.record(z.string(), z.any()),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { data: row, error } = await supabase
        .from("shorts_editor_projects")
        .update({ name: data.name, project_json: data.projectJson as any })
        .eq("id", data.id)
        .eq("user_id", userId)
        .select("id")
        .single();
      if (error) return { id: null, error: error.message };
      return { id: row.id, error: null };
    }
    const { data: row, error } = await supabase
      .from("shorts_editor_projects")
      .insert({ user_id: userId, name: data.name, project_json: data.projectJson as any } as any)
      .select("id")
      .single();
    if (error) return { id: null, error: error.message };
    return { id: row.id, error: null };
  });

export const deleteEditorProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("shorts_editor_projects").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });
