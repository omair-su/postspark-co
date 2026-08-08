// Single, deterministic source of truth for "which Brand Kit is active".
// `maybeSingle()` on `is_active = true` silently returns null when a user has
// more than one active kit, which is why brand context used to vanish. This
// resolver always returns exactly one kit: newest active first, otherwise the
// newest kit the user owns.

export interface ActiveBrandKit {
  id: string;
  name: string | null;
  brand_name: string | null;
  tagline: string | null;
  preferred_tone: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  neutral_color: string | null;
  background_color: string | null;
  font_heading: string | null;
  font_body: string | null;
  colors: any;
  logo_variants: any;
  watermark_settings: any;
  [key: string]: any;
}

const FIELDS =
  "id, name, brand_name, brand_handle, tagline, preferred_tone, logo_url, logo_variants, primary_color, secondary_color, accent_color, neutral_color, background_color, font_heading, font_body, custom_fonts, colors, watermark_settings, is_active, updated_at";

export async function resolveActiveBrandKit(
  supabase: any,
  userId: string,
): Promise<ActiveBrandKit | null> {
  const { data: active } = await supabase
    .from("brand_kits")
    .select(FIELDS)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (active?.[0]) return active[0] as ActiveBrandKit;

  const { data: fallback } = await supabase
    .from("brand_kits")
    .select(FIELDS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);
  return (fallback?.[0] as ActiveBrandKit) ?? null;
}

/** Text-generation context: everything a writing model can actually honour. */
export function brandKitPromptContext(kit: ActiveBrandKit | null): string {
  if (!kit) return "";
  const parts: string[] = [];
  if (kit.brand_name) parts.push(`Brand: ${kit.brand_name}`);
  if (kit.brand_handle) parts.push(`Handle: ${kit.brand_handle}`);
  if (kit.tagline) parts.push(`Tagline: ${kit.tagline}`);
  if (kit.preferred_tone) parts.push(`Preferred tone: ${kit.preferred_tone}`);
  return parts.join(" | ");
}

/** Visual tokens for image / carousel / thumbnail / watermark surfaces. */
export function brandKitVisualTokens(kit: ActiveBrandKit | null) {
  if (!kit) return null;
  const palette = Array.isArray(kit.colors) ? kit.colors : [];
  return {
    kitId: kit.id,
    logoUrl: kit.logo_url || null,
    logoVariants: kit.logo_variants || null,
    primary: kit.primary_color || null,
    secondary: kit.secondary_color || null,
    accent: kit.accent_color || null,
    neutral: kit.neutral_color || null,
    background: kit.background_color || null,
    palette,
    fontHeading: kit.font_heading || null,
    fontBody: kit.font_body || null,
    watermark: kit.watermark_settings || null,
  };
}
