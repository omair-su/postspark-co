import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getUserClient(authHeader: string) {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}
async function getUserId(authHeader: string | undefined) {
  if (!authHeader) throw new Error("Unauthorized");
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user.id;
}

export const getReferralStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const auth = getRequestHeader("authorization");
    if (!auth) throw new Error("Unauthorized");
    const userId = await getUserId(auth);
    const sb = getUserClient(auth);

    const { data: profile } = await (sb as any)
      .from("profiles")
      .select("referral_code")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: refs } = await (sb as any)
      .from("referrals")
      .select("id, status, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const list = (refs || []) as Array<{ id: string; status: string; created_at: string }>;
    return {
      code: profile?.referral_code || null,
      total: list.length,
      rewarded: list.filter((r) => r.status === "rewarded").length,
      pending: list.filter((r) => r.status === "pending").length,
      items: list,
    };
  });
