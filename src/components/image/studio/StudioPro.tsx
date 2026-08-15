/**
 * Image Studio "pro" modules — seed lock, reference image + strength,
 * brand lock, inpaint brush, outpaint/expand, caption pairing,
 * platform export pack and forkable featured recipes.
 * Presentational + local canvas logic only; all AI calls are passed in as props.
 */
import { useEffect, useRef, useState } from "react";
import {
  Dices,
  Lock,
  Unlock,
  ImagePlus,
  X,
  Brush,
  Eraser,
  Expand,
  MessageSquareQuote,
  PackageOpen,
  Copy,
  Loader2,
  Palette,
  Sparkles,
} from "lucide-react";
import { StudioCard } from "./StudioUI";
import { EXPORT_PACK, type ExportSize } from "@/lib/studioCanvas";

/* --------------------------------- seed ---------------------------------- */

export function SeedControl({
  seed,
  locked,
  onChange,
  onToggleLock,
  onRandom,
}: {
  seed: number;
  locked: boolean;
  onChange: (n: number) => void;
  onToggleLock: () => void;
  onRandom: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        value={seed}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="is-input !w-[140px] !py-1.5 text-[12px]"
        aria-label="Seed"
      />
      <button onClick={onRandom} className="is-btn-ghost" type="button">
        <Dices className="h-3.5 w-3.5" /> New seed
      </button>
      <button onClick={onToggleLock} className={`is-btn-ghost ${locked ? "is-btn-on" : ""}`} type="button">
        {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        {locked ? "Seed locked" : "Lock seed"}
      </button>
    </div>
  );
}

/* ------------------------------- reference -------------------------------- */

export function ReferencePanel({
  referenceUrl,
  strength,
  onPick,
  onClear,
  onStrength,
  savedRefs,
  onSaveRef,
  onUseSavedRef,
}: {
  referenceUrl: string | null;
  strength: number;
  onPick: (dataUrl: string) => void;
  onClear: () => void;
  onStrength: (n: number) => void;
  savedRefs: { id: string; name: string; url: string }[];
  onSaveRef: () => void;
  onUseSavedRef: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <StudioCard label="Reference image" hint="Guide the render with an existing image, product or character.">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onPick(String(r.result || ""));
          r.readAsDataURL(f);
          e.target.value = "";
        }}
      />
      {referenceUrl ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={referenceUrl} alt="Reference" className="max-h-40 w-full object-cover" />
            <button
              onClick={onClear}
              className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5"
              aria-label="Remove reference"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Influence strength</span>
              <span className="font-semibold text-foreground">{strength}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={strength}
              onChange={(e) => onStrength(Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
          </div>
          <button onClick={onSaveRef} className="is-btn-ghost w-full" type="button">
            <Sparkles className="h-3.5 w-3.5" /> Save as character / product
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} className="is-btn-ghost w-full" type="button">
          <ImagePlus className="h-3.5 w-3.5" /> Upload reference
        </button>
      )}

      {savedRefs.length > 0 && (
        <div className="mt-3">
          <p className="is-eyebrow mb-1.5">Saved consistency refs</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {savedRefs.map((r) => (
              <button
                key={r.id}
                onClick={() => onUseSavedRef(r.url)}
                title={r.name}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border"
              >
                <img src={r.url} alt={r.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </StudioCard>
  );
}

/* ------------------------------- brand lock ------------------------------- */

export function BrandLockPanel({
  on,
  onToggle,
  colors,
  logoUrl,
  logoOn,
  onLogoToggle,
  placement,
  onPlacement,
}: {
  on: boolean;
  onToggle: () => void;
  colors: string[];
  logoUrl: string | null;
  logoOn: boolean;
  onLogoToggle: () => void;
  placement: string;
  onPlacement: (p: any) => void;
}) {
  return (
    <StudioCard
      label="Brand lock"
      hint="Force your Brand Kit palette into every render and stamp your logo."
      action={
        <button onClick={onToggle} className={`is-btn-ghost ${on ? "is-btn-on" : ""}`} type="button">
          <Palette className="h-3.5 w-3.5" /> {on ? "On" : "Off"}
        </button>
      }
    >
      {colors.length ? (
        <div className="flex gap-1.5">
          {colors.slice(0, 6).map((c) => (
            <span
              key={c}
              className="h-6 w-6 rounded-md border border-border"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] text-muted-foreground">
          No Brand Kit palette yet — add one in Brand Kit to lock your colors.
        </p>
      )}

      {logoUrl && (
        <div className="mt-3 space-y-2">
          <button onClick={onLogoToggle} className={`is-btn-ghost w-full ${logoOn ? "is-btn-on" : ""}`} type="button">
            Composite logo {logoOn ? "on" : "off"}
          </button>
          {logoOn && (
            <select value={placement} onChange={(e) => onPlacement(e.target.value)} className="is-input !py-1.5 text-[12px]">
              {["bottom-right", "bottom-left", "top-right", "top-left"].map((p) => (
                <option key={p} value={p}>
                  {p.replace("-", " ")}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </StudioCard>
  );
}

/* --------------------------------- inpaint -------------------------------- */

export function InpaintDialog({
  src,
  busy,
  onClose,
  onSubmit,
}: {
  src: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (maskedDataUrl: string, instruction: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [instruction, setInstruction] = useState("");
  const [size, setSize] = useState(46);
  const drawing = useRef(false);
  const baseRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      baseRef.current = img;
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);

  const paint = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c || !drawing.current) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * c.width;
    const y = ((e.clientY - rect.top) / rect.height) * c.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(255,0,200,0.6)";
    ctx.beginPath();
    ctx.arc(x, y, (size / 100) * (c.width / 8), 0, Math.PI * 2);
    ctx.fill();
  };

  const reset = () => {
    const c = canvasRef.current;
    const img = baseRef.current;
    if (!c || !img) return;
    c.getContext("2d")!.drawImage(img, 0, 0);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="is-card w-full max-w-2xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="is-eyebrow">Inpaint brush</p>
          <button onClick={onClose} className="is-btn-ghost" type="button">
            <X className="h-3.5 w-3.5" /> Close
          </button>
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          Paint over the area you want changed, then describe the replacement.
        </p>
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            drawing.current = true;
            paint(e);
          }}
          onPointerMove={paint}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
          className="max-h-[45vh] w-full cursor-crosshair rounded-xl border border-border object-contain touch-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Brush className="h-3.5 w-3.5 text-muted-foreground" />
          <input type="range" min={10} max={100} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <button onClick={reset} className="is-btn-ghost" type="button">
            <Eraser className="h-3.5 w-3.5" /> Reset mask
          </button>
        </div>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Replace the masked area with a marble pedestal"
          className="is-input"
        />
        <button
          onClick={() => {
            const c = canvasRef.current;
            if (!c) return;
            onSubmit(c.toDataURL("image/png"), instruction.trim());
          }}
          disabled={busy || instruction.trim().length < 3}
          className="is-btn"
          type="button"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brush className="h-4 w-4" />} Regenerate masked area
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- captions -------------------------------- */

export function CaptionPanel({
  caption,
  busy,
  onGenerate,
  onCopy,
  onSendToPublishing,
}: {
  caption: string | null;
  busy: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onSendToPublishing: () => void;
}) {
  return (
    <StudioCard label="Caption pairing" hint="Pair the visual with a ready-to-post caption.">
      <button onClick={onGenerate} disabled={busy} className="is-btn-ghost w-full" type="button">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareQuote className="h-3.5 w-3.5" />}
        Write caption + hashtags
      </button>
      {caption && (
        <>
          <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-background/50 p-2 text-[11.5px] leading-relaxed">
            {caption}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={onCopy} className="is-btn-ghost" type="button">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button onClick={onSendToPublishing} className="is-btn-ghost" type="button">
              Send to publishing
            </button>
          </div>
        </>
      )}
    </StudioCard>
  );
}

/* ------------------------------ export pack ------------------------------- */

export function ExportPackPanel({
  busy,
  onExport,
  onExpand,
  sizes = EXPORT_PACK,
}: {
  busy: boolean;
  onExport: (sizes: ExportSize[]) => void;
  onExpand: (aspect: "square" | "portrait" | "landscape") => void;
  sizes?: ExportSize[];
}) {
  return (
    <StudioCard label="Platform pack" hint="One render, every platform size — plus canvas expansion.">
      <ul className="mb-2 space-y-1 text-[11px] text-muted-foreground">
        {sizes.map((s) => (
          <li key={s.id} className="flex justify-between">
            <span>{s.label}</span>
            <span>
              {s.w}×{s.h}
            </span>
          </li>
        ))}
      </ul>
      <button onClick={() => onExport(sizes)} disabled={busy} className="is-btn" type="button">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageOpen className="h-4 w-4" />} Export pack (ZIP)
      </button>
      <p className="is-eyebrow mt-3 mb-1.5">Expand canvas (outpaint)</p>
      <div className="grid grid-cols-3 gap-2">
        {(["square", "portrait", "landscape"] as const).map((a) => (
          <button key={a} onClick={() => onExpand(a)} className="is-btn-ghost !px-2" type="button">
            <Expand className="h-3.5 w-3.5" /> {a}
          </button>
        ))}
      </div>
    </StudioCard>
  );
}

/* --------------------------- featured recipes ----------------------------- */

export type FeaturedRecipe = {
  id: string;
  title: string;
  author: string;
  prompt: string;
  style: string;
  aspect: "square" | "portrait" | "landscape";
  model: "flux" | "gpt" | "gemini";
};

export const FEATURED_RECIPES: FeaturedRecipe[] = [
  {
    id: "luxe-product",
    title: "Luxe product pedestal",
    author: "PostSpark team",
    prompt:
      "A matte black skincare bottle on a travertine pedestal, single hard key light, deep shadow falloff, editorial luxury still life",
    style: "photorealistic",
    aspect: "square",
    model: "flux",
  },
  {
    id: "bold-thumb",
    title: "Click-worthy thumbnail",
    author: "PostSpark team",
    prompt:
      'YouTube thumbnail with the bold text "I TRIED IT FOR 30 DAYS", surprised founder on the left, high contrast violet gradient background',
    style: "cinematic",
    aspect: "landscape",
    model: "gpt",
  },
  {
    id: "quote-glass",
    title: "Glassmorphic quote card",
    author: "Community",
    prompt:
      'Quote card with the text "Consistency beats intensity", frosted glass panel, soft violet mesh gradient, elegant serif typography',
    style: "minimal",
    aspect: "square",
    model: "gpt",
  },
  {
    id: "story-neon",
    title: "Neon story backdrop",
    author: "Community",
    prompt:
      "Vertical story backdrop, rain-slick neon city street at night, cyan and magenta rim light, cinematic haze, space for text at top",
    style: "cyberpunk",
    aspect: "portrait",
    model: "flux",
  },
];

export function FeaturedRecipeRail({ onFork }: { onFork: (r: FeaturedRecipe) => void }) {
  return (
    <StudioCard label="Featured recipes" hint="Fork a proven setup and make it yours.">
      <div className="grid gap-2 sm:grid-cols-2">
        {FEATURED_RECIPES.map((r) => (
          <button key={r.id} onClick={() => onFork(r)} className="is-model text-left" type="button">
            <span className="block text-[12.5px] font-semibold text-foreground">{r.title}</span>
            <span className="mt-0.5 block line-clamp-2 text-[11px] leading-tight text-muted-foreground">{r.prompt}</span>
            <span className="is-model-cost">
              {r.model} · {r.aspect} · by {r.author}
            </span>
          </button>
        ))}
      </div>
    </StudioCard>
  );
}

/* ------------------------------ recipe drawer ----------------------------- */

export function LibraryRecipeDrawer({
  item,
  onClose,
  onReuse,
  onUseAsReference,
}: {
  item: { image_url: string; prompt: string; style?: string | null; aspect?: string | null; template?: string | null; created_at: string };
  onClose: () => void;
  onReuse: () => void;
  onUseAsReference: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="is-card h-full w-full max-w-sm space-y-3 overflow-y-auto rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="is-eyebrow">Recipe</p>
          <button onClick={onClose} className="is-btn-ghost" type="button">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <img src={item.image_url} alt={item.prompt} className="w-full rounded-xl border border-border" />
        <p className="text-[11.5px] leading-relaxed">{item.prompt}</p>
        <dl className="grid grid-cols-2 gap-1.5 text-[11px]">
          {[
            ["Style", item.style || "—"],
            ["Aspect", item.aspect || "—"],
            ["Template", item.template || "—"],
            ["Created", new Date(item.created_at).toLocaleDateString()],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
              <dt className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
              <dd className="truncate font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onReuse} className="is-btn-ghost" type="button">
            Reuse prompt
          </button>
          <button onClick={onUseAsReference} className="is-btn-ghost" type="button">
            Use as reference
          </button>
        </div>
      </aside>
    </div>
  );
}
