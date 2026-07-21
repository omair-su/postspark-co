import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Type, Check, ChevronDown, Upload, Loader2 } from "lucide-react";
import { GOOGLE_FONTS, loadGoogleFont, type FontCategory, type GoogleFont, registerCustomFont, detectFontFormat } from "@/lib/googleFonts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomFontEntry { family: string; url: string; format?: string }

interface Props {
  label: string;
  value: string;
  onChange: (family: string) => void;
  customFonts: CustomFontEntry[];
  onCustomFontUpload?: (font: CustomFontEntry) => void;
  userId?: string;
  previewText?: string;
}

const CATEGORIES: { id: FontCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sans-serif", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "monospace", label: "Mono" },
];

export function GoogleFontSelector({
  label,
  value,
  onChange,
  customFonts,
  onCustomFontUpload,
  userId,
  previewText = "The quick brown fox jumps over the lazy dog",
}: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load the current font
  useEffect(() => {
    const gf = GOOGLE_FONTS.find((f) => f.family === value);
    if (gf) loadGoogleFont(gf.family, gf.weights);
    const custom = customFonts.find((f) => f.family === value);
    if (custom) registerCustomFont(custom.family, custom.url, custom.format);
  }, [value, customFonts]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GOOGLE_FONTS.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (q && !f.family.toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 60);
  }, [category, search]);

  // Preload visible list so users can preview in real fonts
  useEffect(() => {
    if (!open) return;
    filtered.forEach((f) => loadGoogleFont(f.family, f.weights));
  }, [open, filtered]);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const ok = /\.(ttf|otf|woff2?|woff)$/i.test(file.name);
    if (!ok) { toast.error("Upload a TTF, OTF, or WOFF font"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Font must be under 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "woff2";
    const family = file.name.replace(/\.(ttf|otf|woff2?|woff)$/i, "").replace(/[^a-zA-Z0-9 -]/g, "").trim() || "Custom Font";
    const path = `${userId}/fonts/${Date.now()}-${family}.${ext}`;
    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, contentType: file.type || "font/woff2" });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    const format = detectFontFormat(file.name);
    const entry: CustomFontEntry = { family, url: data.publicUrl, format };
    registerCustomFont(entry.family, entry.url, entry.format);
    onCustomFontUpload?.(entry);
    onChange(entry.family);
    setUploading(false);
    toast.success(`"${family}" uploaded`);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2.5 text-left backdrop-blur-xl transition hover:border-violet-500/40"
      >
        <span className="truncate text-sm text-slate-100" style={{ fontFamily: value }}>
          {value}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <p className="mt-2 truncate text-lg text-slate-300" style={{ fontFamily: value }} title={previewText}>
        {previewText}
      </p>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
          <div className="border-b border-slate-800/70 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Google Fonts…"
                className="flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-600"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                    category === c.id
                      ? "bg-violet-500/20 text-violet-200"
                      : "bg-slate-900 text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {customFonts.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-wider text-violet-400">
                  Custom fonts
                </p>
                {customFonts.map((f) => (
                  <FontRow
                    key={"c:" + f.family}
                    family={f.family}
                    subtitle="Custom"
                    active={value === f.family}
                    onPick={() => { onChange(f.family); setOpen(false); }}
                  />
                ))}
                <div className="mx-3 my-1 h-px bg-slate-800/70" />
              </>
            )}
            {filtered.map((f) => (
              <FontRow
                key={f.family}
                family={f.family}
                subtitle={f.category}
                active={value === f.family}
                onPick={() => { loadGoogleFont(f.family, f.weights); onChange(f.family); setOpen(false); }}
              />
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-500">
                No matches. Try another category or upload a custom font below.
              </p>
            )}
          </div>

          {onCustomFontUpload && userId && (
            <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] font-semibold text-violet-300 hover:bg-slate-900">
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Upload custom font (TTF · OTF · WOFF)</>
              )}
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                className="hidden"
                onChange={handleCustomUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function FontRow({
  family, subtitle, active, onPick,
}: { family: string; subtitle: string; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ${
        active ? "bg-violet-500/10" : "hover:bg-slate-800/60"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-slate-100" style={{ fontFamily: family }}>
          {family}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-500">{subtitle}</span>
      </span>
      <span className="hidden text-lg text-slate-300 sm:block" style={{ fontFamily: family }}>Aa</span>
      {active && <Check className="h-3.5 w-3.5 text-violet-400" />}
    </button>
  );
}

export function FontPairingSuggestions({
  heading,
  onPick,
}: { heading: string; onPick: (family: string) => void }) {
  const pairings = require("@/lib/googleFonts").FONT_PAIRINGS as Record<string, string[]>;
  const suggestions = pairings[heading] || ["Inter", "DM Sans", "Manrope"];

  useEffect(() => {
    suggestions.forEach((s: string) => {
      const gf = GOOGLE_FONTS.find((f) => f.family === s);
      if (gf) loadGoogleFont(gf.family, gf.weights);
    });
  }, [suggestions]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Type className="h-3 w-3" /> Suggested body pairings:
      </span>
      {suggestions.map((s: string) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-violet-500/40 hover:text-white"
          style={{ fontFamily: s }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
