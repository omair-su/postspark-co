import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let cache: { at: number; payload: { generatedToday: number; signupsThisWeek: number } } | null = null;
const TTL_MS = 60_000;

export const Route = createFileRoute("/api/public/demo-stats")({
  server: {
    handlers: {
      GET: async () => {
        if (cache && Date.now() - cache.at < TTL_MS) {
          return Response.json(cache.payload, {
            headers: { "Cache-Control": "public, max-age=60" },
          });
        }

        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [genRes, signupRes] = await Promise.all([
          supabaseAdmin
            .from("demo_uses")
            .select("id", { count: "exact", head: true })
            .gte("created_at", dayAgo),
          supabaseAdmin
            .from("profiles")
            .select("user_id", { count: "exact", head: true })
            .gte("created_at", weekAgo),
        ]);

        // Add a baseline so brand-new projects don't look empty (real numbers add on top).
        const generatedToday = (genRes.count ?? 0) + 2400;
        const signupsThisWeek = (signupRes.count ?? 0) + 280;

        const payload = { generatedToday, signupsThisWeek };
        cache = { at: Date.now(), payload };
        return Response.json(payload, {
          headers: { "Cache-Control": "public, max-age=60" },
        });
      },
    },
  },
});
