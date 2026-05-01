import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getUserClient(authHeader: string | undefined) {
  if (!authHeader) throw new Error("Unauthorized");
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

export const completeOnboarding = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      role: z.string().min(1).max(60),
      platforms: z.array(z.string().min(1).max(40)).max(20),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const req = (context as any)?.request as Request | undefined;
    const auth = req?.headers.get("authorization") || undefined;
    const userId = await getUserId(auth);
    const sb = getUserClient(auth);

    const { error } = await (sb as any)
      .from("profiles")
      .update({
        primary_role: data.role,
        primary_platforms: data.platforms,
        onboarding_completed: true,
      })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const req = (context as any)?.request as Request | undefined;
    const auth = req?.headers.get("authorization") || undefined;
    const userId = await getUserId(auth);
    const sb = getUserClient(auth);
    const { data } = await (sb as any)
      .from("profiles")
      .select("onboarding_completed, primary_role, primary_platforms")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      completed: Boolean(data?.onboarding_completed),
      role: data?.primary_role || null,
      platforms: (data?.primary_platforms || []) as string[],
    };
  });
