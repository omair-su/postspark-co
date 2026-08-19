/**
 * Carousel design engine.
 *
 * Everything visual about a slide is derived from three inputs:
 *   preset   → exact export pixel dimensions
 *   template → background recipe, type scale, alignment, decoration
 *   palette  → brand colours (from the active Brand Kit) or template defaults
 *
 * Slides are ALWAYS rendered at the preset's true pixel size and scaled down
 * for preview with a CSS transform, so a PNG export is genuinely 1080×1350.
 */

export interface CarouselPreset {
  key: string;
  label: string;
  hint: string;
  width: number;
  height: number;
  platform: "linkedin" | "instagram" | "twitter";
}

export const CAROUSEL_PRESETS: CarouselPreset[] = [
  { key: "linkedin_45", label: "LinkedIn", hint: "4:5 · 1080×1350", width: 1080, height: 1350, platform: "linkedin" },
  { key: "instagram_11", label: "Instagram", hint: "1:1 · 1080×1080", width: 1080, height: 1080, platform: "instagram" },
  { key: "story_916", label: "Story / Reels", hint: "9:16 · 1080×1920", width: 1080, height: 1920, platform: "instagram" },
  { key: "x_169", label: "X (Twitter)", hint: "16:9 · 1600×900", width: 1600, height: 900, platform: "twitter" },
];

export function presetByKey(key: string): CarouselPreset {
  return CAROUSEL_PRESETS.find((p) => p.key === key) ?? CAROUSEL_PRESETS[0];
}

/* ------------------------------------------------------------------ fonts */

export interface FontPair {
  key: string;
  label: string;
  heading: string;
  body: string;
  headingWeight: number;
  /** Extra tracking for the heading, in em. */
  tracking: number;
}

export const FONT_PAIRS: FontPair[] = [
  { key: "editorial", label: "Editorial", heading: "Instrument Serif", body: "Inter", headingWeight: 400, tracking: -0.01 },
  { key: "modern", label: "Modern", heading: "Sora", body: "Manrope", headingWeight: 700, tracking: -0.02 },
  { key: "impact", label: "Impact", heading: "Archivo Black", body: "Hind", headingWeight: 400, tracking: -0.02 },
  { key: "clean", label: "Clean", heading: "Outfit", body: "Figtree", headingWeight: 700, tracking: -0.02 },
  { key: "luxe", label: "Luxe", heading: "Cormorant Garamond", body: "Karla", headingWeight: 600, tracking: 0 },
  { key: "tech", label: "Tech", heading: "Space Grotesk", body: "DM Sans", headingWeight: 700, tracking: -0.02 },
];

export function fontPairByKey(key: string): FontPair {
  return FONT_PAIRS.find((f) => f.key === key) ?? FONT_PAIRS[1];
}

/** Google Fonts href covering every pair (loaded once from the route). */
export const CAROUSEL_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Instrument+Serif:ital@0;1",
    "family=Inter:wght@400;500;600;700",
    "family=Sora:wght@400;600;700;800",
    "family=Manrope:wght@400;500;600;700",
    "family=Archivo+Black",
    "family=Hind:wght@400;500;600;700",
    "family=Outfit:wght@400;600;700;800",
    "family=Figtree:wght@400;500;600;700",
    "family=Cormorant+Garamond:wght@400;600;700",
    "family=Karla:wght@400;500;600;700",
    "family=Space+Grotesk:wght@400;500;700",
    "family=DM+Sans:wght@400;500;700",
  ].join("&") +
  "&display=swap";

/* -------------------------------------------------------------- templates */

export type BackgroundKind = "gradient" | "mesh" | "solid" | "duotone" | "frame" | "grid";

export interface CarouselTemplate {
  key: string;
  label: string;
  blurb: string;
  pro: boolean;
  background: BackgroundKind;
  /** Base surface colour when no brand colour is used. */
  surface: string;
  accent: string;
  text: string;
  subtle: string;
  fontPair: string;
  align: "left" | "center";
  /** Uppercase eyebrow labels. */
  uppercaseLabel: boolean;
  /** Show a thin accent rule under the eyebrow. */
  rule: boolean;
  /** Rounded inner card behind the copy (glass look). */
  card: boolean;
  /** How strongly a photo background is darkened (0-1). */
  scrim: number;
}

export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  {
    key: "editorial", label: "Editorial", blurb: "Serif headline, generous margins, magazine calm.",
    pro: false, background: "solid", surface: "#faf8f4", accent: "#1a1a2e", text: "#14141f",
    subtle: "rgba(20,20,31,0.66)", fontPair: "editorial", align: "left",
    uppercaseLabel: true, rule: true, card: false, scrim: 0.5,
  },
  {
    key: "noir", label: "Noir Luxe", blurb: "Deep black, gold accent, high-end restraint.",
    pro: false, background: "gradient", surface: "#0a0a0c", accent: "#d4af6a", text: "#f7f5f0",
    subtle: "rgba(247,245,240,0.7)", fontPair: "luxe", align: "left",
    uppercaseLabel: true, rule: true, card: false, scrim: 0.62,
  },
  {
    key: "aurora", label: "Aurora", blurb: "Soft mesh gradient with luminous depth.",
    pro: false, background: "mesh", surface: "#151032", accent: "#a78bfa", text: "#ffffff",
    subtle: "rgba(255,255,255,0.76)", fontPair: "modern", align: "left",
    uppercaseLabel: true, rule: false, card: false, scrim: 0.55,
  },
  {
    key: "glass", label: "Glass Card", blurb: "Frosted card floating over a brand gradient.",
    pro: false, background: "mesh", surface: "#0f1729", accent: "#38bdf8", text: "#ffffff",
    subtle: "rgba(255,255,255,0.78)", fontPair: "clean", align: "left",
    uppercaseLabel: true, rule: false, card: true, scrim: 0.5,
  },
  {
    key: "brutalist", label: "Bold Brutalist", blurb: "Massive type, flat colour, zero decoration.",
    pro: false, background: "solid", surface: "#111111", accent: "#f5d90a", text: "#ffffff",
    subtle: "rgba(255,255,255,0.72)", fontPair: "impact", align: "left",
    uppercaseLabel: true, rule: false, card: false, scrim: 0.6,
  },
  {
    key: "softserif", label: "Soft Serif", blurb: "Warm cream paper, quiet serif, lots of air.",
    pro: true, background: "gradient", surface: "#f4ede4", accent: "#8b5e34", text: "#211a14",
    subtle: "rgba(33,26,20,0.68)", fontPair: "editorial", align: "center",
    uppercaseLabel: true, rule: true, card: false, scrim: 0.45,
  },
  {
    key: "split", label: "Split Frame", blurb: "Framed canvas with a strong accent band.",
    pro: true, background: "frame", surface: "#101223", accent: "#7c3aed", text: "#ffffff",
    subtle: "rgba(255,255,255,0.75)", fontPair: "modern", align: "left",
    uppercaseLabel: true, rule: false, card: false, scrim: 0.58,
  },
  {
    key: "photo", label: "Photo Overlay", blurb: "Full-bleed imagery with a readable scrim.",
    pro: true, background: "duotone", surface: "#0b0b12", accent: "#ffffff", text: "#ffffff",
    subtle: "rgba(255,255,255,0.82)", fontPair: "clean", align: "left",
    uppercaseLabel: true, rule: false, card: false, scrim: 0.68,
  },
  {
    key: "datacard", label: "Data Card", blurb: "Stat-first layout for numbers and proof.",
    pro: true, background: "solid", surface: "#f5f7fb", accent: "#1d4ed8", text: "#0b1220",
    subtle: "rgba(11,18,32,0.66)", fontPair: "tech", align: "left",
    uppercaseLabel: true, rule: true, card: true, scrim: 0.5,
  },
  {
    key: "neongrid", label: "Neon Grid", blurb: "Dark grid, cyan glow, technical energy.",
    pro: true, background: "grid", surface: "#05060d", accent: "#22d3ee", text: "#eefbff",
    subtle: "rgba(238,251,255,0.75)", fontPair: "tech", align: "left",
    uppercaseLabel: true, rule: false, card: false, scrim: 0.62,
  },
];

export function templateByKey(key: string): CarouselTemplate {
  return CAROUSEL_TEMPLATES.find((t) => t.key === key) ?? CAROUSEL_TEMPLATES[0];
}

/* ---------------------------------------------------------------- palette */

export interface Palette {
  surface: string;
  accent: string;
  text: string;
  subtle: string;
}

function isLight(hex: string): boolean {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/**
 * Resolve the final palette. When `useBrand` is on, the brand primary becomes
 * the surface and text flips to keep contrast readable.
 */
export function resolvePalette(
  template: CarouselTemplate,
  opts: { useBrand: boolean; brandPrimary?: string | null; brandAccent?: string | null },
): Palette {
  if (!opts.useBrand || !opts.brandPrimary) {
    return { surface: template.surface, accent: template.accent, text: template.text, subtle: template.subtle };
  }
  const surface = opts.brandPrimary;
  const light = isLight(surface);
  const text = light ? "#101018" : "#ffffff";
  return {
    surface,
    accent: opts.brandAccent || template.accent,
    text,
    subtle: light ? "rgba(16,16,24,0.68)" : "rgba(255,255,255,0.76)",
  };
}

function mix(hex: string, amount: number, toward: "black" | "white"): string {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const target = toward === "white" ? 255 : 0;
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(c + (target - c) * amount),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** The CSS background for a slide surface (no photo). */
export function backgroundCss(template: CarouselTemplate, palette: Palette): string {
  const s = palette.surface;
  const dark = !isLight(s);
  const deep = dark ? mix(s, 0.45, "black") : mix(s, 0.12, "black");
  const lift = dark ? mix(s, 0.22, "white") : mix(s, 0.55, "white");

  switch (template.background) {
    case "solid":
      return s;
    case "gradient":
      return `linear-gradient(155deg, ${lift} 0%, ${s} 45%, ${deep} 100%)`;
    case "mesh":
      return [
        `radial-gradient(120% 90% at 12% 8%, ${withAlpha(palette.accent, 0.5)} 0%, transparent 55%)`,
        `radial-gradient(100% 80% at 92% 96%, ${withAlpha(lift, 0.55)} 0%, transparent 58%)`,
        `linear-gradient(160deg, ${deep} 0%, ${s} 100%)`,
      ].join(", ");
    case "grid":
      return [
        `linear-gradient(${withAlpha(palette.accent, 0.1)} 1px, transparent 1px)`,
        `linear-gradient(90deg, ${withAlpha(palette.accent, 0.1)} 1px, transparent 1px)`,
        `radial-gradient(90% 70% at 50% 0%, ${withAlpha(palette.accent, 0.28)} 0%, transparent 60%)`,
        `linear-gradient(180deg, ${s} 0%, ${deep} 100%)`,
      ].join(", ");
    case "frame":
      return `linear-gradient(180deg, ${deep} 0%, ${s} 100%)`;
    case "duotone":
      return `linear-gradient(160deg, ${deep} 0%, ${s} 100%)`;
    default:
      return s;
  }
}

export function backgroundSize(template: CarouselTemplate): string | undefined {
  return template.background === "grid" ? "72px 72px, 72px 72px, 100% 100%, 100% 100%" : undefined;
}

export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ------------------------------------------------------------- type scale */

export interface TypeScale {
  title: number;
  body: number;
  label: number;
  meta: number;
  bullet: number;
  titleLeading: number;
  bodyLeading: number;
}

/**
 * Deterministic auto-fit: the longer the copy, the smaller the type — so a
 * title and body can never overflow the content zone or collide with the
 * header/footer bands.
 */
export function typeScale(opts: {
  width: number;
  height: number;
  kind: string;
  titleLength: number;
  bodyLength: number;
  bulletCount: number;
}): TypeScale {
  const { width, height } = opts;
  // Base unit scales with the smaller edge so every preset feels the same.
  const unit = Math.min(width, height) / 1080;
  const isCover = opts.kind === "cover";

  let title = (isCover ? 96 : 72) * unit;
  if (opts.titleLength > 28) title *= 0.9;
  if (opts.titleLength > 44) title *= 0.86;
  if (opts.titleLength > 64) title *= 0.86;
  if (opts.titleLength > 90) title *= 0.88;
  title = Math.max(34 * unit, title);

  let body = (isCover ? 36 : 34) * unit;
  if (opts.bodyLength > 180) body *= 0.93;
  if (opts.bodyLength > 300) body *= 0.9;
  if (opts.bodyLength > 420) body *= 0.9;
  if (opts.bulletCount > 3) body *= 0.94;
  body = Math.max(19 * unit, body);

  // Wide short canvases (16:9) have far less vertical room.
  const shortCanvas = height / width < 0.75;
  if (shortCanvas) {
    title *= 0.78;
    body *= 0.86;
  }

  return {
    title,
    body,
    label: Math.max(15 * unit, 22 * unit),
    meta: Math.max(14 * unit, 20 * unit),
    bullet: body * 0.95,
    titleLeading: isCover ? 1.06 : 1.1,
    bodyLeading: 1.45,
  };
}

/** Padding / band sizing for a preset. */
export function layoutMetrics(width: number, height: number) {
  const unit = Math.min(width, height) / 1080;
  return {
    pad: Math.round(88 * unit),
    bandTop: Math.round(10 * unit),
    logo: Math.round(64 * unit),
    gap: Math.round(28 * unit),
    radius: Math.round(28 * unit),
    unit,
  };
}

/* ------------------------------------------------------------- frameworks */

export interface Framework {
  key: string;
  label: string;
  blurb: string;
}

export const FRAMEWORKS: Framework[] = [
  { key: "listicle", label: "Listicle", blurb: "N numbered lessons or tactics." },
  { key: "myth", label: "Myth vs Truth", blurb: "Bust a belief per slide." },
  { key: "before_after", label: "Before / After", blurb: "Old way vs new way." },
  { key: "steps", label: "Step-by-Step", blurb: "A repeatable process." },
  { key: "case_study", label: "Case Study", blurb: "Situation → action → result." },
  { key: "contrarian", label: "Contrarian Take", blurb: "One strong opinion, defended." },
  { key: "data_story", label: "Data Story", blurb: "Stats that build an argument." },
];

/* ----------------------------------------------------------------- slides */

export type SlideKind =
  | "cover" | "hook" | "insight" | "example" | "list" | "quote" | "stat" | "cta";

/**
 * Per-slide design overrides. Every field is optional — anything unset falls
 * back to the deck-level design, so a slide only stores what the user changed.
 */
export interface SlideOverride {
  /** Use a different template for just this slide. */
  templateKey?: string;
  /** Use a different font pairing for just this slide. */
  fontPairKey?: string;
  align?: "left" | "center";
  /** Vertical placement of the copy block inside the content zone. */
  vAlign?: "top" | "center" | "bottom";
  /** Multipliers applied on top of the auto-fit type scale (0.6 – 1.6). */
  titleScale?: number;
  bodyScale?: number;
  card?: boolean;
  rule?: boolean;
  uppercaseLabel?: boolean;
  /** Photo darkening, 0 – 0.95. */
  scrim?: number;
  /** Photo blur in export pixels. */
  imageBlur?: number;
  /** Photo zoom (1 = cover). */
  imageZoom?: number;
  accent?: string;
  surface?: string;
  textColor?: string;
  /** Hide the accent bands at the top/bottom edge. */
  hideBands?: boolean;
}

export interface Slide {
  title: string;
  body: string;
  kind: SlideKind;
  label?: string;
  bullets?: string[];
  imagePrompt?: string;
  /** Background image for this slide (AI or stock). */
  imageUrl?: string;
  /** Attribution line for stock imagery. */
  imageCredit?: string;
  /** Per-slide design overrides set from the canvas inspector. */
  override?: SlideOverride;
}

/** Merge a slide's structural overrides into the deck template. */
export function mergeTemplate(base: CarouselTemplate, ov?: SlideOverride): CarouselTemplate {
  const tpl = ov?.templateKey ? templateByKey(ov.templateKey) : base;
  if (!ov) return tpl;
  return {
    ...tpl,
    align: ov.align ?? tpl.align,
    card: ov.card ?? tpl.card,
    rule: ov.rule ?? tpl.rule,
    uppercaseLabel: ov.uppercaseLabel ?? tpl.uppercaseLabel,
    scrim: ov.scrim ?? tpl.scrim,
  };
}

/** Merge a slide's colour overrides into the resolved deck palette. */
export function mergePalette(base: Palette, ov?: SlideOverride): Palette {
  if (!ov) return base;
  const text = ov.textColor ?? base.text;
  return {
    surface: ov.surface ?? base.surface,
    accent: ov.accent ?? base.accent,
    text,
    subtle: ov.textColor ? withAlpha(ov.textColor, 0.74) : base.subtle,
  };
}

/** True when a slide carries any customisation (drives the "edited" badge). */
export function hasOverride(ov?: SlideOverride): boolean {
  return Boolean(ov && Object.values(ov).some((v) => v !== undefined));
}

export interface CarouselDesignState {
  presetKey: string;
  templateKey: string;
  fontPairKey: string;
  useBrand: boolean;
  showBrandBar: boolean;
  showCounter: boolean;
  showSwipeHint: boolean;
}

export const DEFAULT_DESIGN: CarouselDesignState = {
  presetKey: "linkedin_45",
  templateKey: "editorial",
  fontPairKey: "editorial",
  useBrand: false,
  showBrandBar: true,
  showCounter: true,
  showSwipeHint: true,
};

/** Sample copy used for template gallery thumbnails. */
export const GALLERY_SAMPLE: Slide = {
  kind: "cover",
  title: "7 Fixes That Move Pipeline",
  body: "What the top 1% of B2B founders do differently on LinkedIn.",
  label: "Playbook",
};

