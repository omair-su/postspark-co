import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/hooks/weekly-digest")({
  server: {
    handlers: {
      POST: async () => {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const sevenDaysAhead = new Date(Date.now() + 7 * 86400000).toISOString();

        // Users opted in
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, streak_days")
          .eq("weekly_digest_enabled", true);

        if (!profiles?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

        let sent = 0;
        for (const p of profiles) {
          const userId = (p as any).user_id;
          // Get email from auth.users
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          const email = authUser?.user?.email;
          if (!email) continue;

          const [{ data: drafts }, { data: jobs }] = await Promise.all([
            supabase
              .from("scheduled_posts")
              .select("title, platform, scheduled_for")
              .eq("user_id", userId)
              .gte("scheduled_for", new Date().toISOString())
              .lte("scheduled_for", sevenDaysAhead)
              .order("scheduled_for", { ascending: true })
              .limit(10),
            supabase
              .from("repurpose_jobs")
              .select("input_text, tool, created_at")
              .eq("user_id", userId)
              .gte("created_at", sevenDaysAgo)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

          const topPosts = (jobs || []).map((j: any) => ({
            title: String(j.input_text || "").slice(0, 80),
            platform: j.tool || "repurpose",
          }));
          const draftRows = (drafts || []).map((d: any) => ({
            title: String(d.title || "").slice(0, 80),
            platform: d.platform,
            scheduledFor: d.scheduled_for,
          }));

          if (draftRows.length === 0 && topPosts.length === 0) continue;

          try {
            await supabase.rpc("enqueue_email", {
              queue_name: "transactional_emails",
              payload: {
                template_name: "weekly-digest",
                recipient_email: email,
                idempotency_key: `weekly-digest-${userId}-${new Date().toISOString().slice(0, 10)}`,
                template_data: {
                  firstName: ((p as any).display_name || "").split(" ")[0] || undefined,
                  scheduledCount: draftRows.length,
                  drafts: draftRows,
                  topPosts,
                  streak: (p as any).streak_days || 0,
                  dashboardUrl: "https://postspark.co/dashboard",
                  calendarUrl: "https://postspark.co/dashboard/calendar",
                },
              },
            });
            sent++;
          } catch (e) {
            console.error("weekly-digest enqueue failed for", userId, e);
          }
        }

        return new Response(JSON.stringify({ sent, total: profiles.length }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
