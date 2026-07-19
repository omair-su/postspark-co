import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

export const pingStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_days, longest_streak, last_active_date")
      .eq("user_id", userId)
      .maybeSingle();

    const today = todayUTC();
    const last = (profile as any)?.last_active_date as string | null;
    let streak = (profile as any)?.streak_days ?? 0;
    let longest = (profile as any)?.longest_streak ?? 0;

    if (!last) {
      streak = 1;
    } else {
      const diff = daysBetween(last, today);
      if (diff === 0) {
        // already pinged today
        return { streak, longest, alreadyPinged: true };
      } else if (diff === 1) {
        streak = streak + 1;
      } else {
        streak = 1;
      }
    }
    if (streak > longest) longest = streak;

    await supabase
      .from("profiles")
      .update({
        streak_days: streak,
        longest_streak: longest,
        last_active_date: today,
      } as any)
      .eq("user_id", userId);

    return { streak, longest, alreadyPinged: false };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const getStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("streak_days, longest_streak, last_active_date")
      .eq("user_id", userId)
      .maybeSingle();
    const today = todayUTC();
    const last = (data as any)?.last_active_date as string | null;
    let streak = (data as any)?.streak_days ?? 0;
    // Decay if user missed more than a day
    if (last) {
      const diff = daysBetween(last, today);
      if (diff > 1) streak = 0;
    }
    return {
      streak,
      longest: (data as any)?.longest_streak ?? 0,
      lastActive: last,
      activeToday: last === today,
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
