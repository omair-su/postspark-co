import { PALETTE_PRESETS, type PalettePreset } from "@/lib/palettePresets";
import { Sparkles } from "lucide-react";

interface Props {
  onApply: (colors: PalettePreset["colors"]) => void;
}

export function PalettePresetPicker({ onApply }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Trend palette presets
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PALETTE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onApply(p.colors)}
            className="group rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-left backdrop-blur-xl transition hover:border-violet-500/40 hover:bg-slate-900/80"
          >
            <div className="flex h-10 overflow-hidden rounded-lg border border-slate-800/60">
              {Object.values(p.colors).map((c, i) => (
                <div key={i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-100">{p.label}</p>
            <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{p.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
