// Admin-only: send the "2 months Pro for a testimonial" campaign to all
// active free users. Idempotency keyed per user — a second invocation is
// a no-op for anyone already emailed.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendTestimonialCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderAndEnqueueEmail } = await import("@/lib/email/render-and-enqueue.server");

    const { data: freeProfiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name")
      .or("plan.is.null,plan.eq.free");

    if (!freeProfiles?.length) return { queued: 0, total: 0 };

    let queued = 0, dup = 0, errs = 0;
    for (const p of freeProfiles) {
      const { data: au } = await supabaseAdmin.auth.admin.getUserById(p.user_id as string);
      const email = au?.user?.email;
      if (!email) continue;
      const res = await renderAndEnqueueEmail({
        supabase: supabaseAdmin,
        templateName: "testimonial-request",
        to: email,
        idempotencyKey: `testimonial-request-${p.user_id}`,
        templateData: { firstName: ((p.display_name as string | null) || "").split(" ")[0] || undefined },
      });
      if (res.status === "queued") queued++;
      else if (res.status === "duplicate") dup++;
      else if (res.status === "error") errs++;
    }
    return { queued, duplicates: dup, errors: errs, total: freeProfiles.length };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });