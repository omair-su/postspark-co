import { AlignCenter, AlignLeft, Layers, Loader2, RotateCcw, Trash2, Type, Wand2, X } from "lucide-react";
import {
  CAROUSEL_TEMPLATES, FONT_PAIRS, hasOverride,
  type Slide, type SlideOverride,
} from "@/lib/carouselDesign";

interface Props {
  slide: Slide;
  index: number;
  total: number;
  deckTemplateKey: string;
  deckFontPairKey: string;
  busy: boolean;
  artBusy: boolean;
  onPatch: (patch: Partial<Slide>) => void;
  onOverride: (patch: SlideOverride) => void;
  onResetOverride: () => void;
  onGenerateArt: () => void;
  onClearArt: () => void;
  onAction: (action: "punchier" | "expand" | "concrete" | "shorten") => void;
}

const SECTION = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const FIELD =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Slider({
  label, value, min, max, step, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        <span className="text-foreground">
          {value}
          {suffix ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full accent-primary"
      />
    </label>
  );
}

function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { key: T; label: string; icon?: typeof AlignLeft }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-1 flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition ${
            value === o.key
              ? "border-primary bg-primary/10 text-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          {o.icon ? <o.icon className="h-3.5 w-3.5" /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Per-slide inspector: layout, text, typography and background layers for the
 * slide currently on the canvas. Every change patches state, so the canvas
 * re-renders instantly.
 */
export function SlideInspector({
  slide, index, total, deckTemplateKey, deckFontPairKey, busy, artBusy,
  onPatch, onOverride, onResetOverride, onGenerateArt, onClearArt, onAction,
}: Props) {
  const ov = slide.override ?? {};
  const edited = hasOverride(ov);
  const bullets = slide.bullets ?? [];

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Slide {index + 1} / {total} · {slide.kind}
          </span>
          {edited ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              customised
            </span>
          ) : null}
        </div>
        {edited ? (
          <button
            onClick={onResetOverride}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Match deck
          </button>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- text */}
      <div className="space-y-3">
        <p className={SECTION}>
          <Type className="mr-1 inline h-3.5 w-3.5" /> Text
        </p>
        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Eyebrow</span>
            <input
              value={slide.label ?? ""}
              onChange={(e) => onPatch({ label: e.target.value })}
              placeholder="auto"
              maxLength={40}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Headline</span>
            <input
              value={slide.title}
              onChange={(e) => onPatch({ title: e.target.value })}
              className={`${FIELD} font-semibold`}
            />
          </label>
        </div>
        <label className="block">
          <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            Body
            <span>{slide.body.length} chars</span>
          </span>
          <textarea
            value={slide.body}
            onChange={(e) => onPatch({ body: e.target.value })}
            className={`${FIELD} h-24 resize-none`}
          />
        </label>

        <div>
          <span className="text-xs font-medium text-muted-foreground">Bullets</span>
          <div className="mt-1 space-y-1.5">
            {bullets.map((b, bi) => (
              <div key={bi} className="flex gap-1.5">
                <input
                  value={b}
                  onChange={(e) =>
                    onPatch({ bullets: bullets.map((x, k) => (k === bi ? e.target.value : x)) })
                  }
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => onPatch({ bullets: bullets.filter((_, k) => k !== bi) })}
                  className="rounded-lg border border-input px-2 text-destructive hover:bg-accent"
                  title="Remove bullet"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => onPatch({ bullets: [...bullets, ""] })}
              className="w-full rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground"
            >
              + Add bullet
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {([
            { key: "punchier", label: "Punchier" },
            { key: "expand", label: "Go deeper" },
            { key: "concrete", label: "Add specifics" },
            { key: "shorten", label: "Tighten" },
          ] as const).map((a) => (
            <button
              key={a.key}
              onClick={() => onAction(a.key)}
              disabled={busy}
              className="rounded-full border border-input px-2.5 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : a.label}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------- layout */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className={SECTION}>
          <Layers className="mr-1 inline h-3.5 w-3.5" /> Layout
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Horizontal</span>
            <Segmented
              value={ov.align ?? "inherit" as any}
              options={[
                { key: "left" as any, label: "Left", icon: AlignLeft },
                { key: "center" as any, label: "Center", icon: AlignCenter },
              ]}
              onChange={(v) => onOverride({ align: v as "left" | "center" })}
            />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Vertical</span>
            <Segmented
              value={(ov.vAlign ?? (slide.kind === "cover" ? "bottom" : "center")) as any}
              options={[
                { key: "top" as any, label: "Top" },
                { key: "center" as any, label: "Middle" },
                { key: "bottom" as any, label: "Bottom" },
              ]}
              onChange={(v) => onOverride({ vAlign: v as "top" | "center" | "bottom" })}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {([
            ["card", "Glass card"],
            ["rule", "Accent rule"],
            ["uppercaseLabel", "Uppercase eyebrow"],
            ["hideBands", "Hide edge bands"],
          ] as const).map(([k, label]) => (
            <label key={k} className="inline-flex cursor-pointer items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={Boolean(ov[k])}
                onChange={(e) => onOverride({ [k]: e.target.checked } as SlideOverride)}
                className="h-4 w-4 rounded border-input"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- typography */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className={SECTION}>Typography</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onOverride({ fontPairKey: undefined })}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              !ov.fontPairKey
                ? "border-primary bg-primary/10 text-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            Deck ({FONT_PAIRS.find((f) => f.key === deckFontPairKey)?.label})
          </button>
          {FONT_PAIRS.map((f) => (
            <button
              key={f.key}
              onClick={() => onOverride({ fontPairKey: f.key })}
              style={{ fontFamily: `'${f.heading}', serif` }}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                ov.fontPairKey === f.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider
            label="Headline size"
            value={Math.round((ov.titleScale ?? 1) * 100)}
            min={60}
            max={160}
            step={5}
            suffix="%"
            onChange={(v) => onOverride({ titleScale: v / 100 })}
          />
          <Slider
            label="Body size"
            value={Math.round((ov.bodyScale ?? 1) * 100)}
            min={60}
            max={160}
            step={5}
            suffix="%"
            onChange={(v) => onOverride({ bodyScale: v / 100 })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["surface", "Surface"],
            ["accent", "Accent"],
            ["textColor", "Text"],
          ] as const).map(([k, label]) => (
            <label key={k} className="block">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  type="color"
                  value={ov[k] ?? "#1a1a2e"}
                  onChange={(e) => onOverride({ [k]: e.target.value } as SlideOverride)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-background"
                />
                {ov[k] ? (
                  <button
                    onClick={() => onOverride({ [k]: undefined } as SlideOverride)}
                    className="rounded-lg border border-input p-1.5 hover:bg-accent"
                    title="Reset to template"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* --------------------------------------------- background layers */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className={SECTION}>Background layers</p>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Slide template</span>
          <select
            value={ov.templateKey ?? ""}
            onChange={(e) => onOverride({ templateKey: e.target.value || undefined })}
            className={FIELD}
          >
            <option value="">
              Deck template ({CAROUSEL_TEMPLATES.find((t) => t.key === deckTemplateKey)?.label})
            </option>
            {CAROUSEL_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onGenerateArt}
            disabled={artBusy}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-electric px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {artBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            AI background for this slide
          </button>
          {slide.imageUrl ? (
            <button
              onClick={onClearArt}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" /> Remove photo
            </button>
          ) : null}
        </div>

        {slide.imageUrl ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Slider
              label="Scrim"
              value={Math.round((ov.scrim ?? 0.55) * 100)}
              min={0}
              max={95}
              step={5}
              suffix="%"
              onChange={(v) => onOverride({ scrim: v / 100 })}
            />
            <Slider
              label="Blur"
              value={ov.imageBlur ?? 0}
              min={0}
              max={40}
              step={2}
              suffix="px"
              onChange={(v) => onOverride({ imageBlur: v })}
            />
            <Slider
              label="Zoom"
              value={Math.round((ov.imageZoom ?? 1) * 100)}
              min={100}
              max={180}
              step={5}
              suffix="%"
              onChange={(v) => onOverride({ imageZoom: v / 100 })}
            />
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Add an AI or stock photo to unlock scrim, blur and zoom controls.
          </p>
        )}
      </div>
    </div>
  );
}
