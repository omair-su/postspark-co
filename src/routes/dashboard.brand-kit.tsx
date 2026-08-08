import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Palette, Type, Sparkles, ArrowLeft, ImageIcon, FileDown, Crown } from "lucide-react";
import { getBrandKit, upsertBrandKit } from "@/lib/brandKit.functions";
import { BrandProfileSwitcher } from "@/components/BrandProfileSwitcher";
import { AdvancedColorPicker } from "@/components/brandkit/AdvancedColorPicker";
import { LogoVault, type LogoSlots } from "@/components/brandkit/LogoVault";
import { PalettePresetPicker } from "@/components/brandkit/PalettePresetPicker";
import { ImagePaletteExtractor } from "@/components/brandkit/ImagePaletteExtractor";
import { TintShadeRamp } from "@/components/brandkit/TintShadeRamp";
import { SavedSwatches } from "@/components/brandkit/SavedSwatches";
import { ContrastAutoFixer } from "@/components/brandkit/ContrastAutoFixer";
import { GoogleFontSelector, FontPairingSuggestions, type CustomFontEntry } from "@/components/brandkit/GoogleFontSelector";
import { WatermarkControls, type WatermarkSettings } from "@/components/brandkit/WatermarkControls";
import { setWatermarkState } from "@/lib/imageWatermark";
import { exportBrandGuide } from "@/lib/exportBrandGuide";
import { ToolHero } from "@/components/dashboard/ToolHero";

export const Route = createFileRoute("/dashboard/brand-kit")({
  component: BrandKitPage,
});

const TONES = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "casual", label: "Casual", emoji: "😎" },
  { id: "humorous", label: "Humorous", emoji: "😂" },
  { id: "inspirational", label: "Inspirational", emoji: "✨" },
  { id: "educational", label: "Educational", emoji: "📚" },
  { id: "bold", label: "Bold", emoji: "🔥" },
];

const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: false,
  text: "",
  opacity: 90,
  placement: "bottom-right",
};

