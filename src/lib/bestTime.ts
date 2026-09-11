/**
 * Best-time scheduling suggestions.
 * Local, deterministic heuristics per platform (weekday windows in the user's
 * own timezone) so the Studio can propose a slot without an extra AI call.
 */

export type BestTimePlatform =
  | "twitter" | "threads" | "linkedin" | "instagram"
  | "facebook" | "tiktok" | "youtube" | "blog" | "email";

/** Preferred posting hours (24h, local time), best first. */
const SLOTS: Record<BestTimePlatform, number[]> = {
  twitter: [9, 12, 17],
  threads: [11, 19, 8],
  linkedin: [8, 10, 12],
  instagram: [11, 18, 20],
  facebook: [13, 9, 19],
  tiktok: [19, 12, 21],
  youtube: [16, 12, 19],
  blog: [10, 14],
  email: [9, 11],
};

/** Platforms that perform best on weekdays only. */
const WEEKDAY_ONLY = new Set<BestTimePlatform>(["linkedin", "email", "blog"]);

export interface BestSlot {
  date: Date;
  label: string;
  reason: string;
}

function fmt(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

/**
 * Next recommended slot for a platform, at least `minLeadMinutes` from now.
 * `offsetIndex` walks further down the list so a whole pack can be spread out.
 */
export function nextBestSlot(
  platform: BestTimePlatform,
  offsetIndex = 0,
  from: Date = new Date(),
  minLeadMinutes = 30,
): BestSlot {
  const hours = SLOTS[platform] ?? SLOTS.twitter;
  const earliest = new Date(from.getTime() + minLeadMinutes * 60_000);
  const candidates: Date[] = [];

  for (let day = 0; day < 14 && candidates.length <= offsetIndex + 4; day++) {
    const base = new Date(earliest);
    base.setDate(base.getDate() + day);
    const dow = base.getDay();
    if (WEEKDAY_ONLY.has(platform) && (dow === 0 || dow === 6)) continue;
    for (const h of hours) {
      const d = new Date(base);
      d.setHours(h, 0, 0, 0);
      if (d.getTime() >= earliest.getTime()) candidates.push(d);
    }
  }

  candidates.sort((a, b) => a.getTime() - b.getTime());
  const picked = candidates[Math.min(offsetIndex, candidates.length - 1)]
    ?? new Date(earliest.getTime() + 24 * 60 * 60_000);

  return {
    date: picked,
    label: fmt(picked),
    reason: WEEKDAY_ONLY.has(platform)
      ? "Weekday business hours perform best here"
      : "Peak engagement window for this platform",
  };
}

export function bestHoursFor(platform: BestTimePlatform): number[] {
  return SLOTS[platform] ?? SLOTS.twitter;
}
