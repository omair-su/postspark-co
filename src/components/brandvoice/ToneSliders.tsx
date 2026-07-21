import { Gauge } from "lucide-react";

export interface ToneSliderValues {
  formality: number;
  humor: number;
  enthusiasm: number;
  complexity: number;
}

export const DEFAULT_TONE_SLIDERS: ToneSliderValues = {
  formality: 50,
  humor: 30,
  enthusiasm: 60,
  complexity: 40,
};

const AXES: { key: keyof ToneSliderValues; label: string; low: string; high: string }[] = [
  { key: "formality", label: "Formality", low: "Casual", high: "Formal" },
  { key: "humor", label: "Humor", low: "Serious", high: "Playful" },
  { key: "enthusiasm", label: "Enthusiasm", low: "Reserved", high: "High-energy" },
  { key: "complexity", label: "Complexity", low: "Simple", high: "Nuanced" },
];

interface Props {
  value: ToneSliderValues;
  onChange: (next: ToneSliderValues) => void;
  disabled?: boolean;
}

export function ToneSliders({ value, onChange, disabled }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dimensional tone</h3>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Live</span>
      </div>
      <div className="space-y-5">
        {AXES.map((ax) => {
          const v = value[ax.key];
          return (
            <div key={ax.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{ax.label}</span>
                <span className="font-mono text-violet-300">{v}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={v}
                disabled={disabled}
                onChange={(e) => onChange({ ...value, [ax.key]: Number(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-500">
                <span>{ax.low}</span>
                <span>{ax.high}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
