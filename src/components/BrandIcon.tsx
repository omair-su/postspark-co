/**
 * BrandIcon — single source of truth for real platform / brand icons.
 *
 * Uses Simple Icons (react-icons/si) for accurate brand marks with
 * brand-official colors, and lucide-react for domain-generic icons
 * (email, seo, video, podcast, carousel) rendered inside a premium
 * gradient tile that matches the app's dark theme.
 */
import type { ComponentType } from "react";
import {
  SiX,
  SiInstagram,
  SiFacebook,
  SiTiktok,
  SiThreads,
  SiYoutube,
  SiGoogle,
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { Mail, Clapperboard, Mic, Images, FileText, Camera, Box, Palette, Square, Zap, Brush, Sparkles, Building2 } from "lucide-react";

export type BrandKey =
  | "twitter" | "tweets" | "thread" | "x"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "threads"
  | "youtube"
  | "google" | "seo"
  | "email"
  | "video"
  | "podcast"
  | "carousel"
  | "blog";

interface Def {
  Icon: ComponentType<any>;
  color: string;   // solid brand color
  tile: string;   // tailwind gradient bg for tile wrapper
  ring: string;   // hover/selected accent
  isSimple?: boolean;
}

const MAP: Record<BrandKey, Def> = {
  twitter:   { Icon: SiX, color: "#ffffff", tile: "bg-gradient-to-br from-slate-900 to-slate-700", ring: "ring-white/40", isSimple: true },
  tweets:    { Icon: SiX, color: "#ffffff", tile: "bg-gradient-to-br from-slate-900 to-slate-700", ring: "ring-white/40", isSimple: true },
  thread:    { Icon: SiX, color: "#ffffff", tile: "bg-gradient-to-br from-slate-900 to-slate-700", ring: "ring-white/40", isSimple: true },
  x:         { Icon: SiX, color: "#ffffff", tile: "bg-gradient-to-br from-slate-900 to-slate-700", ring: "ring-white/40", isSimple: true },
  linkedin:  { Icon: FaLinkedin, color: "#ffffff", tile: "bg-gradient-to-br from-[#0A66C2] to-[#004182]", ring: "ring-[#0A66C2]/50", isSimple: true },
  instagram: { Icon: SiInstagram, color: "#ffffff", tile: "bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]", ring: "ring-pink-500/50", isSimple: true },
  facebook:  { Icon: SiFacebook, color: "#ffffff", tile: "bg-gradient-to-br from-[#1877F2] to-[#0b5fd6]", ring: "ring-[#1877F2]/50", isSimple: true },
  tiktok:    { Icon: SiTiktok, color: "#ffffff", tile: "bg-gradient-to-br from-black via-[#25F4EE]/20 to-[#FE2C55]/60", ring: "ring-[#FE2C55]/60", isSimple: true },
  threads:   { Icon: SiThreads, color: "#ffffff", tile: "bg-gradient-to-br from-neutral-900 to-neutral-700", ring: "ring-white/40", isSimple: true },
  youtube:   { Icon: SiYoutube, color: "#ffffff", tile: "bg-gradient-to-br from-[#FF0000] to-[#b30000]", ring: "ring-[#FF0000]/50", isSimple: true },
  google:    { Icon: SiGoogle, color: "#ffffff", tile: "bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#FBBC05]", ring: "ring-[#4285F4]/50", isSimple: true },
  seo:       { Icon: SiGoogle, color: "#ffffff", tile: "bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05]", ring: "ring-[#4285F4]/50", isSimple: true },
  email:     { Icon: Mail, color: "#ffffff", tile: "bg-gradient-to-br from-amber-400 to-rose-500", ring: "ring-amber-400/50" },
  video:     { Icon: Clapperboard, color: "#ffffff", tile: "bg-gradient-to-br from-violet-500 to-fuchsia-600", ring: "ring-violet-500/50" },
  podcast:   { Icon: Mic, color: "#ffffff", tile: "bg-gradient-to-br from-purple-500 to-indigo-600", ring: "ring-purple-500/50" },
  carousel:  { Icon: Images, color: "#ffffff", tile: "bg-gradient-to-br from-cyan-500 to-blue-600", ring: "ring-cyan-500/50" },
  blog:      { Icon: FileText, color: "#ffffff", tile: "bg-gradient-to-br from-emerald-500 to-teal-600", ring: "ring-emerald-500/50" },
};

interface BrandIconProps {
  brand: BrandKey;
  size?: number;   // tile size
  tile?: boolean;  // render inside colored tile (default true)
  className?: string;
}

export function BrandIcon({ brand, size = 36, tile = true, className = "" }: BrandIconProps) {
  const def = MAP[brand] || MAP.blog;
  const { Icon } = def;
  const iconSize = Math.round(size * 0.55);

  if (!tile) {
    return <Icon className={className} size={iconSize} />;
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl shadow-lg shadow-black/20 ${def.tile} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={iconSize} className="text-white" />
    </div>
  );
}

/** Small helper for inline chip usage (no tile, brand color). */
export function BrandGlyph({ brand, size = 16, className = "" }: { brand: BrandKey; size?: number; className?: string }) {
  const def = MAP[brand] || MAP.blog;
  const { Icon } = def;
  const color = def.color === "#ffffff" ? "currentColor" : def.color;
  return <Icon size={size} className={className} color={color as any} />;
}

// Style icon set for Image Studio.
export const STYLE_ICONS = {
  photorealistic: { Icon: Camera, tile: "bg-gradient-to-br from-amber-500 to-orange-600" },
  "3d-render":    { Icon: Box, tile: "bg-gradient-to-br from-cyan-500 to-sky-600" },
  illustration:   { Icon: Palette, tile: "bg-gradient-to-br from-pink-500 to-rose-600" },
  minimal:        { Icon: Square, tile: "bg-gradient-to-br from-slate-500 to-slate-700" },
  cinematic:      { Icon: Clapperboard, tile: "bg-gradient-to-br from-violet-500 to-fuchsia-600" },
  cyberpunk:      { Icon: Zap, tile: "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500" },
  "oil-painting": { Icon: Brush, tile: "bg-gradient-to-br from-amber-600 to-rose-700" },
  anime:          { Icon: Sparkles, tile: "bg-gradient-to-br from-pink-400 to-purple-500" },
  architectural:  { Icon: Building2, tile: "bg-gradient-to-br from-slate-500 to-blue-700" },
} as const;

export function StyleIcon({ styleId, size = 36 }: { styleId: keyof typeof STYLE_ICONS; size?: number }) {
  const def = STYLE_ICONS[styleId] || STYLE_ICONS.photorealistic;
  const { Icon } = def;
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl shadow-lg shadow-black/20 ${def.tile}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.55)} className="text-white" />
    </div>
  );
}
