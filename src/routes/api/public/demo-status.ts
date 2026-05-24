import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DAILY_LIMIT = 3;

function hashIp(req: Request): string {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256")
    .update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || "salt"))
    .digest("hex")
    .slice(0, 32);
}

export const Route = createFileRoute("/api/public/demo-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ipHash = hashIp(request);
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("demo_uses")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", since);
        const used = count ?? 0;
        return Response.json({
          limit: DAILY_LIMIT,
          used,
          remaining: Math.max(0, DAILY_LIMIT - used),
          resetsInHours: 24,
        });
      },
    },
  },
});
