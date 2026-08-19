import { Check, Crown } from "lucide-react";
import { SlideCanvas } from "@/components/carousel/SlideCanvas";
import {
  CAROUSEL_PRESETS, CAROUSEL_TEMPLATES, FONT_PAIRS, FRAMEWORKS, GALLERY_SAMPLE,
  presetByKey, resolvePalette, templateByKey,
  type CarouselDesignState, type CarouselPreset, type CarouselTemplate, type Slide,
} from "@/lib/carouselDesign";

/** A live mini-render of a template — real design engine, scaled down. */
export function TemplateThumb({
  template,
  preset,
  fontPairKey,
  width = 168,
  slide = GALLERY_SAMPLE,
  brandName = "PostSpark",
  handle = "@postspark",
  palette,
}: {
  template: CarouselTemplate;
  preset: CarouselPreset;
  fontPairKey?: string;
  width?: number;
  slide?: Slide;
  brandName?: string;
  handle?: string;
  palette?: ReturnType<typeof resolvePalette>;
}) {
  const scale = width / preset.width;
  const pal = palette ?? resolvePalette(template, { useBrand: false });
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ width, height: Math.round(preset.height * scale) }}
      aria-hidden
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <SlideCanvas
          slide={slide}
          index={0}
          total={8}
          preset={preset}
          template={template}
          palette={pal}
          fontPairKey={fontPairKey ?? template.fontPair}
          brandName={brandName}
          handle={handle}
          showBrandBar
          showCounter
          showSwipeHint={false}
        />
      </div>
    </div>
  );
}

interface Props {
  design: CarouselDesignState;
  setDesign: (fn: (d: CarouselDesignState) => CarouselDesignState) => void;
  brandName?: string;
  handle?: string;
  /** Show framework + slide-count pickers (pre-generation brief). */
  showBrief?: boolean;
  framework?: string;
  setFramework?: (k: string) => void;
  slideCount?: number;
  setSlideCount?: (n: number) => void;
}

export function TemplateGallery({
  design, setDesign, brandName, handle,
  showBrief = false, framework, setFramework, slideCount, setSlideCount,
}: Props) {
  const preset = presetByKey(design.presetKey);
  const activeTemplate = templateByKey(design.templateKey);

  return (
    <div className="space-y-5">
      {/* Canvas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Canvas size</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {CAROUSEL_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setDesign((d) => ({ ...d, presetKey: p.key }))}
              className={`rounded-xl border p-3 text-left transition ${
                design.presetKey === p.key
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <div className="text-sm font-semibold text-foreground">{p.label}</div>
              <div className="text-[11px] text-muted-foreground">{p.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Template gallery with live thumbnails */}
      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Template gallery
          </p>
          <span className="text-[11px] text-muted-foreground">{CAROUSEL_TEMPLATES.length} premium layouts</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {CAROUSEL_TEMPLATES.map((t) => {
            const selected = design.templateKey === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setDesign((d) => ({ ...d, templateKey: t.key, fontPairKey: t.fontPair }))}
                className={`group relative overflow-hidden rounded-xl border p-2 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/25"
                    : "border-border bg-background hover:border-primary/40"
                }`}
                title={t.blurb}
              >
                <div className="flex justify-center overflow-hidden rounded-lg border border-border/60">
                  <TemplateThumb
                    template={t}
                    preset={preset}
                    width={168}
                    brandName={brandName}
                    handle={handle}
                  />
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-foreground">{t.label}</span>
                  {t.pro ? <Crown className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  {selected ? <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                </div>
                <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{t.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Typography */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typography</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FONT_PAIRS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDesign((d) => ({ ...d, fontPairKey: f.key }))}
              style={{ fontFamily: `'${f.heading}', serif` }}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                design.fontPairKey === f.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {activeTemplate.label} pairs best with{" "}
          <span className="text-foreground">
            {FONT_PAIRS.find((f) => f.key === activeTemplate.fontPair)?.label}
          </span>
          .
        </p>
      </div>

      {showBrief && setFramework && setSlideCount ? (
        <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Story framework
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {FRAMEWORKS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFramework(f.key)}
                  className={`rounded-xl border p-3 text-left transition ${
                    framework === f.key
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="text-sm font-semibold text-foreground">{f.label}</div>
                  <div className="text-[11px] text-muted-foreground">{f.blurb}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slides</p>
            <div className="mt-2 rounded-xl border border-border bg-background p-3">
              <div className="text-2xl font-bold text-foreground">{slideCount}</div>
              <input
                type="range"
                min={5}
                max={12}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="mt-2 block w-full accent-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                5–12 slides. 8 performs best on LinkedIn.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
