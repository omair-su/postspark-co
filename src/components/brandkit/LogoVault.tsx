import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, RefreshCw, Trash2, Loader2, ImagePlus } from "lucide-react";

export interface LogoSlots {
  primary?: string;   // canonical logo
  mark?: string;      // icon / monogram
  light?: string;     // for light backgrounds
  dark?: string;      // for dark backgrounds
}

type SlotKey = keyof LogoSlots;

const SLOTS: { key: SlotKey; label: string; hint: string }[] = [
  { key: "primary", label: "Primary logo", hint: "Full lockup used everywhere by default" },
  { key: "mark", label: "Icon / mark", hint: "Symbol-only, square-friendly" },
  { key: "light", label: "Light-background", hint: "Optimized for white / cream surfaces" },
  { key: "dark", label: "Dark-background", hint: "Optimized for navy / black surfaces" },
];

interface Props {
  userId: string;
  slots: LogoSlots;
  onChange: (next: LogoSlots) => void;
}

/**
 * 2×2 grid of logo slots. Each slot previews on both light and dark swatches
 * so users can spot invisible logos immediately.
 */
export function LogoVault({ userId, slots, onChange }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SLOTS.map((s) => (
        <LogoSlot
          key={s.key}
          slotKey={s.key}
          label={s.label}
          hint={s.hint}
          userId={userId}
          value={slots[s.key] || ""}
          onChange={(url) => onChange({ ...slots, [s.key]: url || undefined })}
        />
      ))}
    </div>
  );
}

function LogoSlot({
  slotKey,
  label,
  hint,
  userId,
  value,
  onChange,
}: {
  slotKey: SlotKey;
  label: string;
  hint: string;
  userId: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/logos/${slotKey}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success(`${label} saved`);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-xl transition hover:border-violet-500/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-100">{label}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-md p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <PreviewSwatch bg="#f8fafc" logo={value} label="Light" />
        <PreviewSwatch bg="#0b1020" logo={value} label="Dark" />
      </div>

      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 px-3 py-2 text-[11px] font-semibold text-slate-300 transition hover:border-violet-500/60 hover:text-violet-300">
        {uploading ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
        ) : value ? (
          <><RefreshCw className="h-3.5 w-3.5" /> Replace</>
        ) : (
          <><ImagePlus className="h-3.5 w-3.5" /> Upload</>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

function PreviewSwatch({ bg, logo, label }: { bg: string; logo: string; label: string }) {
  return (
    <div
      className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-slate-800/60"
      style={{ background: bg }}
    >
      {logo ? (
        <img src={logo} alt={label} className="max-h-10 max-w-full object-contain" />
      ) : (
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: bg === "#f8fafc" ? "#94a3b8" : "#475569" }}>
          {label}
        </span>
      )}
    </div>
  );
}
