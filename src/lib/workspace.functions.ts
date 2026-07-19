import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function requireAgency(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  if (profile?.plan !== "agency") {
    throw new Error("AGENCY_REQUIRED");
  }
}

function genToken() {
  return [...crypto.getRandomValues(new Uint8Array(24))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const getMyWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;

    // Find any workspace where the user is a member
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, active_brand_kit_id")
      .eq("user_id", userId)
      .limit(1);

    if (!memberships || memberships.length === 0) {
      return { workspace: null, role: null, members: [], invites: [], brandKits: [], activeBrandKitId: null };
    }
    const m = memberships[0];

    const [{ data: workspace }, { data: members }, { data: invites }, { data: brandKits }] = await Promise.all([
      supabase.from("workspaces").select("*").eq("id", m.workspace_id).single(),
      supabase.from("workspace_members").select("user_id, role, joined_at").eq("workspace_id", m.workspace_id),
      supabase.from("workspace_invites").select("id, email, role, expires_at, accepted_at, created_at").eq("workspace_id", m.workspace_id).is("accepted_at", null),
      supabase.from("brand_kits").select("id, brand_name, tagline, logo_url, primary_color, accent_color").eq("workspace_id", m.workspace_id),
    ]);

    return {
      workspace,
      role: m.role,
      members: members || [],
      invites: invites || [],
      brandKits: brandKits || [],
      activeBrandKitId: m.active_brand_kit_id,
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const createWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().min(1).max(80) }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    await requireAgency(supabase, userId);

    const { data: ws, error } = await supabase
      .from("workspaces")
      .insert({ owner_id: userId, name: data.name })
      .select()
      .single();
    if (error) return { success: false, error: error.message };

    await supabaseAdmin.from("workspace_members").insert({
      workspace_id: ws.id,
      user_id: userId,
      role: "owner",
    });

    return { success: true, workspace: ws };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const updateWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      workspaceId: z.string().uuid(),
      name: z.string().min(1).max(80).optional(),
      whiteLabel: z.boolean().optional(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    await requireAgency(supabase, userId);

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.whiteLabel !== undefined) update.white_label = data.whiteLabel;

    const { error } = await supabase.from("workspaces").update(update as any).eq("id", data.workspaceId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      workspaceId: z.string().uuid(),
      email: z.string().email().max(120),
      role: z.enum(["admin", "member"]).default("member"),
    }).parse
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    await requireAgency(supabase, userId);

    // Enforce 5-seat cap
    const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
      supabase.from("workspace_members").select("user_id", { count: "exact", head: true }).eq("workspace_id", data.workspaceId),
      supabase.from("workspace_invites").select("id", { count: "exact", head: true }).eq("workspace_id", data.workspaceId).is("accepted_at", null),
    ]);
    if ((memberCount ?? 0) + (inviteCount ?? 0) >= 5) {
      return { success: false, error: "Seat limit reached (5 max)." };
    }

    const token = genToken();
    const { error } = await supabase.from("workspace_invites").insert({
      workspace_id: data.workspaceId,
      email: data.email.toLowerCase(),
      role: data.role,
      token,
      invited_by: userId,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, token };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ inviteId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase } = context;
    const { error } = await supabase.from("workspace_invites").delete().eq("id", data.inviteId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ workspaceId: z.string().uuid(), userId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase } = context;
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", data.userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ token: z.string().min(8).max(80) }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId, claims } = context;
    const email = (claims?.email as string | undefined)?.toLowerCase();

    // Use admin client: the `token` column is not readable via the user
    // session (SELECT(token) revoked from authenticated/anon) to prevent
    // workspace admins from harvesting other invitees' tokens.
    const { data: invite } = await supabaseAdmin
      .from("workspace_invites")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { success: false, error: "Invite not found." };
    if (invite.accepted_at) return { success: false, error: "Invite already used." };
    if (new Date(invite.expires_at).getTime() < Date.now()) return { success: false, error: "Invite expired." };
    if (!email) {
      return { success: false, error: "Your account must have a verified email to accept invites." };
    }
    if (invite.email.toLowerCase() !== email) {
      return { success: false, error: `Invite is for ${invite.email}. Sign in with that email.` };
    }

    await supabaseAdmin.from("workspace_members").insert({
      workspace_id: invite.workspace_id,
      user_id: userId,
      role: invite.role,
    });
    await supabaseAdmin
      .from("workspace_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return { success: true, workspaceId: invite.workspace_id };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const setActiveBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      workspaceId: z.string().uuid(),
      brandKitId: z.string().uuid().nullable(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("workspace_members")
      .update({ active_brand_kit_id: data.brandKitId })
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const createWorkspaceBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      workspaceId: z.string().uuid(),
      brandName: z.string().min(1).max(100),
    }).parse
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    await requireAgency(supabase, userId);

    const { data: kit, error } = await supabase
      .from("brand_kits")
      .insert({
        user_id: userId,
        workspace_id: data.workspaceId,
        brand_name: data.brandName,
      } as any)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, kit };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });