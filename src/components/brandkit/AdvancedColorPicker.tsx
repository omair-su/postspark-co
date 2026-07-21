import { useState, useEffect, useRef } from "react";
import { Copy, Check, Pipette } from "lucide-react";
import { hexToRgb, rgbToHex, hexToHsl, hslToHex, normalizeHex } from "@/lib/colorUtils";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

type Tab = "hex" | "rgb" | "hsl";

/**
 * Premium color picker with Hex / RGB / HSL tabs, native color input, and copy.
 * Uses EyeDropper API when available (Chrome / Edge).
 */
export function AdvancedColorPicker({ value, onChange, label }: Props) {
  const [tab, setTab] = useState<Tab>("hex");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const rgb = hexToRgb(value);
  const hsl = hexToHsl(value);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  const useEyedropper = async () => {
    const w = window as unknown as { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } };
    if (!w.EyeDropper) {
      toast.error("Eyedropper is not supported in this browser");
      return;
    }
    try {
      const dropper = new w.EyeDropper();
      const result = await dropper.open();
      const hex = normalizeHex(result.sRGBHex);
      if (hex) onChange(hex);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {label && <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>}
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-1.5 transition hover:border-violet-500/30">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-9 w-11 rounded-lg border border-slate-700 shadow-inner"
          style={{ background: value }}
          aria-label="Open color picker"
        />
        <input
          value={value.toUpperCase()}
          onChange={(e) => {
            const norm = normalizeHex(e.target.value);
            if (norm) onChange(norm);
          }}
          maxLength={7}
          className="flex-1 bg-transparent font-mono text-xs text-slate-100 outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-violet-300"
          title="Copy hex"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
          <div className="p-3">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-24 w-full cursor-pointer rounded-lg border border-slate-800 bg-transparent"
            />
          </div>
          <div className="flex border-y border-slate-800/70 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider">
            {(["hex", "rgb", "hsl"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2 transition ${
                  tab === t ? "bg-violet-500/15 text-violet-300" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={useEyedropper}
              className="flex items-center gap-1 border-l border-slate-800 px-2.5 py-2 text-slate-500 transition hover:text-violet-300"
              title="Eyedropper"
            >
              <Pipette className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-3">
            {tab === "hex" && (
              <input
                value={value.toUpperCase()}
                onChange={(e) => {
                  const norm = normalizeHex(e.target.value);
                  if (norm) onChange(norm);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 font-mono text-sm uppercase text-slate-100 outline-none focus:border-violet-500"
              />
            )}
            {tab === "rgb" && rgb && (
              <div className="grid grid-cols-3 gap-2">
                {(["r", "g", "b"] as const).map((k) => (
                  <label key={k} className="text-[10px] font-semibold uppercase text-slate-400">
                    {k}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[k]}
                      onChange={(e) => onChange(rgbToHex({ ...rgb, [k]: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100 outline-none focus:border-violet-500"
                    />
                  </label>
                ))}
              </div>
            )}
            {tab === "hsl" && hsl && (
              <div className="grid grid-cols-3 gap-2">
                {(["h", "s", "l"] as const).map((k) => (
                  <label key={k} className="text-[10px] font-semibold uppercase text-slate-400">
                    {k}
                    <input
                      type="number"
                      min={0}
                      max={k === "h" ? 360 : 100}
                      value={hsl[k]}
                      onChange={(e) => onChange(hslToHex({ ...hsl, [k]: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100 outline-none focus:border-violet-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
