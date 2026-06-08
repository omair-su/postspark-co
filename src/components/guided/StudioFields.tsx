import { type ReactNode } from "react";

export function StudioField({
  label, required, optional, help, children, hint,
}: { label: string; required?: boolean; optional?: boolean; help?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-foreground">{label}</span>
        {required && <span className="text-[10px] font-medium text-destructive">*</span>}
        {optional && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">optional</span>}
      </div>
      {help && <p className="mb-2 text-[11px] text-muted-foreground">{help}</p>}
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

export function StudioInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:italic placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 ${props.className || ""}`} />;
}

export function StudioTextarea({ maxChars, value, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxChars?: number; value?: string }) {
  return (
    <div>
      <textarea {...props} value={value} className={`w-full resize-y rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:italic placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 ${props.className || ""}`} />
      {maxChars && (
        <p className={`mt-1 text-right text-[11px] ${((value?.length || 0) > maxChars) ? "text-destructive" : "text-muted-foreground"}`}>
          {value?.length || 0} / {maxChars}
        </p>
      )}
    </div>
  );
}

export function ChipGroup<T extends string>({
  options, value, onChange, multi = false,
}: {
  options: { value: T; label: string; emoji?: string; desc?: string }[];
  value: T | T[];
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const isSelected = (v: T) => multi ? (value as T[]).includes(v) : value === v;
  const toggle = (v: T) => {
    if (multi) {
      const arr = value as T[];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else onChange(v);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const sel = isSelected(opt.value);
        return (
          <button
            key={opt.value} type="button" onClick={() => toggle(opt.value)}
            className={`group flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              sel ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt.emoji && <span className="text-sm">{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function CardGroup<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; emoji: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map(opt => (
        <button
          key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
            value === opt.value ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <span className="text-lg">{opt.emoji}</span>
          <span className="text-sm font-semibold text-foreground">{opt.label}</span>
          {opt.desc && <span className="text-[11px] text-muted-foreground">{opt.desc}</span>}
        </button>
      ))}
    </div>
  );
}

export function WillGenerateBox({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] p-4">
      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-primary">
        ✦ We'll generate
      </p>
      <ul className="space-y-1 text-[12px] text-muted-foreground">
        {items.map((it, i) => <li key={i}>• {it}</li>)}
      </ul>
    </div>
  );
}

export function GenerateButton({ loading, children, ...rest }: { loading?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${rest.className || ""}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  );
}
