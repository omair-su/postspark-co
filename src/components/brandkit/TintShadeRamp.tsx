import { useState } from "react";
import { generateRamp } from "@/lib/colorUtils";
import { Copy, Check, Layers } from "lucide-react";
import { toast } from "sonner";

interface Props {
  color: string;
  label: string;
}

/**
 * 11-stop tint/shade ramp: 5 lighter, base, 5 darker.
 * Click a stop to copy its hex.
 */
export function TintShadeRamp({ color, label }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const ramp = generateRamp(color);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Layers className="h-3 w-3 text-slate-500" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label} · tint & shade ramp
        </p>
      </div>
      <div className="flex overflow-hidden rounded-lg border border-slate-800/60">
        {ramp.map((hex, i) => {
          const isBase = i === 5;
          return (
            <button
              key={i + hex}
              type="button"
              onClick={() => copy(hex)}
              title={hex}
              className={`group relative flex h-10 flex-1 items-end justify-center pb-1 transition hover:scale-105 hover:shadow-lg ${
                isBase ? "ring-2 ring-inset ring-violet-400/60" : ""
              }`}
              style={{ background: hex }}
            >
              {copied === hex ? (
                <Check className="h-3 w-3 text-white drop-shadow" />
              ) : (
                <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-70" style={{ color: i < 5 ? "#0f172a" : "#f8fafc" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
