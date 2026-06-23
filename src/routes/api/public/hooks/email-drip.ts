// Daily drip cron — sends welcome (day 0), examples (day 2), brand voice
// teaser (day 5), founding offer (day 7) to users based on signup age.
// Idempotency keyed by template + user id so re-runs are safe.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { renderAndEnqueueEmail } from "@/lib/email/render-and-enqueue.server";

const DRIPS: Array<{ template: string; days: number }> = [
  { template: "welcome-day-0", days: 0 },
  { template: "drip-day-2", days: 2 },
  { template: "drip-day-5", days: 5 },
  { template: "drip-day-7", days: 7 },
];

async function spotsLeft(supabase: any) {
  const { count } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("product_id", "founding_lifetime_97")
    .in("status", ["active", "trialing", "past_due"]);
  return Math.max(0, 50 - (count ?? 0));
}

export const Route = createFileRoute("/api/public/hooks/email-drip")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
        if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const supabase = createClient(process.env.SUPABASE_URL!, apiKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const spots = await spotsLeft(supabase);
        let queued = 0, dup = 0, skipped = 0, errs = 0;

        for (const drip of DRIPS) {
          // Look at users created (days ago) ± 12h window so we don't miss any
          // (cron is daily; a one-day window catches any signup that day).
          const start = new Date(Date.now() - (drip.days + 1) * 86400000).toISOString();
          const end = new Date(Date.now() - drip.days * 86400000).toISOString();

          const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
          if (error || !users?.users) continue;

          const targets = users.users.filter((u) => {
            const c = new Date(u.created_at).getTime();
            return c >= new Date(start).getTime() && c < new Date(end).getTime() && !!u.email;
          });

          for (const u of targets) {
            // Skip paid users for upgrade-focused drips (day 5, day 7)
            if (drip.days >= 5) {
              const { data: prof } = await supabase
                .from("profiles").select("plan").eq("user_id", u.id).maybeSingle();
              if (prof?.plan && prof.plan !== "free") { skipped++; continue; }
            }

            const { data: prof } = await supabase
              .from("profiles").select("display_name").eq("user_id", u.id).maybeSingle();
            const firstName = (prof?.display_name as string | undefined)?.split(" ")[0];

            const data: Record<string, any> = { firstName };
            if (drip.template === "drip-day-7") data.spotsLeft = spots;

            const res = await renderAndEnqueueEmail({
              supabase,
              templateName: drip.template,
              to: u.email!,
              idempotencyKey: `${drip.template}-${u.id}`,
              templateData: data,
            });
            if (res.status === "queued") queued++;
            else if (res.status === "duplicate") dup++;
            else if (res.status === "error") errs++;
            else skipped++;
          }
        }

        return Response.json({ queued, duplicates: dup, skipped, errors: errs });
      },
    },
  },
});
