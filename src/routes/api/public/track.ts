import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Public analytics endpoint. user_id must NEVER be trusted from the client —
// it is derived server-side from the caller's JWT (when present) so anonymous
// callers can't attribute fake events to real user UUIDs.
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
  props: z.record(z.string(), z.any()).nullable().optional(),
});

async function resolveUserIdFromAuthHeader(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null;
  try {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anon) return null;
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// Lightweight in-memory IP rate limit (per Worker isolate). Best-effort
// throttle to limit cheap analytics spam.
const RL = new Map<string, number[]>();
function rateLimited(ip: string, limit = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (RL.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    RL.set(ip, arr);
    return true;
  }
  arr.push(now);
  RL.set(ip, arr);
  return false;
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip =
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown";
          if (rateLimited(ip)) return new Response("ok", { status: 200 });

          const json = await request.json();
          const parsed = Schema.safeParse(json);
          if (!parsed.success) return new Response("bad", { status: 400 });
          const d = parsed.data;

          const userId = await resolveUserIdFromAuthHeader(
            request.headers.get("authorization"),
          );

          await supabaseAdmin.from("analytics_events").insert({
            event: d.event,
            user_id: userId,
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
