import { createFileRoute } from "@tanstack/react-router";
import { processScheduledPosts } from "@/lib/scheduledPublishing.server";

export const Route = createFileRoute("/api/public/hooks/publish-scheduled")({
  server: { handlers: { POST: async ({ request }) => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const provided = request.headers.get("apikey") || (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!serviceKey || !provided || provided !== serviceKey) return Response.json({ error: "unauthorized" }, { status: 401 });
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return Response.json({ ok: true, ...(await processScheduledPosts(supabaseAdmin)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scheduled publishing failed.";
      console.error("[scheduled-publisher]", error);
      return Response.json({ error: message }, { status: 500 });
    }
  } } },
});