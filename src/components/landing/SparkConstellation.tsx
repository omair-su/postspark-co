import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import heroSculpture from "@/assets/hero-ceramic-ring.png";

/**
 * Spark Constellation — luxury cinematic AI core.
 *
 * Central glowing AI intelligence sphere surrounded by floating glassmorphic
 * "content artifact" cards (LinkedIn post, X thread, carousel, image preview,
 * analytics, thumbnail). Connected by subtle flowing particle streams.
 *
 * Palette: deep navy #1a1a2e + electric purple #7c3aed + soft violet glows.
 * No orange, no donut, no neon gaming aesthetic.
 */

const NAVY = new THREE.Color("#1a1a2e");
const PURPLE = new THREE.Color("#7c3aed");
const VIOLET = new THREE.Color("#a78bfa");
const SOFT_WHITE = new THREE.Color("#e9e4ff");

/* ---------- Central AI Core ---------- */
function AICore() {
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

  return (
    <group>
      {/* Inner solid glowing core */}
      <mesh ref={inner}>
        <sphereGeometry args={[0.55, 64, 64]} />
        <meshStandardMaterial
          color={PURPLE}
          emissive={PURPLE}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Translucent glass shell */}
      <mesh ref={shell}>
        <sphereGeometry args={[0.78, 64, 64]} />
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
      </mesh>

      {/* Soft outer halo */}
      <mesh ref={halo}>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial
          color={VIOLET}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/* ---------- Floating content-artifact cards ---------- */

type Card = {
  label: string;
  accent: THREE.Color;
  radius: number;
  inclination: number;
  phase: number;
  speed: number;
  width: number;
  height: number;
};

function ArtifactCards() {
  // Build a canvas texture per card type — looks like a real UI tile.
  const makeCardTexture = (
    title: string,
    lines: number,
    accent: string,
    variant: "post" | "thread" | "carousel" | "image" | "chart" | "thumb"
  ) => {
    const w = 512;
    const h = 320;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;

    // Background: glass navy gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "rgba(26,26,46,0.92)");
    bg.addColorStop(1, "rgba(40,30,70,0.92)");
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, w, h, 28);
    ctx.fill();

    // Inner border
    ctx.strokeStyle = "rgba(167,139,250,0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, 2, 2, w - 4, h - 4, 26);
    ctx.stroke();

    // Header dot + title
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(36, 42, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e9e4ff";
    ctx.font = "600 22px Inter, system-ui, sans-serif";
    ctx.fillText(title, 60, 50);

    ctx.fillStyle = "rgba(233,228,255,0.45)";
    ctx.font = "500 14px Inter, system-ui, sans-serif";
    ctx.fillText("PostSpark · just now", 60, 72);

    // Body — depends on variant
    if (variant === "post" || variant === "thread") {
      ctx.fillStyle = "rgba(233,228,255,0.85)";
      for (let i = 0; i < lines; i++) {
        const lw = w - 80 - (i === lines - 1 ? 120 : 0);
        ctx.fillStyle = "rgba(233,228,255,0.78)";
        roundRect(ctx, 40, 110 + i * 28, lw, 14, 7);
        ctx.fill();
      }
    } else if (variant === "carousel") {
      for (let i = 0; i < 3; i++) {
        const x = 40 + i * 150;
        ctx.fillStyle = i === 0 ? accent : "rgba(167,139,250,0.25)";
        roundRect(ctx, x, 110, 130, 160, 14);
        ctx.fill();
      }
    } else if (variant === "image") {
      const g = ctx.createLinearGradient(40, 110, 472, 270);
      g.addColorStop(0, "#7c3aed");
      g.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = g;
      roundRect(ctx, 40, 110, w - 80, 160, 18);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(w - 110, 160, 28, 0, Math.PI * 2);
      ctx.fill();
    } else if (variant === "chart") {
      // bars
      const bars = [60, 90, 120, 80, 140, 110, 160];
      bars.forEach((bh, i) => {
        const x = 50 + i * 60;
        const grad = ctx.createLinearGradient(0, 270 - bh, 0, 270);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, "rgba(124,58,237,0.2)");
        ctx.fillStyle = grad;
        roundRect(ctx, x, 270 - bh, 40, bh, 6);
        ctx.fill();
      });
    } else if (variant === "thumb") {
      const g = ctx.createLinearGradient(40, 110, 472, 270);
      g.addColorStop(0, "#4c1d95");
      g.addColorStop(1, "#7c3aed");
      ctx.fillStyle = g;
      roundRect(ctx, 40, 110, w - 80, 160, 18);
      ctx.fill();
      // play triangle
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 18, 165);
      ctx.lineTo(w / 2 - 18, 215);
      ctx.lineTo(w / 2 + 22, 190);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const cards = useMemo<
    (Card & { texture: THREE.Texture })[]
  >(() => {
    const defs: {
      title: string;
      v: "post" | "thread" | "carousel" | "image" | "chart" | "thumb";
      accent: string;
      lines: number;
    }[] = [
      { title: "LinkedIn post", v: "post", accent: "#7c3aed", lines: 4 },
      { title: "X thread", v: "thread", accent: "#a78bfa", lines: 3 },
      { title: "Carousel", v: "carousel", accent: "#7c3aed", lines: 0 },
      { title: "AI image", v: "image", accent: "#a78bfa", lines: 0 },
      { title: "Analytics", v: "chart", accent: "#a78bfa", lines: 0 },
      { title: "Thumbnail", v: "thumb", accent: "#7c3aed", lines: 0 },
    ];
    return defs.map((d, i) => ({
      label: d.title,
      accent: new THREE.Color(d.accent),
      radius: 1.85 + (i % 2) * 0.35,
      inclination: (i / defs.length) * Math.PI * 2,
      phase: (i / defs.length) * Math.PI * 2,
      speed: 0.06 + (i % 3) * 0.015,
      width: 0.95,
      height: 0.6,
      texture: makeCardTexture(d.title, d.lines, d.accent, d.v),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    cards.forEach((c, i) => {
      const m = refs.current[i];
      if (!m) return;
      const a = c.phase + t * c.speed;
      // orbit on tilted plane
      const x = Math.cos(a) * c.radius;
      const yFlat = Math.sin(a) * c.radius;
      const tilt = Math.sin(c.inclination) * 0.4;
      const y = yFlat * Math.cos(c.inclination) * 0.45 + Math.sin(t * 0.5 + i) * 0.06;
      const z = yFlat * tilt;
      m.position.set(x, y, z);
      // always face camera-ish — gentle billboarding with subtle tilt
      m.lookAt(state.camera.position);
      m.rotation.z = Math.sin(t * 0.3 + i) * 0.05;
    });
  });

  return (
    <group>
      {cards.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
        >
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

/* ---------- Subtle connecting particle streams ---------- */
function ParticleStreams() {
  const COUNT = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(
    () =>
      new Array(COUNT).fill(0).map((_, i) => ({
        radius: 1.2 + Math.random() * 1.1,
        speed: 0.08 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        inclination: Math.random() * Math.PI,
        size: 0.012 + Math.random() * 0.018,
        color: Math.random() > 0.5 ? PURPLE : VIOLET,
      })),
    []
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
      <sphereGeometry args={[0.05, 10, 10]} />
      <meshBasicMaterial
        color={SOFT_WHITE}
        transparent
        opacity={0.7}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ---------- Scene wrapper w/ cursor parallax ---------- */
function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const MAX = (8 * Math.PI) / 180; // subtle 8°
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current.y = nx * MAX;
      target.current.x = ny * MAX;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

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
      <pointLight position={[-3, -2, 3]} intensity={0.9} color={PURPLE} />
      <pointLight position={[0, 0, 0]} intensity={2} color={PURPLE} distance={4} />

      <group ref={groupRef}>
        <AICore />
        <ParticleStreams />
        <ArtifactCards />
      </group>

      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.35} luminanceSmoothing={0.7} mipmapBlur />
      </EffectComposer>
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

function StaticFallback() {
  return (
    <img
      src={heroSculpture}
      alt=""
      className="h-full w-full object-contain animate-[heroSpin_42s_linear_infinite]"
      style={{
        filter:
          "drop-shadow(0 40px 80px rgba(124,58,237,0.35)) drop-shadow(0 20px 40px rgba(76,29,149,0.25)) saturate(1.05)",
      }}
    />
  );
}

export default function SparkConstellation() {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lowCores = ((navigator as any).hardwareConcurrency ?? 4) < 2;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setCanRender3D(webgl && !reduced && !lowCores);
  }, []);

  if (!canRender3D) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <StaticFallback />
      </div>
    );
  }

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.6], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
