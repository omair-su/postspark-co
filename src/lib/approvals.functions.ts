import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function genToken() {
  return [...crypto.getRandomValues(new Uint8Array(24))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function requireAgency(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  if (profile?.plan !== "agency") throw new Error("AGENCY_REQUIRED");
}

export const createApprovalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      clientEmail: z.string().email().optional().nullable(),
      workspaceId: z.string().uuid().optional().nullable(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAgency(supabase, userId);

    const token = genToken();
    const { data: ar, error } = await supabase
      .from("approval_requests")
      .insert({
        job_id: data.jobId,
        workspace_id: data.workspaceId ?? null,
        created_by: userId,
        client_email: data.clientEmail ?? null,
        token,
      })
      .select("id, token")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, token: ar.token, id: ar.id };
  });

export const listApprovalRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("approval_requests")
      .select("id, job_id, status, client_email, client_name, client_comment, decided_at, created_at")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { approvals: data || [] };
  });

export const listApprovalAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ approvalId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("approval_audit_log")
      .select("id, action, old_status, new_status, actor_user_id, actor_label, client_name, client_comment, created_at")
      .eq("approval_id", data.approvalId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { entries: [], error: error.message };
    return { entries: rows ?? [], error: null };
  });

// Public (no auth) — uses anon client + secure RPC
export const fetchApprovalByToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(8).max(80) }).parse)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin.rpc("get_approval_by_token", { _token: data.token });
    if (error) return { approval: null, error: error.message };
    return { approval: result, error: null };
  });

export const submitApprovalResponse = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(8).max(80),
      status: z.enum(["approved", "changes_requested"]),
      clientName: z.string().max(80).optional(),
      clientComment: z.string().max(1000).optional(),
    }).parse
  )
  .handler(async ({ data }) => {
    const { data: ok, error } = await supabaseAdmin.rpc("respond_to_approval", {
      _token: data.token,
      _status: data.status,
      _client_name: (data.clientName ?? null) as string,
      _client_comment: (data.clientComment ?? null) as string,
    });
    if (error) return { success: false, error: error.message };
    return { success: ok === true };
  });
