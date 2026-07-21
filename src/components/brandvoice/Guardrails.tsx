import { useState, KeyboardEvent } from "react";
import { Plus, X, Shield, Smile, AlignLeft, MousePointerClick } from "lucide-react";

export interface GuardrailValues {
  dos: string[];
  donts: string[];
  emoji_density: "none" | "minimal" | "heavy";
  sentence_length: "short" | "balanced" | "long";
  cta_style: "soft" | "direct";
}

export const DEFAULT_GUARDRAILS: GuardrailValues = {
  dos: [],
  donts: [],
  emoji_density: "minimal",
  sentence_length: "balanced",
  cta_style: "soft",
};

function ChipInput({
  label,
  color,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  color: "green" | "red";
  values: string[];
  onChange: (n: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v) || values.length >= 30) return;
    onChange([...values, v]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
  };
  const chipCls = color === "green"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : "border-red-500/30 bg-red-500/10 text-red-200";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="text-[10px] text-slate-500">{values.length}/30</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${chipCls}`}>
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="opacity-70 hover:opacity-100"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-slate-800 bg-slate-900 px-2 text-slate-300 hover:border-violet-500/40 hover:text-white"
          aria-label="Add"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-200">
        {icon} {label}
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
              value === o.value
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  value: GuardrailValues;
  onChange: (n: GuardrailValues) => void;
}

export function Guardrails({ value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Vocabulary guardrails</h3>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <ChipInput
          label="Always use (Do's)"
          color="green"
          values={value.dos}
          onChange={(dos) => onChange({ ...value, dos })}
          placeholder="e.g. shipped, momentum"
        />
        <ChipInput
          label="Never use (Don'ts)"
          color="red"
          values={value.donts}
          onChange={(donts) => onChange({ ...value, donts })}
          placeholder="e.g. leverage, synergy"
        />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Segmented
          label="Emojis"
          icon={<Smile className="h-3.5 w-3.5 text-violet-400" />}
          value={value.emoji_density}
          onChange={(emoji_density) => onChange({ ...value, emoji_density })}
          options={[
            { value: "none", label: "None" },
            { value: "minimal", label: "Minimal" },
            { value: "heavy", label: "Heavy" },
          ]}
        />
        <Segmented
          label="Sentences"
          icon={<AlignLeft className="h-3.5 w-3.5 text-violet-400" />}
          value={value.sentence_length}
          onChange={(sentence_length) => onChange({ ...value, sentence_length })}
          options={[
            { value: "short", label: "Short" },
            { value: "balanced", label: "Balanced" },
            { value: "long", label: "Long" },
          ]}
        />
        <Segmented
          label="CTA style"
          icon={<MousePointerClick className="h-3.5 w-3.5 text-violet-400" />}
          value={value.cta_style}
          onChange={(cta_style) => onChange({ ...value, cta_style })}
          options={[
            { value: "soft", label: "Soft" },
            { value: "direct", label: "Direct" },
          ]}
        />
      </div>
    </div>
  );
}
