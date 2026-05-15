import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  Sphere,
  Environment,
  Stars,
  PerspectiveCamera,
} from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

function HoloOrb() {
  const ref = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useMemo(() => {
    if (typeof window === "undefined") return;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.0025;
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      mouse.current.y * 0.35,
      0.05
    );
    ref.current.position.x = THREE.MathUtils.lerp(
      ref.current.position.x,
      mouse.current.x * 0.4,
      0.05
    );
    const t = state.clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.04);
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <Sphere ref={ref} args={[1.35, 128, 128]}>
        <MeshDistortMaterial
          color="#a78bfa"
          roughness={0.05}
          metalness={1}
          distort={0.42}
          speed={1.6}
          envMapIntensity={1.4}
        />
      </Sphere>
    </Float>
  );
}

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const r = 4 + Math.random() * 6;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i * 3 + 2] = r * Math.cos(p);
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#c4b5fd"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4.2]} fov={45} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2.2} color="#a78bfa" />
      <pointLight position={[-5, -3, -2]} intensity={1.6} color="#22d3ee" />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <HoloOrb />
        <ParticleField />
        <Stars radius={50} depth={40} count={2200} factor={3} fade speed={0.5} />
      </Suspense>
      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.15} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration
          offset={[0.0008, 0.0012] as unknown as [number, number]}
          radialModulation={false}
          modulationOffset={0}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

export function LuxuryHero() {
  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-[#06060f]">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#06060f"]} />
          <Scene />
        </Canvas>
      </div>

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(6,6,15,0.85) 100%)",
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Copy overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-violet-300" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/80">
            AI Content Repurposing · v3
          </span>
        </div>

        <h1
          className="max-w-5xl font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-[8rem]"
          style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', serif" }}
        >
          One idea.
          <br />
          <span
            className="italic"
            style={{
              background:
                "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 35%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Thirty masterpieces.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-base text-white/70 sm:text-lg">
          PostSpark turns a single blog, video, or PDF into a month of on-brand
          posts — engineered with luxury-grade AI in seconds.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all hover:scale-[1.03] hover:shadow-[0_20px_60px_-15px_rgba(167,139,250,0.7)]"
          >
            Start free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
          >
            See pricing
          </Link>
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-white/40">
          No credit card · 10 free repurposes / month
        </p>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/40">
        <div className="flex flex-col items-center gap-2">
          <span>Scroll</span>
          <div className="h-10 w-px animate-pulse bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </div>
    </section>
  );
}
