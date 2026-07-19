import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generatePodcastPack, type PodcastFormat } from "@/server/podcast.server";

const FORMATS = [
  "tweets", "thread", "linkedin", "instagram", "tiktok", "facebook",
  "show_notes", "summary", "blog_post", "newsletter", "youtube_description",
  "title_suggestions", "pull_quotes", "chapters", "key_topics",
  "promo_email", "sponsor_pitch",
] as const;

export const generatePodcastContentPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      transcript: z.string().min(50).max(80000),
      episodeTitle: z.string().max(300).optional(),
      showName: z.string().max(300).optional(),
      guest: z.string().max(300).optional(),
      niche: z.string().max(300).optional(),
      formats: z.array(z.enum(FORMATS)).min(1).max(FORMATS.length),
      quantities: z.record(z.enum(FORMATS), z.number().int().min(1).max(20)).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Usage gate (free: 10/mo)
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();
    const plan = profile?.plan || "free";
    const isPro = plan === "pro" || plan === "agency";
    if (!isPro) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("repurpose_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());
      if ((count ?? 0) >= 10) {
        return { output: "", error: "LIMIT_REACHED" as const };
      }
    }

    // Brand voice
    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const result = await generatePodcastPack({
      transcript: data.transcript,
      episodeTitle: data.episodeTitle,
      showName: data.showName,
      guest: data.guest,
      niche: data.niche,
      formats: data.formats as PodcastFormat[],
      quantities: data.quantities as Partial<Record<PodcastFormat, number>>,
      brandVoiceSummary: voice?.style_summary || "",
    });

    if (!result.error && result.output) {
      await supabase.from("repurpose_jobs").insert({
        user_id: userId,
        tool: "podcast",
        input_text: `[Podcast pack] ${data.episodeTitle || data.showName || "untitled"}`,
        outputs: { sections: data.formats, length: result.output.length } as never,
      } as never);
    }

    return result;
  });