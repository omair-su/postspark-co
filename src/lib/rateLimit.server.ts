/**
 * Durable, cross-instance rate limiting.
 *
 * The old per-instance Map only limited one worker, so the same user could
 * exceed the limit simply by being routed elsewhere. Hits are now recorded in
 * Postgres under an advisory lock, so the limit holds for the whole app.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function rateLimitedDurable(
  subject: string,
  action: string,
  max = 10,
  windowSeconds = 60,
): Promise<boolean> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc("check_rate_limit", {
      _subject: subject,
      _action: action,
      _max: max,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("check_rate_limit error:", error);
      return false; // never block real work on a limiter outage
    }
    return data === true;
  } catch (e) {
    console.error("check_rate_limit threw:", e);
    return false;
  }
}
