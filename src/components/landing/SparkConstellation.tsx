import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import premiumCoreImage from "@/assets/postspark-luxury-ai-core.png";

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
const NAVY = new THREE.Color("#1a1a2e");

type Variant = "tweet" | "linkedin" | "email" | "youtube" | "thumbnail" | "agent" | "image";

/* ---------- Central AI Core ---------- */
function AICore({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const videoDisc = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const [coreTexture, setCoreTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(premiumCoreImage, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.minFilter = THREE.LinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      loaded.generateMipmaps = !mobile;
      if (mounted) setCoreTexture(loaded);
    });
    return () => {
      mounted = false;
      texture.dispose();
    };
  }, [mobile]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y += 0.003;
      group.current.scale.setScalar(1 + Math.sin((t / 4) * Math.PI * 2) * 0.03);
    }
    if (videoDisc.current) {
      videoDisc.current.rotation.z = Math.sin(t * 0.22) * 0.035;
    }
    if (shell.current) {
      shell.current.rotation.y -= 0.0012;
      shell.current.rotation.x += 0.0008;
    }
    if (halo.current) {
      const s = 1 + Math.sin(t * 0.6) * 0.04;
      halo.current.scale.setScalar(s);
    }
  });

  const seg = mobile ? 32 : 64;

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.62, seg, seg]} />
        <meshStandardMaterial
          color={NAVY}
          emissive={PURPLE}
          emissiveIntensity={1.05}
          roughness={0.32}
          metalness={0.45}
          transparent
          opacity={0.32}
        />
      </mesh>

      <mesh ref={videoDisc} position={[0, 0, 0.18]}>
        <circleGeometry args={[0.64, mobile ? 48 : 96]} />
        <meshBasicMaterial
          map={coreTexture ?? undefined}
          color={coreTexture ? "#ffffff" : "#7c3aed"}
          transparent
          opacity={coreTexture ? 0.96 : 0.42}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.205]}>
        <circleGeometry args={[0.68, mobile ? 48 : 96]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Glass shell — physical material is heavy; on mobile use a cheaper
          standard material with low opacity so we keep the look without the cost. */}
      <mesh ref={shell}>
        <sphereGeometry args={[0.83, seg, seg]} />
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
        <sphereGeometry args={[1.1, mobile ? 20 : 32, mobile ? 20 : 32]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.075} side={THREE.BackSide} />
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
      drawMiniTweet(ctx, scale, w, h, accent, bodyY);
    } else if (variant === "linkedin") {
      drawLinkedInPost(ctx, scale, w, h, accent, bodyY);
    } else if (variant === "email") {
      drawEmailCampaign(ctx, scale, w, h, accent, bodyY);
    } else if (variant === "youtube") {
      drawYouTubeCard(ctx, scale, w, h, bodyY);
    } else if (variant === "thumbnail") {
      drawThumbnailCard(ctx, scale, w, h, accent, bodyY);
    } else if (variant === "agent") {
      drawAgentCard(ctx, scale, w, h, accent, bodyY);
    } else if (variant === "image") {
      drawAIImageCard(ctx, scale, w, h, bodyY);
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
      { variant: "linkedin", title: "LinkedIn post", accent: "#a78bfa" },
      { variant: "tweet", title: "X thread", accent: "#7c3aed" },
      { variant: "email", title: "Email sequence", accent: "#a78bfa" },
      { variant: "youtube", title: "YouTube script", accent: "#7c3aed" },
      { variant: "thumbnail", title: "Thumbnail", accent: "#a78bfa" },
      { variant: "agent", title: "AI agent", accent: "#7c3aed" },
      { variant: "image", title: "AI image", accent: "#a78bfa" },
    ];
    return defs.map((d, i) => ({
      variant: d.variant,
      label: d.title,
      accent: new THREE.Color(d.accent),
      radius: 1.34 + (i % 2) * 0.22,
      inclination: (i / defs.length) * Math.PI * 2,
      phase: (i / defs.length) * Math.PI * 2,
      speed: 0.06 + (i % 3) * 0.015,
      width: mobile ? 0.78 : 0.86,
      height: mobile ? 0.49 : 0.54,
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

      <group ref={groupRef} position={[mobile ? 0 : 0.28, 0, 0]} scale={mobile ? 0.88 : 0.92}>
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

function drawTextLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = "rgba(233,228,255,0.86)", weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.fillText(text, x, y);
}

function drawPhotoPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, tone: "kitchen" | "portrait" | "studio") {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  if (tone === "kitchen") {
    g.addColorStop(0, "#f5dcc1");
    g.addColorStop(0.45, "#8f6a4f");
    g.addColorStop(1, "#2b2440");
  } else if (tone === "portrait") {
    g.addColorStop(0, "#251a3d");
    g.addColorStop(0.55, "#7c3aed");
    g.addColorStop(1, "#e9e4ff");
  } else {
    g.addColorStop(0, "#1a1a2e");
    g.addColorStop(0.5, "#7c3aed");
    g.addColorStop(1, "#a78bfa");
  }
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(x + w * 0.76, y + h * 0.28, h * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(26,26,46,0.34)";
  roundRect(ctx, x + w * 0.08, y + h * 0.62, w * 0.84, h * 0.16, 8);
  ctx.fill();
}

function drawMiniTweet(ctx: CanvasRenderingContext2D, scale: number, w: number, h: number, accent: string, bodyY: number) {
  drawTextLine(ctx, "One blog became 11 high-signal", 40 * scale, bodyY + 6 * scale, 15 * scale);
  drawTextLine(ctx, "tweets in our founder voice.", 40 * scale, bodyY + 30 * scale, 15 * scale);
  drawPhotoPanel(ctx, 40 * scale, bodyY + 50 * scale, 155 * scale, 72 * scale, 14 * scale, "studio");
  ctx.fillStyle = accent;
  roundRect(ctx, 215 * scale, bodyY + 58 * scale, 118 * scale, 26 * scale, 13 * scale);
  ctx.fill();
  drawTextLine(ctx, "Hook score 94%", 229 * scale, bodyY + 76 * scale, 12 * scale, "#fff", 700);
  drawTextLine(ctx, "♡ 2.4k   ↻ 618   💬 142", 40 * scale, h - 28 * scale, 13 * scale, "rgba(167,139,250,0.72)", 700);
}

function drawLinkedInPost(ctx: CanvasRenderingContext2D, scale: number, w: number, h: number, accent: string, bodyY: number) {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(48 * scale, bodyY + 2 * scale, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
  drawTextLine(ctx, "A single webinar can power", 76 * scale, bodyY - 2 * scale, 15 * scale);
  drawTextLine(ctx, "your entire week of content.", 76 * scale, bodyY + 22 * scale, 15 * scale);
  [0, 1, 2].forEach((i) => {
    ctx.fillStyle = i === 0 ? accent : "rgba(233,228,255,0.18)";
    roundRect(ctx, 40 * scale, bodyY + (54 + i * 28) * scale, (350 - i * 38) * scale, 14 * scale, 7 * scale);
    ctx.fill();
  });
  drawTextLine(ctx, "#AIContent  #B2BMarketing", 40 * scale, h - 28 * scale, 13 * scale, accent, 800);
}

function drawEmailCampaign(ctx: CanvasRenderingContext2D, scale: number, _w: number, h: number, accent: string, bodyY: number) {
  drawTextLine(ctx, "Subject: 5 kitchen design ideas", 40 * scale, bodyY + 2 * scale, 17 * scale, "#ffffff", 800);
  drawTextLine(ctx, "A polished newsletter drafted", 40 * scale, bodyY + 32 * scale, 14 * scale);
  drawTextLine(ctx, "from your video in seconds.", 40 * scale, bodyY + 54 * scale, 14 * scale);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 40 * scale, bodyY + 78 * scale, 240 * scale, 34 * scale, 17 * scale);
  ctx.fill();
  drawTextLine(ctx, "Open rate prediction 41%", 58 * scale, bodyY + 100 * scale, 13 * scale, accent, 800);
  ctx.fillStyle = accent;
  roundRect(ctx, 318 * scale, h - 62 * scale, 120 * scale, 30 * scale, 15 * scale);
  ctx.fill();
  drawTextLine(ctx, "Send draft", 342 * scale, h - 42 * scale, 12 * scale, "#fff", 800);
}

function drawYouTubeCard(ctx: CanvasRenderingContext2D, scale: number, w: number, h: number, bodyY: number) {
  drawPhotoPanel(ctx, 40 * scale, bodyY - 2 * scale, (w - 80 * scale), 120 * scale, 18 * scale, "kitchen");
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.beginPath();
  ctx.arc(w / 2, bodyY + 58 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7c3aed";
  ctx.beginPath();
  ctx.moveTo(w / 2 - 7 * scale, bodyY + 46 * scale);
  ctx.lineTo(w / 2 - 7 * scale, bodyY + 70 * scale);
  ctx.lineTo(w / 2 + 13 * scale, bodyY + 58 * scale);
  ctx.closePath();
  ctx.fill();
  drawTextLine(ctx, "Hook • Outline • CTA", 40 * scale, h - 28 * scale, 13 * scale, "rgba(233,228,255,0.78)", 700);
}

function drawThumbnailCard(ctx: CanvasRenderingContext2D, scale: number, w: number, h: number, accent: string, bodyY: number) {
  drawPhotoPanel(ctx, 34 * scale, bodyY - 8 * scale, (w - 68 * scale), 132 * scale, 18 * scale, "kitchen");
  drawTextLine(ctx, "OPEN KITCHEN", 58 * scale, bodyY + 44 * scale, 25 * scale, "#ffffff", 900);
  drawTextLine(ctx, "IDEAS", 58 * scale, bodyY + 74 * scale, 28 * scale, accent, 900);
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  roundRect(ctx, w - 105 * scale, h - 76 * scale, 58 * scale, 24 * scale, 7 * scale);
  ctx.fill();
  drawTextLine(ctx, "8:03", w - 88 * scale, h - 59 * scale, 12 * scale, "#fff", 800);
}

function drawAgentCard(ctx: CanvasRenderingContext2D, scale: number, w: number, h: number, accent: string, bodyY: number) {
  drawPhotoPanel(ctx, 40 * scale, bodyY - 4 * scale, 128 * scale, 128 * scale, 64 * scale, "portrait");
  drawTextLine(ctx, "AI strategist", 192 * scale, bodyY + 18 * scale, 18 * scale, "#ffffff", 800);
  drawTextLine(ctx, "Turn this video into", 192 * scale, bodyY + 50 * scale, 14 * scale);
  drawTextLine(ctx, "a 7-day campaign.", 192 * scale, bodyY + 72 * scale, 14 * scale);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, 192 * scale, bodyY + 94 * scale, 190 * scale, 28 * scale, 14 * scale);
  ctx.fill();
  drawTextLine(ctx, "Generated 24 assets", 210 * scale, bodyY + 113 * scale, 12 * scale, accent, 800);
  drawTextLine(ctx, "Agent workflow", 40 * scale, h - 28 * scale, 13 * scale, "rgba(233,228,255,0.68)", 700);
}

function drawAIImageCard(ctx: CanvasRenderingContext2D, scale: number, w: number, h: number, bodyY: number) {
  drawPhotoPanel(ctx, 40 * scale, bodyY - 2 * scale, w - 80 * scale, 126 * scale, 18 * scale, "kitchen");
  drawTextLine(ctx, "Generated image", 54 * scale, h - 54 * scale, 14 * scale, "#ffffff", 800);
  drawTextLine(ctx, "Brand-safe visual variation", 54 * scale, h - 30 * scale, 12 * scale, "rgba(233,228,255,0.7)", 600);
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
    variant === "youtube" ? "▶" :
    variant === "thumbnail" ? "▣" :
    variant === "agent" ? "AI" : "✦";
  ctx.fillText(ch, x, y + 1);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function StaticFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        aria-hidden
        className="absolute h-[72%] w-[72%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.36), rgba(167,139,250,0.16) 45%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
      <img
        src={premiumCoreImage}
        alt=""
        loading="lazy"
        decoding="async"
        className="relative h-[56%] max-h-[430px] aspect-square rounded-full object-cover"
        style={{
          border: "1px solid rgba(167,139,250,0.45)",
          boxShadow:
            "0 44px 90px rgba(124,58,237,0.28), inset 0 0 38px rgba(255,255,255,0.22)",
        }}
      />
      <div className="absolute right-[14%] top-[18%] rounded-2xl border border-[#a78bfa]/30 bg-[#1a1a2e]/90 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e9e4ff] shadow-[0_20px_70px_rgba(124,58,237,0.2)]">
        LinkedIn · X · Email
      </div>
      <div className="absolute bottom-[20%] left-[12%] rounded-2xl border border-[#a78bfa]/30 bg-[#1a1a2e]/90 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e9e4ff] shadow-[0_20px_70px_rgba(124,58,237,0.2)]">
        YouTube · Thumbnail · AI
      </div>
    </div>
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
    const mobile = window.matchMedia?.("(max-width: 768px)").matches;
    const lowPower = mobile && (cores <= 2 || mem <= 2);

    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setIsMobile(mobile);
    setCanRender3D(webgl && !reduced && !lowPower);
    setInView(webgl && !reduced && !lowPower);
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
