/**
 * Shared, server-only preparation for one repurpose format generation.
 *
 * Both the buffered server function (`repurposeOneFormat`) and the streaming SSE
 * route (`/api/repurpose-stream`) use this, so plan gating, Brand Voice, Brand
 * Kit resolution, pack claiming (quota) and persistence behave identically no
 * matter which transport the client picked.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveActiveBrandKit, brandKitPromptContext } from "@/lib/activeBrandKit.server";
import { claimRepurposePack } from "@/lib/repurposeLimits.server";
import type { GenerateFormatOpts } from "@/lib/repurpose.server";

export interface FormatRequest {
  packId: string;
  inputText: string;
  format: string;
  count?: number;
  style?: string;
  length?: string;
  tone?: string;
  styleModifiers?: string[];
  customInstructions?: string;
  language?: string;
}

type AnyClient = SupabaseClient<any, any, any>;

/**
 * Resolve plan/voice/kit, claim the pack (monthly quota) and return the fully
 * built generation options. Returns `{ error }` when the caller must stop.
 */
export async function prepareFormatGeneration(
  supabase: AnyClient,
  userId: string,
  data: FormatRequest,
): Promise<
  | { error: string; opts?: undefined; packTitle?: undefined }
  | { error?: undefined; opts: GenerateFormatOpts; packTitle: string }
> {
  const { data: profile } = await supabase
    .from("profiles").select("plan").eq("user_id", userId).maybeSingle();

  const plan = (profile as any)?.plan || "free";
  const isPro = plan === "pro" || plan === "agency";

  let brandVoiceSummary = "";
  let voiceProfile: any = undefined;
  if (isPro) {
    const { data: voice } = await supabase
      .from("brand_voices")
      .select("style_summary, style_override, tone_sliders, dos, donts, emoji_density, sentence_length, cta_style")
      .eq("user_id", userId).eq("is_active", true).maybeSingle();
    const v: any = voice;
    brandVoiceSummary = (v?.style_override as string) || (v?.style_summary as string) || "";
    if (v) {
      voiceProfile = {
        tone_sliders: v.tone_sliders || undefined,
        dos: Array.isArray(v.dos) ? v.dos : undefined,
        donts: Array.isArray(v.donts) ? v.donts : undefined,
        emoji_density: v.emoji_density || undefined,
        sentence_length: v.sentence_length || undefined,
        cta_style: v.cta_style || undefined,
      };
    }
  }

  let effectiveTone = data.tone || "professional";
  let brandKitId: string | null = null;
  const kit = await resolveActiveBrandKit(supabase as any, userId);
  if (kit) {
    brandKitId = kit.id ?? null;
    if (!data.tone && kit.preferred_tone) effectiveTone = kit.preferred_tone;
  }
  const brandContext = brandKitPromptContext(kit);
  const mergedInstructions = brandContext
    ? `${data.customInstructions || ""}${data.customInstructions ? " " : ""}Brand context — ${brandContext}.`.trim()
    : (data.customInstructions || "");

  let workspaceId: string | null = null;
  const { data: membership } = await supabase
    .from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  if ((membership as any)?.workspace_id) workspaceId = (membership as any).workspace_id as string;

  const packTitle = data.inputText.replace(/\s+/g, " ").trim().slice(0, 120);

  const claim = await claimRepurposePack(supabase as any, {
    packId: data.packId,
    userId,
    inputText: data.inputText,
    title: packTitle,
    brandKitId,
    workspaceId,
  });
  if (!claim.ok) {
    return { error: claim.error === "LIMIT_REACHED" ? "LIMIT_REACHED" : (claim.error || "Could not start pack") };
  }

  return {
    packTitle,
    opts: {
      inputText: data.inputText,
      format: data.format,
      count: data.count,
      style: data.style,
      length: data.length,
      tone: effectiveTone,
      styleModifiers: data.styleModifiers || [],
      customInstructions: mergedInstructions,
      brandVoiceSummary,
      language: data.language || "English",
      voiceProfile,
    },
  };
}

/** Atomic JSONB merge of one completed format into the pack, with fallback. */
export async function persistFormatOutput(
  supabase: AnyClient,
  userId: string,
  packId: string,
  format: string,
  output: string,
  packTitle: string,
): Promise<void> {
  const { error: rpcErr } = await (supabase as any).rpc("append_repurpose_outputs", {
    _job_id: packId,
    _user_id: userId,
    _patch: { [format]: output },
    _title: packTitle,
  });
  if (!rpcErr) return;

  console.error("append_repurpose_outputs RPC error, falling back:", rpcErr);
  const { data: existing } = await supabase
    .from("repurpose_jobs").select("outputs").eq("id", packId).eq("user_id", userId).maybeSingle();
  const prev = ((existing as any)?.outputs as Record<string, unknown>) || {};
  await supabase
    .from("repurpose_jobs")
    .update({ outputs: { ...prev, [format]: output } as any, title: packTitle })
    .eq("id", packId).eq("user_id", userId);
}
