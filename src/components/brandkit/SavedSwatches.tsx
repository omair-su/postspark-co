import { useState } from "react";
import { Bookmark, Copy, X, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { normalizeHex } from "@/lib/colorUtils";

interface Props {
  swatches: string[];
  onChange: (next: string[]) => void;
  onPick?: (hex: string) => void;
}

/**
 * Personal swatch bank. Users can save, copy, and reuse hex codes across kits.
 */
export function SavedSwatches({ swatches, onChange, onPick }: Props) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const add = (hex: string) => {
    const norm = normalizeHex(hex);
    if (!norm) return toast.error("Enter a valid hex (e.g. #7c3aed)");
    if (swatches.includes(norm)) return toast.info("Already saved");
    onChange([...swatches, norm]);
    setInput("");
  };

  const remove = (hex: string) => onChange(swatches.filter((s) => s !== hex));

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1200);
    } catch { toast.error("Could not copy"); }
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <Bookmark className="h-3.5 w-3.5 text-violet-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          My swatches ({swatches.length})
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {swatches.map((hex) => (
          <div
            key={hex}
            className="group relative flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/60 py-1 pl-1 pr-2 transition hover:border-violet-500/50"
          >
            <button
              type="button"
              onClick={() => onPick?.(hex)}
              className="h-5 w-5 rounded-full border border-slate-800"
              style={{ background: hex }}
              title={onPick ? "Apply" : hex}
            />
            <button
              type="button"
              onClick={() => copy(hex)}
              className="font-mono text-[10px] uppercase text-slate-300 hover:text-white"
            >
              {copied === hex ? <Check className="h-3 w-3 text-emerald-400" /> : hex}
            </button>
            <button
              type="button"
              onClick={() => remove(hex)}
              className="rounded-full p-0.5 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {swatches.length === 0 && (
          <p className="text-[11px] italic text-slate-500">
            Nothing saved yet. Add a hex or drop an image above.
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add(input)}
          placeholder="#7c3aed"
          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-xs uppercase text-slate-100 outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-100 transition hover:bg-violet-600"
        >
          <Plus className="h-3 w-3" /> Save
        </button>
      </div>
    </div>
  );
}
