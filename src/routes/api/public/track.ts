import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  event: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/i),
  session_id: z.string().max(80).optional(),
  path: z.string().max(200).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  referrer: z.string().max(200).optional(),
  user_id: z.string().uuid().optional(),
  props: z.record(z.string(), z.any()).nullable().optional(),
});

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const json = await request.json();
          const parsed = Schema.safeParse(json);
          if (!parsed.success) return new Response("bad", { status: 400 });
          const d = parsed.data;
          await supabaseAdmin.from("analytics_events").insert({
            event: d.event,
            user_id: d.user_id ?? null,
            session_id: d.session_id ?? null,
            path: d.path ?? null,
            utm_source: d.utm_source ?? null,
            utm_medium: d.utm_medium ?? null,
            utm_campaign: d.utm_campaign ?? null,
            utm_content: d.utm_content ?? null,
            utm_term: d.utm_term ?? null,
            referrer: d.referrer ?? null,
            props: d.props ?? null,
          });
          return new Response("ok", { status: 200 });
        } catch {
          return new Response("err", { status: 200 }); // never break the client
        }
      },
    },
  },
});
