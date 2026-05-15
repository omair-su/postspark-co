import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;
const RESERVED = new Set([
  "admin", "api", "app", "dashboard", "login", "signup", "auth", "u",
  "gallery", "blog", "pricing", "settings", "checkout", "onboarding",
  "review", "invite", "lovable", "support", "help", "about", "terms",
  "privacy", "refunds", "roadmap", "changelog", "features", "for",
]);

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const setHandle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      handle: z.string().min(3).max(30),
      tagline: z.string().max(160).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const handle = data.handle.toLowerCase().trim();
    if (!HANDLE_RE.test(handle)) {
      return { ok: false, error: "Handle must be 3-30 chars, letters/numbers/_- only." };
    }
    if (RESERVED.has(handle)) {
      return { ok: false, error: "That handle is reserved." };
    }

    // uniqueness
    const { data: clash } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("handle", handle)
      .neq("user_id", userId)
      .maybeSingle();
    if (clash) return { ok: false, error: "Handle already taken." };

    const { error } = await supabase
      .from("profiles")
      .update({ handle, tagline: data.tagline ?? null })
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, handle };
  });

export const getMyShowcaseInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("handle, tagline, display_name, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();
    return { profile: data || null };
  });

export const getCreatorShowcase = createServerFn({ method: "GET" })
  .inputValidator(z.object({ handle: z.string().min(1).max(40) }).parse)
  .handler(async ({ data }) => {
    const handle = data.handle.toLowerCase();
    const sb = admin();

    const { data: profile } = await sb
      .from("profiles")
      .select("user_id, handle, tagline, display_name, avatar_url, created_at")
      .ilike("handle", handle)
      .maybeSingle();
    if (!profile) return { profile: null, jobs: [] };

    const { data: jobs } = await sb
      .from("repurpose_jobs")
      .select("id, public_slug, title, input_text, outputs, view_count, created_at, is_featured")
      .eq("user_id", (profile as any).user_id)
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(48);

    return { profile, jobs: jobs || [] };
  });
