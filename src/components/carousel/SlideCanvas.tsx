import { forwardRef } from "react";
import {
  backgroundCss,
  backgroundSize,
  fontPairByKey,
  layoutMetrics,
  typeScale,
  withAlpha,
  type CarouselPreset,
  type CarouselTemplate,
  type Palette,
  type Slide,
} from "@/lib/carouselDesign";

export interface SlideCanvasProps {
  slide: Slide;
  index: number;
  total: number;
  preset: CarouselPreset;
  template: CarouselTemplate;
  palette: Palette;
  fontPairKey: string;
  brandName: string;
  handle: string;
  logoUrl?: string | null;
  showBrandBar: boolean;
  showCounter: boolean;
  showSwipeHint: boolean;
  watermark?: { on: boolean; text: string; opacity: number; placement: string };
}

/**
 * A slide rendered at its TRUE export pixel size. Callers scale it down for
 * preview with a CSS transform, so html2canvas always captures full-res.
 */
export const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(function SlideCanvas(
  {
    slide, index, total, preset, template, palette, fontPairKey,
    brandName, handle, logoUrl, showBrandBar, showCounter, showSwipeHint, watermark,
  },
  ref,
) {
  const ov = slide.override ?? {};
  const font = fontPairByKey(ov.fontPairKey ?? fontPairKey);
  const m = layoutMetrics(preset.width, preset.height);
  const bullets = slide.bullets?.filter(Boolean) ?? [];
  const base = typeScale({
    width: preset.width,
    height: preset.height,
    kind: slide.kind,
    titleLength: slide.title.length,
    bodyLength: slide.body.length + bullets.join("").length,
    bulletCount: bullets.length,
  });
  const ts = {
    ...base,
    title: base.title * (ov.titleScale ?? 1),
    body: base.body * (ov.bodyScale ?? 1),
    bullet: base.bullet * (ov.bodyScale ?? 1),
  };

  const isCover = slide.kind === "cover";
  const center = template.align === "center";
  const hasPhoto = Boolean(slide.imageUrl);
  const vAlign = ov.vAlign ?? (isCover ? "bottom" : "center");
  const justify = vAlign === "top" ? "flex-start" : vAlign === "bottom" ? "flex-end" : "center";
  const showBands = !ov.hideBands;

  const label =
    slide.label ||
    (isCover ? brandName : slide.kind === "cta" ? "Your move" : `${index + 1} of ${total}`);


  return (
    <div
      ref={ref}
      data-slide-canvas={index}
      style={{
        position: "relative",
        width: preset.width,
        height: preset.height,
        overflow: "hidden",
        background: backgroundCss(template, palette),
        backgroundSize: backgroundSize(template),
        color: palette.text,
        fontFamily: `'${font.body}', system-ui, sans-serif`,
        display: "flex",
        flexDirection: "column",
        isolation: "isolate",
      }}
    >
      {/* Photo layer + scrim */}
      {hasPhoto ? (
        <>
          <img
            src={slide.imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              filter: ov.imageBlur ? `blur(${ov.imageBlur}px)` : undefined,
              transform: ov.imageZoom && ov.imageZoom !== 1 ? `scale(${ov.imageZoom})` : undefined,
              transformOrigin: "center",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background: `linear-gradient(175deg, ${withAlpha(
                "#05060a",
                template.scrim * 0.85,
              )} 0%, ${withAlpha("#05060a", template.scrim)} 55%, ${withAlpha(
                "#05060a",
                Math.min(0.92, template.scrim + 0.2),
              )} 100%)`,
            }}
          />
        </>
      ) : null}

      {/* Accent top band */}
      {showBands ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: m.bandTop,
            background: palette.accent,
            zIndex: 3,
          }}
        />
      ) : null}


      {/* Framed border for the frame template */}
      {template.background === "frame" && !hasPhoto ? (
        <div
          style={{
            position: "absolute",
            inset: m.pad * 0.42,
            border: `${Math.max(2, m.unit * 3)}px solid ${withAlpha(palette.accent, 0.55)}`,
            borderRadius: m.radius,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* Header */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${m.pad * 0.62}px ${m.pad}px 0`,
          gap: m.gap,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: m.gap * 0.5, minWidth: 0 }}>
          {showBrandBar && logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: m.logo,
                height: m.logo,
                borderRadius: m.logo / 4,
                objectFit: "cover",
                background: withAlpha(palette.text, 0.08),
              }}
            />
          ) : null}
          {showBrandBar ? (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: ts.meta,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {brandName}
              </div>
              <div style={{ fontSize: ts.meta * 0.82, color: palette.subtle, whiteSpace: "nowrap" }}>
                {handle}
              </div>
            </div>
          ) : null}
        </div>
        {showCounter ? (
          <div
            style={{
              fontSize: ts.meta * 0.9,
              fontWeight: 600,
              color: palette.subtle,
              padding: `${m.unit * 8}px ${m.unit * 18}px`,
              borderRadius: 999,
              border: `${Math.max(1, m.unit * 1.5)}px solid ${withAlpha(palette.text, 0.18)}`,
              whiteSpace: "nowrap",
            }}
          >
            {index + 1} / {total}
          </div>
        ) : null}
      </div>

      {/* Content zone — flex-driven so nothing can ever overflow a band */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: justify,
          alignItems: center ? "center" : "flex-start",
          textAlign: center ? "center" : "left",
          padding: `${m.pad * 0.7}px ${m.pad}px ${m.pad * 0.7}px`,
          gap: m.gap * 0.75,
        }}
      >
        <div
          style={
            template.card
              ? {
                  background: withAlpha(palette.text === "#ffffff" ? "#ffffff" : "#0b0b12", 0.08),
                  border: `${Math.max(1, m.unit * 1.5)}px solid ${withAlpha(palette.text, 0.16)}`,
                  borderRadius: m.radius,
                  padding: m.pad * 0.62,
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: m.gap * 0.7,
                  alignItems: center ? "center" : "flex-start",
                  width: "100%",
                }
              : {
                  display: "flex",
                  flexDirection: "column",
                  gap: m.gap * 0.7,
                  alignItems: center ? "center" : "flex-start",
                  width: "100%",
                }
          }
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: m.unit * 12,
              alignItems: center ? "center" : "flex-start",
            }}
          >
            <span
              style={{
                fontSize: ts.label,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: template.uppercaseLabel ? "uppercase" : "none",
                color: palette.accent,
              }}
            >
              {label}
            </span>
            {template.rule ? (
              <span
                style={{
                  display: "block",
                  width: m.unit * 88,
                  height: Math.max(2, m.unit * 3),
                  background: palette.accent,
                  borderRadius: 999,
                }}
              />
            ) : null}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontFamily: `'${font.heading}', Georgia, serif`,
              fontWeight: font.headingWeight,
              fontSize: ts.title,
              lineHeight: ts.titleLeading,
              letterSpacing: `${font.tracking}em`,
              color: palette.text,
              overflowWrap: "anywhere",
            }}
          >
            {slide.title}
          </h2>

          {/* Body */}
          {slide.body ? (
            <p
              style={{
                margin: 0,
                fontSize: ts.body,
                lineHeight: ts.bodyLeading,
                color: palette.subtle,
                maxWidth: center ? "88%" : "94%",
                overflowWrap: "anywhere",
              }}
            >
              {slide.body}
            </p>
          ) : null}

          {/* Bullets */}
          {bullets.length ? (
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: m.unit * 16,
                width: "100%",
              }}
            >
              {bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: m.unit * 16,
                    alignItems: "flex-start",
                    justifyContent: center ? "center" : "flex-start",
                    fontSize: ts.bullet,
                    lineHeight: 1.35,
                    color: palette.text,
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 auto",
                      marginTop: ts.bullet * 0.42,
                      width: m.unit * 12,
                      height: m.unit * 12,
                      borderRadius: 999,
                      background: palette.accent,
                    }}
                  />
                  <span style={{ overflowWrap: "anywhere" }}>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${m.pad}px ${m.pad * 0.62}px`,
          fontSize: ts.meta * 0.86,
          color: palette.subtle,
          gap: m.gap,
        }}
      >
        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {slide.imageCredit || (index === 0 ? handle : "")}
        </span>
        {showSwipeHint && index < total - 1 ? (
          <span style={{ fontWeight: 700, color: palette.accent, whiteSpace: "nowrap" }}>
            Swipe →
          </span>
        ) : null}
      </div>

      {/* Watermark */}
      {watermark?.on && watermark.text.trim() ? (
        <span
          style={{
            position: "absolute",
            zIndex: 6,
            opacity: watermark.opacity / 100,
            fontSize: ts.meta,
            fontWeight: 700,
            color: palette.text,
            ...watermarkPosition(watermark.placement, m.pad * 0.5),
          }}
        >
          {watermark.text.trim()}
        </span>
      ) : null}

      {/* Accent bottom band */}
      {showBands ? (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: Math.round(m.bandTop * 0.7),
            background: palette.accent,
            zIndex: 3,
          }}
        />
      ) : null}

    </div>
  );
});

function watermarkPosition(placement: string, pad: number) {
  switch (placement) {
    case "top-left":
      return { top: pad, left: pad };
    case "top-right":
      return { top: pad, right: pad };
    case "bottom-left":
      return { bottom: pad, left: pad };
    case "center":
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    default:
      return { bottom: pad, right: pad };
  }
}
