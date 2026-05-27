import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import heroSculpture from "@/assets/hero-ceramic-ring.png";

/**
 * Spark Constellation — luxury cinematic AI core.
 *
 * Central glowing AI intelligence sphere surrounded by floating glassmorphic
 * "content artifact" cards reflecting the actual PostSpark output formats:
 * Tweets, LinkedIn posts, Email newsletter, Video script/thumbnail, Carousel,
 * AI image.
 *
 * Palette: deep navy #1a1a2e + electric purple #7c3aed + soft violet glows.
 *
 * Perf:
 * - Lazy mount via IntersectionObserver (Canvas only mounts when hero scrolls
 *   near viewport).
 * - Mobile path uses smaller textures, fewer particles, lower DPR, no bloom.
 * - Reduced-motion / low-power → static image fallback.
 */

const PURPLE = new THREE.Color("#7c3aed");
const VIOLET = new THREE.Color("#a78bfa");
const SOFT_WHITE = new THREE.Color("#e9e4ff");

type Variant = "tweet" | "linkedin" | "email" | "video" | "carousel" | "image";

/* ---------- Central AI Core ---------- */
function AICore({ mobile }: { mobile: boolean }) {
  const inner = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (inner.current) {
      inner.current.rotation.y += 0.003;
      const s = 1 + Math.sin((t / 4) * Math.PI * 2) * 0.03;
      inner.current.scale.setScalar(s);
    }
    if (shell.current) {
      shell.current.rotation.y -= 0.0015;
      shell.current.rotation.x += 0.0008;
    }
    if (halo.current) {
      const s = 1 + Math.sin(t * 0.6) * 0.04;
      halo.current.scale.setScalar(s);
    }
  });

  const seg = mobile ? 32 : 64;

  return (
    <group>
      <mesh ref={inner}>
        <sphereGeometry args={[0.55, seg, seg]} />
        <meshStandardMaterial
          color={PURPLE}
          emissive={PURPLE}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Glass shell — physical material is heavy; on mobile use a cheaper
          standard material with low opacity so we keep the look without the cost. */}
      <mesh ref={shell}>
        <sphereGeometry args={[0.78, seg, seg]} />
        {mobile ? (
          <meshStandardMaterial
            color={VIOLET}
            emissive={PURPLE}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.2}
            transparent
            opacity={0.28}
          />
        ) : (
          <meshPhysicalMaterial
            color={VIOLET}
            emissive={PURPLE}
            emissiveIntensity={0.35}
            roughness={0.15}
            metalness={0.1}
            transmission={0.85}
            thickness={0.4}
            transparent
            opacity={0.35}
            ior={1.4}
          />
        )}
      </mesh>

      <mesh ref={halo}>
        <sphereGeometry args={[1.05, mobile ? 20 : 32, mobile ? 20 : 32]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/* ---------- Floating content-artifact cards ---------- */

type Card = {
  variant: Variant;
  label: string;
  accent: THREE.Color;
  radius: number;
  inclination: number;
  phase: number;
  speed: number;
  width: number;
  height: number;
};

function ArtifactCards({ mobile }: { mobile: boolean }) {
  const TEX_W = mobile ? 320 : 512;
  const TEX_H = mobile ? 200 : 320;

  const makeCardTexture = (
    title: string,
    accent: string,
    variant: Variant
  ) => {
    const w = TEX_W;
    const h = TEX_H;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const scale = w / 512;

    // Glass navy background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "rgba(26,26,46,0.94)");
    bg.addColorStop(1, "rgba(40,30,70,0.94)");
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, w, h, 28 * scale);
    ctx.fill();

    ctx.strokeStyle = "rgba(167,139,250,0.4)";
    ctx.lineWidth = 2;
    roundRect(ctx, 2, 2, w - 4, h - 4, 26 * scale);
    ctx.stroke();

    // Header: brand glyph
    drawBrandGlyph(ctx, variant, 36 * scale, 42 * scale, 14 * scale, accent);

    ctx.fillStyle = "#e9e4ff";
    ctx.font = `600 ${22 * scale}px Inter, system-ui, sans-serif`;
    ctx.fillText(title, 64 * scale, 50 * scale);

    ctx.fillStyle = "rgba(233,228,255,0.5)";
    ctx.font = `500 ${14 * scale}px Inter, system-ui, sans-serif`;
    ctx.fillText("PostSpark · just now", 64 * scale, 72 * scale);

    const bodyY = 110 * scale;

    if (variant === "tweet") {
      // 3 short lines like a tweet
      ctx.fillStyle = "rgba(233,228,255,0.85)";
      [w - 100, w - 140, w - 220].forEach((lw, i) => {
        roundRect(ctx, 40 * scale, bodyY + i * 28 * scale, lw - 40 * scale, 14 * scale, 7);
        ctx.fill();
      });
      // engagement row
      ctx.fillStyle = "rgba(167,139,250,0.6)";
      ["♥ 1.2k", "↻ 340", "💬 88"].forEach((t, i) => {
        ctx.font = `500 ${13 * scale}px Inter, sans-serif`;
        ctx.fillText(t, (40 + i * 90) * scale, h - 28 * scale);
      });
    } else if (variant === "linkedin") {
      // longer paragraph block
      ctx.fillStyle = "rgba(233,228,255,0.82)";
      for (let i = 0; i < 5; i++) {
        const lw = w - 80 * scale - (i === 4 ? 140 * scale : 0);
        roundRect(ctx, 40 * scale, bodyY + i * 26 * scale, lw, 12 * scale, 6);
        ctx.fill();
      }
      ctx.fillStyle = accent;
      ctx.font = `600 ${12 * scale}px Inter, sans-serif`;
      ctx.fillText("#AI  #Content  #Growth", 40 * scale, h - 24 * scale);
    } else if (variant === "email") {
      // Subject line + preview
      ctx.fillStyle = "rgba(233,228,255,0.95)";
      ctx.font = `700 ${18 * scale}px Inter, sans-serif`;
      ctx.fillText("Weekly Spark ✦", 40 * scale, bodyY + 4 * scale);
      ctx.fillStyle = "rgba(233,228,255,0.65)";
      ctx.font = `500 ${13 * scale}px Inter, sans-serif`;
      ctx.fillText("5 ideas that will change how you", 40 * scale, bodyY + 28 * scale);
      ctx.fillText("repurpose content this week →", 40 * scale, bodyY + 48 * scale);
      // CTA pill
      const ctaY = h - 60 * scale;
      ctx.fillStyle = accent;
      roundRect(ctx, 40 * scale, ctaY, 130 * scale, 32 * scale, 16);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${12 * scale}px Inter, sans-serif`;
      ctx.fillText("Read newsletter", 56 * scale, ctaY + 20 * scale);
    } else if (variant === "video") {
      // Thumbnail with play triangle + duration chip
      const g = ctx.createLinearGradient(40 * scale, bodyY, w - 40 * scale, h - 50 * scale);
      g.addColorStop(0, "#4c1d95");
      g.addColorStop(1, "#7c3aed");
      ctx.fillStyle = g;
      roundRect(ctx, 40 * scale, bodyY, w - 80 * scale, h - 160 * scale, 14);
      ctx.fill();
      // play button
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      const cx = w / 2;
      const cy = bodyY + (h - 160 * scale) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PURPLE.getStyle();
      ctx.beginPath();
      ctx.moveTo(cx - 7 * scale, cy - 10 * scale);
      ctx.lineTo(cx - 7 * scale, cy + 10 * scale);
      ctx.lineTo(cx + 11 * scale, cy);
      ctx.closePath();
      ctx.fill();
      // duration chip
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      roundRect(ctx, w - 90 * scale, h - 80 * scale, 50 * scale, 22 * scale, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${12 * scale}px Inter, sans-serif`;
      ctx.fillText("0:42", w - 78 * scale, h - 64 * scale);
    } else if (variant === "carousel") {
      for (let i = 0; i < 3; i++) {
        const x = (40 + i * 150) * scale;
        ctx.fillStyle = i === 0 ? accent : "rgba(167,139,250,0.28)";
        roundRect(ctx, x, bodyY, 130 * scale, (h - 170 * scale), 14);
        ctx.fill();
      }
      // page dots
      const dotsY = h - 28 * scale;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? accent : "rgba(167,139,250,0.4)";
        ctx.beginPath();
        ctx.arc((w / 2 - 16 * scale) + i * 16 * scale, dotsY, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (variant === "image") {
      const g = ctx.createLinearGradient(40 * scale, bodyY, w - 40 * scale, h - 50 * scale);
      g.addColorStop(0, "#7c3aed");
      g.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = g;
      roundRect(ctx, 40 * scale, bodyY, w - 80 * scale, h - 160 * scale, 18);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(w - 110 * scale, bodyY + 50 * scale, 28 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = mobile ? 2 : 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = !mobile;
    tex.minFilter = mobile ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
    return tex;
  };

  const cards = useMemo<(Card & { texture: THREE.Texture })[]>(() => {
    const defs: { variant: Variant; title: string; accent: string }[] = [
      { variant: "tweet", title: "Tweet thread", accent: "#7c3aed" },
      { variant: "linkedin", title: "LinkedIn post", accent: "#a78bfa" },
      { variant: "email", title: "Email newsletter", accent: "#7c3aed" },
      { variant: "video", title: "Video script", accent: "#a78bfa" },
      { variant: "carousel", title: "Carousel", accent: "#7c3aed" },
      { variant: "image", title: "AI image", accent: "#a78bfa" },
    ];
    return defs.map((d, i) => ({
      variant: d.variant,
      label: d.title,
      accent: new THREE.Color(d.accent),
      radius: 1.85 + (i % 2) * 0.35,
      inclination: (i / defs.length) * Math.PI * 2,
      phase: (i / defs.length) * Math.PI * 2,
      speed: 0.06 + (i % 3) * 0.015,
      width: 0.95,
      height: 0.6,
      texture: makeCardTexture(d.title, d.accent, d.variant),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile]);

  // dispose textures on unmount
  useEffect(() => {
    return () => cards.forEach((c) => c.texture.dispose());
  }, [cards]);

  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    cards.forEach((c, i) => {
      const m = refs.current[i];
      if (!m) return;
      const a = c.phase + t * c.speed;
      const x = Math.cos(a) * c.radius;
      const yFlat = Math.sin(a) * c.radius;
      const tilt = Math.sin(c.inclination) * 0.4;
      const y = yFlat * Math.cos(c.inclination) * 0.45 + Math.sin(t * 0.5 + i) * 0.06;
      const z = yFlat * tilt;
      m.position.set(x, y, z);
      m.lookAt(state.camera.position);
      m.rotation.z = Math.sin(t * 0.3 + i) * 0.05;
    });
  });

  return (
    <group>
      {cards.map((c, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <planeGeometry args={[c.width, c.height]} />
          <meshBasicMaterial
            map={c.texture}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Subtle particle streams ---------- */
function ParticleStreams({ mobile }: { mobile: boolean }) {
  const COUNT = mobile ? 24 : 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(
    () =>
      new Array(COUNT).fill(0).map(() => ({
        radius: 1.2 + Math.random() * 1.1,
        speed: 0.08 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        inclination: Math.random() * Math.PI,
        size: 0.012 + Math.random() * 0.018,
        color: Math.random() > 0.5 ? PURPLE : VIOLET,
      })),
    [COUNT]
  );

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    particles.forEach((p, i) => m.setColorAt(i, p.color));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [particles]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const a = p.phase + t * p.speed;
      const x = Math.cos(a) * p.radius;
      const yFlat = Math.sin(a) * p.radius;
      const y = yFlat * Math.cos(p.inclination);
      const z = yFlat * Math.sin(p.inclination);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.size * 14);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.05, mobile ? 6 : 10, mobile ? 6 : 10]} />
      <meshBasicMaterial color={SOFT_WHITE} transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- Scene wrapper ---------- */
function Scene({ mobile }: { mobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (mobile) return; // skip parallax listener on mobile
    const MAX = (8 * Math.PI) / 180;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current.y = nx * MAX;
      target.current.x = ny * MAX;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mobile]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    current.current.x += (target.current.x - current.current.x) * 0.04;
    current.current.y += (target.current.y - current.current.y) * 0.04;
    g.rotation.x = current.current.x;
    g.rotation.y = current.current.y;
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 4]} intensity={1.4} color={VIOLET} />
      {!mobile && <pointLight position={[-3, -2, 3]} intensity={0.9} color={PURPLE} />}
      <pointLight position={[0, 0, 0]} intensity={2} color={PURPLE} distance={4} />

      <group ref={groupRef}>
        <AICore mobile={mobile} />
        <ParticleStreams mobile={mobile} />
        <ArtifactCards mobile={mobile} />
      </group>

      {!mobile && (
        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.35} luminanceSmoothing={0.7} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

/* ---------- Helpers ---------- */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBrandGlyph(
  ctx: CanvasRenderingContext2D,
  variant: Variant,
  x: number,
  y: number,
  r: number,
  accent: string
) {
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${r * 1.2}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ch =
    variant === "tweet" ? "𝕏" :
    variant === "linkedin" ? "in" :
    variant === "email" ? "✉" :
    variant === "video" ? "▶" :
    variant === "carousel" ? "▦" : "✦";
  ctx.fillText(ch, x, y + 1);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function StaticFallback() {
  return (
    <img
      src={heroSculpture}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain animate-[heroSpin_42s_linear_infinite]"
      style={{
        filter:
          "drop-shadow(0 40px 80px rgba(124,58,237,0.35)) drop-shadow(0 20px 40px rgba(76,29,149,0.25)) saturate(1.05)",
      }}
    />
  );
}

export default function SparkConstellation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canRender3D, setCanRender3D] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [inView, setInView] = useState(false);

  // Capability detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const cores = (navigator as any).hardwareConcurrency ?? 4;
    const mem = (navigator as any).deviceMemory ?? 4;
    const lowPower = cores < 4 || mem < 4;
    const mobile = window.matchMedia?.("(max-width: 768px)").matches;

    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setIsMobile(mobile);
    setCanRender3D(webgl && !reduced && !lowPower);
  }, []);

  // Lazy-mount when hero scrolls near viewport
  useEffect(() => {
    if (!canRender3D || !containerRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const el = containerRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canRender3D]);

  if (!canRender3D) {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center">
        <StaticFallback />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {inView ? (
        <Canvas
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          frameloop="always"
          gl={{
            alpha: true,
            antialias: !isMobile,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 4.6], fov: 45 }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene mobile={isMobile} />
          </Suspense>
        </Canvas>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
