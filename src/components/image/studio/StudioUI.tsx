/**
 * Image Studio premium UI kit.
 * Purely presentational building blocks for /dashboard/image-studio —
 * glass cards, visual pickers, batch board tiles, recipe inspector.
 * All colors come from semantic tokens or per-model accent variables.
 */
import type { ReactNode } from "react";
import { StyleIcon } from "@/components/BrandIcon";
import {
  Download,
  Save,
  Wand2,
  Sparkles,
  Copy,
  RefreshCw,
  Maximize2,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";

/* ---------------------------------- shell --------------------------------- */

export function StudioCard({
  children,
  className = "",
  accent,
  label,
  hint,
  action,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
  label?: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={`is-card ${className}`}
      style={accent ? ({ ["--is-accent" as any]: accent } as any) : undefined}
    >
      {(label || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {label && <p className="is-eyebrow">{label}</p>}
            {hint && <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{hint}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StudioTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon: any }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="is-tabs" role="tablist">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = value === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`is-tab ${active ? "is-tab-active" : ""}`}
          >
            <Icon className="h-4 w-4" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- pickers -------------------------------- */

export function ModelPicker<T extends string>({
  models,
  value,
  onChange,
}: {
  models: { id: T; name: string; badge: string; desc: string; cost: string; color: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {models.map((m) => {
        const on = value === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`is-model ${on ? "is-model-on" : ""}`}
            style={{ ["--is-accent" as any]: m.color } as any}
          >
            <span className="is-model-badge">{m.badge}</span>
            <span className="mt-2 block text-[12.5px] font-semibold text-foreground">{m.name}</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">{m.desc}</span>
            <span className="is-model-cost">{m.cost}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StylePicker<T extends string>({
  styles,
  value,
  onChange,
}: {
  styles: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="is-style-rail">
      {styles.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`is-style ${value === s.id ? "is-style-on" : ""}`}
          title={s.label}
        >
          <StyleIcon styleId={s.id as any} size={44} />
          <span className="mt-2 block text-[11px] font-semibold leading-tight">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

const ASPECT_SHAPE: Record<string, { w: number; h: number; px: string }> = {
  square: { w: 26, h: 26, px: "1024 × 1024" },
  portrait: { w: 17, h: 30, px: "1024 × 1536" },
  landscape: { w: 32, h: 18, px: "1536 × 1024" },
};

export function AspectPicker<T extends string>({
  aspects,
  value,
  onChange,
}: {
  aspects: readonly { id: T; label: string; hint: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {aspects.map((a) => {
        const shape = ASPECT_SHAPE[a.id] || ASPECT_SHAPE.square;
        const on = value === a.id;
        return (
          <button key={a.id} onClick={() => onChange(a.id)} className={`is-aspect ${on ? "is-aspect-on" : ""}`}>
            <span className="is-aspect-shape" style={{ width: shape.w, height: shape.h }} />
            <span className="mt-2 block text-[11.5px] font-semibold">{a.label}</span>
            <span className="block text-[10px] text-muted-foreground">{shape.px}</span>
            <span className="block text-[10px] text-muted-foreground">{a.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BatchPicker({
  value,
  onChange,
  options = [1, 2, 4],
}: {
  value: number;
  onChange: (n: number) => void;
  options?: number[];
}) {
  return (
    <div className="is-seg">
      {options.map((n) => (
        <button key={n} onClick={() => onChange(n)} className={`is-seg-btn ${value === n ? "is-seg-on" : ""}`}>
          {n} {n === 1 ? "image" : "images"}
        </button>
      ))}
    </div>
  );
}

export function SegToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="is-seg">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`is-seg-btn ${value === o.id ? "is-seg-on" : ""}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- prompt lab ------------------------------- */

export const PROMPT_CHIPS: { group: string; items: string[] }[] = [
  { group: "Lighting", items: ["golden hour", "soft studio light", "neon rim light", "moody chiaroscuro", "backlit haze"] },
  { group: "Camera", items: ["35mm portrait", "macro detail", "wide establishing shot", "top-down flat lay", "shallow depth of field"] },
  { group: "Mood", items: ["premium and calm", "high energy", "editorial luxury", "playful pastel", "dark futuristic"] },
  { group: "Finish", items: ["ultra detailed", "film grain", "clean vector", "glossy 3D", "matte print"] },
];

export const NEGATIVE_CHIPS = ["blurry", "watermark", "extra fingers", "text artifacts", "low quality", "distorted face"];

export function ChipRow({
  items,
  onPick,
  active,
}: {
  items: string[];
  onPick: (v: string) => void;
  active?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          className={`is-chip ${active?.includes(i) ? "is-chip-on" : ""}`}
          type="button"
        >
          {i}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- batch board ------------------------------ */

export type Recipe = {
  prompt: string;
  negativePrompt?: string;
  style: string;
  aspect: string;
  model: string;
  quality?: string;
  template?: string;
};

export function TileSkeleton({ aspectClass }: { aspectClass: string }) {
  return (
    <div className={`is-tile ${aspectClass}`}>
      <div className="is-skel" />
      <span className="is-tile-status">Rendering…</span>
    </div>
  );
}

export function ImageTile({
  url,
  aspectClass,
  index,
  onDownload,
  onSave,
  onVary,
  onRemix,
  onEdit,
  onOpen,
  onCopyRecipe,
  footer,
}: {
  url: string;
  aspectClass: string;
  index?: number;
  onDownload?: () => void;
  onSave?: () => void;
  onVary?: () => void;
  onRemix?: () => void;
  onEdit?: () => void;
  onOpen?: () => void;
  onCopyRecipe?: () => void;
  footer?: ReactNode;
}) {
  const actions: { icon: any; label: string; fn?: () => void }[] = [
    { icon: Maximize2, label: "Open", fn: onOpen },
    { icon: Download, label: "Download", fn: onDownload },
    { icon: Save, label: "Save", fn: onSave },
    { icon: Wand2, label: "Variations", fn: onVary },
    { icon: RefreshCw, label: "Remix", fn: onRemix },
    { icon: Sparkles, label: "Edit", fn: onEdit },
    { icon: Copy, label: "Copy recipe", fn: onCopyRecipe },
  ].filter((a) => !!a.fn);

  return (
    <figure className="is-tile-wrap">
      <div className={`is-tile ${aspectClass}`}>
        <img src={url} alt={`Generated result ${index != null ? index + 1 : ""}`} loading="lazy" className="is-tile-img" />
        <div className="is-tile-actions">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.fn} title={a.label} aria-label={a.label} className="is-act">
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>
      {footer && <figcaption className="mt-2 text-[11px] text-muted-foreground">{footer}</figcaption>}
    </figure>
  );
}

/* -------------------------------- inspector ------------------------------- */

export function Inspector({
  recipe,
  locked,
  onToggleLock,
  onReuse,
  history,
  onPickHistory,
  onClearHistory,
}: {
  recipe: Recipe | null;
  locked: boolean;
  onToggleLock: () => void;
  onReuse: () => void;
  history: string[];
  onPickHistory: (p: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <div className="space-y-4">
      <StudioCard label="Recipe" hint="Everything needed to reproduce the last render.">
        {recipe ? (
          <div className="space-y-2 text-[11.5px]">
            <p className="max-h-24 overflow-y-auto rounded-lg border border-border/70 bg-background/50 p-2 leading-relaxed text-foreground">
              {recipe.prompt}
            </p>
            <dl className="grid grid-cols-2 gap-1.5">
              {[
                ["Model", recipe.model],
                ["Style", recipe.style],
                ["Aspect", recipe.aspect],
                ["Quality", recipe.quality || "standard"],
                ["Template", recipe.template || "—"],
                ["Avoid", recipe.negativePrompt || "—"],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
                  <dt className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
                  <dd className="truncate font-semibold text-foreground">{v as string}</dd>
                </div>
              ))}
            </dl>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={onReuse} className="is-btn-ghost">
                <RefreshCw className="h-3.5 w-3.5" /> Reuse
              </button>
              <button onClick={onToggleLock} className={`is-btn-ghost ${locked ? "is-btn-on" : ""}`}>
                {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {locked ? "Settings locked" : "Lock settings"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">Generate something and its full recipe lands here.</p>
        )}
      </StudioCard>

      <StudioCard
        label="Prompt history"
        hint="Your last prompts in this session."
        action={
          history.length ? (
            <button onClick={onClearHistory} className="is-btn-ghost !px-2 !py-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      >
        {history.length ? (
          <ul className="space-y-1.5">
            {history.map((h, i) => (
              <li key={`${h}-${i}`}>
                <button onClick={() => onPickHistory(h)} className="is-history">
                  {h}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">No prompts yet.</p>
        )}
      </StudioCard>
    </div>
  );
}

/* ----------------------------- inspiration wall ---------------------------- */

export const INSPIRATION: { title: string; prompt: string; tone: string }[] = [
  {
    title: "Editorial product hero",
    prompt:
      "A matte black skincare bottle on polished travertine, single hard light from the left, deep shadow, editorial luxury still life, ultra detailed",
    tone: "#7C3AED",
  },
  {
    title: "Founder desk scene",
    prompt:
      "Sunlit walnut desk with laptop, ceramic espresso cup and notebook, golden hour side light, 35mm shallow depth of field, warm premium mood",
    tone: "#F97316",
  },
  {
    title: "Bold quote card",
    prompt:
      'Minimal quote card with large centered text "Ship every day", off-white paper texture, single violet accent line, generous negative space',
    tone: "#0EA5E9",
  },
  {
    title: "Neon thumbnail",
    prompt:
      "YouTube thumbnail: surprised creator on the right, giant bold 3-word headline on the left, neon rim light, dark gradient background, high energy",
    tone: "#EF4444",
  },
  {
    title: "3D glossy icon",
    prompt:
      "Glossy 3D rendered rocket icon floating on a soft violet gradient, studio reflections, clean isometric angle, premium app store artwork",
    tone: "#10B981",
  },
  {
    title: "Dark futuristic banner",
    prompt:
      "Abstract dark futuristic banner, layered violet and cyan light ribbons, fine film grain, cinematic depth, wide establishing composition",
    tone: "#6366F1",
  },
];

export const INSPIRATION_PROMPTS = INSPIRATION.map((i) => i.prompt);

export function InspirationWall({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {INSPIRATION.map((i, idx) => (
        <button
          key={i.title}
          onClick={() => onPick(i.prompt)}
          className="is-inspire"
          style={{ ["--is-accent" as any]: i.tone, animationDelay: `${idx * 60}ms` } as any}
        >
          <span className="is-inspire-glow" aria-hidden />
          <span className="is-eyebrow">Prompt idea</span>
          <span className="mt-1.5 block text-[13.5px] font-bold text-foreground">{i.title}</span>
          <span className="mt-1 line-clamp-3 block text-[11.5px] leading-relaxed text-muted-foreground">{i.prompt}</span>
          <span className="is-inspire-cta">Use this prompt →</span>
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- lightbox ------------------------------- */

export function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="is-lightbox" role="dialog" aria-modal="true">
      <button className="is-lightbox-bg" aria-label="Close preview" onClick={onClose} />
      <img src={url} alt="Full size preview" className="is-lightbox-img" />
    </div>
  );
}