function BrandKitPage() {
  const { session, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Identity
  const [brandName, setBrandName] = useState("");
  const [brandHandle, setBrandHandle] = useState("");
  const [tagline, setTagline] = useState("");

  // Logos
  const [logos, setLogos] = useState<LogoSlots>({});

  // Colors — 5 roles
  const [primary, setPrimary] = useState("#7c3aed");
  const [secondary, setSecondary] = useState("#1a1a2e");
  const [accent, setAccent] = useState("#f59e0b");
  const [neutral, setNeutral] = useState("#e2e8f0");
  const [background, setBackground] = useState("#0b1020");
  const [savedSwatches, setSavedSwatches] = useState<string[]>([]);

  // Typography
  const [fontHeading, setFontHeading] = useState("Inter");
  const [fontBody, setFontBody] = useState("Inter");
  const [customFonts, setCustomFonts] = useState<CustomFontEntry[]>([]);

  // Tone
  const [tone, setTone] = useState("professional");

  // Watermark
  const [watermark, setWatermark] = useState<WatermarkSettings>(DEFAULT_WATERMARK);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getBrandKit({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(({ kit }) => {
        if (kit) {
          const k = kit as any;
          setBrandName(k.brand_name || "");
          setBrandHandle(k.brand_handle || "");
          setTagline(k.tagline || "");
          setLogos({
            primary: k.logo_url || k.logo_variants?.primary || undefined,
            mark: k.logo_variants?.mark || undefined,
            light: k.logo_variants?.light || undefined,
            dark: k.logo_variants?.dark || undefined,
          });
          setPrimary(k.primary_color || "#7c3aed");
          setSecondary(k.secondary_color || "#1a1a2e");
          setAccent(k.accent_color || "#f59e0b");
          setNeutral(k.neutral_color || "#e2e8f0");
          setBackground(k.background_color || "#0b1020");
          setSavedSwatches(Array.isArray(k.saved_swatches) ? k.saved_swatches : []);
          setFontHeading(k.font_heading || "Inter");
          setFontBody(k.font_body || "Inter");
          setCustomFonts(Array.isArray(k.custom_fonts) ? k.custom_fonts : []);
          setTone(k.preferred_tone || "professional");
          const wm = { ...DEFAULT_WATERMARK, ...(k.watermark_settings || {}) };
          setWatermark(wm);
          // Only mirror into localStorage if this kit actually has saved watermark_settings.
          // Otherwise we'd clobber preferences the user set directly in Image Studio / Thumbnail / Carousel.
          if (k.watermark_settings) {
            setWatermarkState(wm.enabled, wm.text || k.brand_handle || "@yourbrand", wm.opacity, wm.placement);
          }
        } else {
          // reset to defaults for a fresh profile
          setBrandName(""); setBrandHandle(""); setTagline("");
          setLogos({});
          setPrimary("#7c3aed"); setSecondary("#1a1a2e"); setAccent("#f59e0b");
          setNeutral("#e2e8f0"); setBackground("#0b1020");
          setSavedSwatches([]);
          setFontHeading("Inter"); setFontBody("Inter"); setCustomFonts([]);
          setTone("professional");
          setWatermark(DEFAULT_WATERMARK);
        }
      })
      .finally(() => setLoading(false));
  }, [session, reloadKey]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    const res = await upsertBrandKit({
      data: {
        brand_name: brandName || null,
        brand_handle: brandHandle || null,
        tagline: tagline || null,
        logo_url: logos.primary || null,
        logo_variants: {
          ...(logos.primary ? { primary: logos.primary } : {}),
          ...(logos.mark ? { mark: logos.mark } : {}),
          ...(logos.light ? { light: logos.light } : {}),
          ...(logos.dark ? { dark: logos.dark } : {}),
        },
        primary_color: primary,
        secondary_color: secondary,
        accent_color: accent,
        neutral_color: neutral,
        background_color: background,
        saved_swatches: savedSwatches,
        font_heading: fontHeading,
        font_body: fontBody,
        custom_fonts: customFonts,
        preferred_tone: tone,
        watermark_settings: watermark as any,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setSaving(false);
    if (res.success) {
      // Mirror watermark into localStorage so Image Studio / Thumbnail / Carousel pick it up.
      setWatermarkState(
        watermark.enabled,
        watermark.text || brandHandle || "@yourbrand",
        watermark.opacity,
        watermark.placement,
      );
      toast.success("Brand Kit saved");
    } else toast.error(res.error || "Save failed");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBrandGuide({
        brandName: brandName || "Untitled Brand",
        handle: brandHandle || undefined,
        tagline: tagline || undefined,
        primary, secondary, accent, neutral, background,
        savedSwatches,
        fontHeading, fontBody,
        tone,
        logos,
      }, `${(brandName || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brand-guide`);
      toast.success("Brand guide downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not export brand guide");
    } finally {
      setExporting(false);
    }
  };

  const addToSwatches = (hexes: string[]) => {
    setSavedSwatches((prev) => {
      const next = [...prev];
      for (const h of hexes) if (!next.includes(h)) next.push(h);
      return next;
    });
    toast.success(`Added ${hexes.length} to swatches`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="h-7 w-40 animate-pulse rounded pw-skeleton" />
        <div className="mt-6 h-96 animate-pulse rounded-xl pw-skeleton" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-4 pb-16">
      <Link
        to="/dashboard/settings"
        className="inline-flex items-center gap-1 text-xs pw-muted-text hover:pw-ink"
      >
        <ArrowLeft className="h-3 w-3" /> Back to settings
      </Link>

      {/* Header */}
      <ToolHero
        eyebrow="Pro · Brand Kit"
        icon={<Crown className="h-3 w-3" />}
        title="Brand Kit"
        subtitle="Logo, palette, typography, watermark — auto-applied to every generation."
        art="upgrade"
        actions={<BrandProfileSwitcher onActiveChange={() => setReloadKey((k) => k + 1)} />}
      />


      {/* Identity */}
      <section className="rounded-2xl border pw-hairline bg-[color:var(--pw-surface)] p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold pw-ink">Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Brand name" value={brandName} onChange={setBrandName} placeholder="Acme Co." />
          <Field label="Handle" value={brandHandle} onChange={setBrandHandle} placeholder="@acme" />
          <div className="sm:col-span-2">
            <Field label="Tagline" value={tagline} onChange={setTagline} placeholder="Build faster, ship smarter." />
          </div>
        </div>
      </section>

      {/* Logo Vault */}
      <section className="rounded-2xl border pw-hairline bg-[color:var(--pw-surface)] p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold pw-ink">
              <ImageIcon className="h-4 w-4 text-violet-400" /> Logo vault
            </h2>
            <p className="mt-1 text-xs pw-muted-text">
              Four slots — primary lockup, icon, and background-optimized variants. Previewed on both light and dark.
            </p>
          </div>
        </div>
        {user && <LogoVault userId={user.id} slots={logos} onChange={setLogos} />}
      </section>

      {/* Color system */}
      <section className="rounded-2xl border pw-hairline bg-[color:var(--pw-surface)] p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold pw-ink">
            <Palette className="h-4 w-4 text-violet-400" /> Color system
          </h2>
          <p className="mt-1 text-xs pw-muted-text">
            Five brand roles + tint ramps + saved swatches. Extract palettes from any image.
          </p>
        </div>

        <PalettePresetPicker
          onApply={(colors) => {
            setPrimary(colors.primary);
            setSecondary(colors.secondary);
            setAccent(colors.accent);
            setNeutral(colors.neutral);
            setBackground(colors.background);
            toast.success("Palette applied");
          }}
        />

        <div className="mt-5 grid gap-5 lg:grid-cols-5">
          <ColorSlot label="Primary" value={primary} onChange={setPrimary} />
          <ColorSlot label="Secondary" value={secondary} onChange={setSecondary} />
          <ColorSlot label="Accent" value={accent} onChange={setAccent} />
          <ColorSlot label="Neutral" value={neutral} onChange={setNeutral} />
          <ColorSlot label="Background" value={background} onChange={setBackground} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl pw-hairline border bg-[color:var(--pw-section)] p-4">
            <div className="space-y-3">
              <TintShadeRamp color={primary} label="Primary" />
              <TintShadeRamp color={secondary} label="Secondary" />
              <TintShadeRamp color={accent} label="Accent" />
            </div>
          </div>
          <ImagePaletteExtractor onExtracted={addToSwatches} />
        </div>

        <div className="mt-5">
          <SavedSwatches
            swatches={savedSwatches}
            onChange={setSavedSwatches}
            onPick={(hex) => { setAccent(hex); toast.success("Applied to accent"); }}
          />
        </div>
      </section>

      {/* Contrast auto-fixer */}
      <ContrastAutoFixer
        pairs={[
          { label: "White text on Primary",     fg: "#ffffff", bg: primary,    adjust: "bg", onApply: (h) => setPrimary(h),  fontHeading, fontBody },
          { label: "White text on Secondary",   fg: "#ffffff", bg: secondary,  adjust: "bg", onApply: (h) => setSecondary(h),fontHeading, fontBody },
          { label: "Accent on Secondary",       fg: accent,    bg: secondary,  adjust: "fg", onApply: (h) => setAccent(h),   fontHeading, fontBody },
          { label: "Primary on Background",     fg: primary,   bg: background, adjust: "fg", onApply: (h) => setPrimary(h),  fontHeading, fontBody },
        ]}
      />

      {/* Typography */}
      <section className="rounded-2xl border pw-hairline bg-[color:var(--pw-surface)] p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-sm font-semibold pw-ink">
          <Type className="h-4 w-4 text-violet-400" /> Typography
        </h2>
        <p className="mt-1 text-xs pw-muted-text">
          Full Google Fonts library + custom font upload. Suggested body pairings for every heading choice.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <GoogleFontSelector
              label="Heading font"
              value={fontHeading}
              onChange={setFontHeading}
              customFonts={customFonts}
              onCustomFontUpload={(f) => setCustomFonts((prev) => [...prev.filter((x) => x.family !== f.family), f])}
              userId={user?.id}
              previewText={brandName || "Your headline goes here"}
            />
            <FontPairingSuggestions heading={fontHeading} onPick={setFontBody} />
          </div>
          <GoogleFontSelector
            label="Body font"
            value={fontBody}
            onChange={setFontBody}
            customFonts={customFonts}
            onCustomFontUpload={(f) => setCustomFonts((prev) => [...prev.filter((x) => x.family !== f.family), f])}
            userId={user?.id}
            previewText={tagline || "Body copy reads like this at real reading size."}
          />
        </div>
      </section>

      {/* Watermark */}
      <WatermarkControls value={watermark} onChange={setWatermark} brandHandle={brandHandle} />

      {/* Tone */}
      <section className="rounded-2xl border pw-hairline bg-[color:var(--pw-surface)] p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-sm font-semibold pw-ink">
          <Sparkles className="h-4 w-4 text-violet-400" /> Preferred tone
        </h2>
        <p className="mt-1 text-xs pw-muted-text">
          Auto-applied to every Repurpose, Hook Lab, and SEO Blog generation.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                tone === t.id
                  ? "border-violet-500/60 bg-violet-500/10 pw-ink"
                  : "pw-hairline pw-muted-text hover:border-violet-500/40"
              }`}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section className="rounded-2xl border pw-hairline bg-[color:var(--pw-surface)] p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold pw-ink">Live preview</h2>
        <div
          className="mt-4 rounded-xl p-6"
          style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
        >
          <div className="flex items-center gap-3">
            {(logos.primary || logos.mark) && (
              <img
                src={logos.primary || logos.mark}
                alt=""
                className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1"
              />
            )}
            <div>
              <p className="text-lg font-bold text-white" style={{ fontFamily: fontHeading }}>
                {brandName || "Your Brand"}
              </p>
              <p className="text-xs text-white/70" style={{ fontFamily: fontBody }}>
                {tagline || "Your tagline goes here"}
              </p>
            </div>
          </div>
          <div
            className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ background: accent }}
          >
            Sample badge
          </div>
        </div>
      </section>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-30 flex flex-wrap justify-end gap-2 rounded-2xl pw-hairline border bg-[color:var(--pw-surface)] p-2 backdrop-blur-xl">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg pw-hairline border bg-[color:var(--pw-surface)] px-4 py-2 text-sm font-semibold pw-ink transition hover:border-violet-500/60 hover:opacity-90 disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Export brand guide (PDF)
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/50 transition hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Brand Kit
        </button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider pw-muted-text">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg pw-hairline border bg-[color:var(--pw-surface)] px-3 py-2 text-sm pw-ink outline-none placeholder:opacity-60 focus:border-violet-500"
      />
    </label>
  );
}

function ColorSlot({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <AdvancedColorPicker label={label} value={value} onChange={onChange} />
    </div>
  );
}
