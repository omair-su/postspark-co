import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Palette, Type, Sparkles, ArrowLeft, Trash2, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { getBrandKit, upsertBrandKit, deleteBrandLogo } from "@/server/brandKit.functions";
import { gradeContrast } from "@/lib/contrast";

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

const FONT_OPTIONS = ["Inter", "Poppins", "Playfair Display", "Montserrat", "Roboto", "Lora"];

function BrandKitPage() {
  const { session, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [brandName, setBrandName] = useState("");
  const [brandHandle, setBrandHandle] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primary, setPrimary] = useState("#7c3aed");
  const [secondary, setSecondary] = useState("#1a1a2e");
  const [accent, setAccent] = useState("#f59e0b");
  const [fontHeading, setFontHeading] = useState("Inter");
  const [fontBody, setFontBody] = useState("Inter");
  const [tone, setTone] = useState("professional");

  useEffect(() => {
    if (!session) return;
    getBrandKit({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(({ kit }) => {
        if (kit) {
          setBrandName(kit.brand_name || "");
          setBrandHandle(kit.brand_handle || "");
          setTagline(kit.tagline || "");
          setLogoUrl(kit.logo_url || "");
          setPrimary(kit.primary_color || "#7c3aed");
          setSecondary(kit.secondary_color || "#1a1a2e");
          setAccent(kit.accent_color || "#f59e0b");
          setFontHeading(kit.font_heading || "Inter");
          setFontBody(kit.font_body || "Inter");
          setTone((kit as any).preferred_tone || "professional");
        }
      })
      .finally(() => setLoading(false));
  }, [session]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded");
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    const res = await upsertBrandKit({
      data: {
        brand_name: brandName || null,
        brand_handle: brandHandle || null,
        tagline: tagline || null,
        logo_url: logoUrl || null,
        primary_color: primary,
        secondary_color: secondary,
        accent_color: accent,
        font_heading: fontHeading,
        font_body: fontBody,
        preferred_tone: tone,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setSaving(false);
    if (res.success) toast.success("Brand Kit saved!");
    else toast.error(res.error || "Save failed");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-7 w-40 animate-pulse rounded bg-accent" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link
        to="/dashboard/settings"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to settings
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Kit</h1>
          <p className="text-sm text-muted-foreground">
            Your logo, colors, fonts, and tone — auto-applied to every generation.
          </p>
        </div>
      </div>

      {/* Identity */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Brand name</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme Co."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Handle</label>
            <input
              value={brandHandle}
              onChange={(e) => setBrandHandle(e.target.value)}
              placeholder="@acme"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Build faster, ship smarter."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4 text-primary" /> Logo
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-xl border border-border"
            style={{ background: secondary }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-16 max-w-16 object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <div>
            <label className="cursor-pointer rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent">
              {uploading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                </span>
              ) : (
                "Upload logo"
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="mt-1 text-[10px] text-muted-foreground">PNG/SVG/JPG, max 2MB</p>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="h-4 w-4 text-primary" /> Brand colors
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ColorField label="Primary" value={primary} onChange={setPrimary} />
          <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
          <ColorField label="Accent" value={accent} onChange={setAccent} />
        </div>
      </section>

      {/* Fonts */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Type className="h-4 w-4 text-primary" /> Typography
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FontField label="Heading font" value={fontHeading} onChange={setFontHeading} />
          <FontField label="Body font" value={fontBody} onChange={setFontBody} />
        </div>
      </section>

      {/* Tone */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Preferred tone
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Auto-applied to every Repurpose, Hook Lab, and SEO Blog generation.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                tone === t.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Live preview</h2>
        <div
          className="mt-4 rounded-xl p-6"
          style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
        >
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1" />}
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

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Brand Kit
        </button>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border"
        />
        <input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="flex-1 bg-transparent text-xs uppercase outline-none"
        />
      </div>
    </div>
  );
}

function FontField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs" style={{ fontFamily: value }}>
        The quick brown fox jumps.
      </p>
    </div>
  );
}
