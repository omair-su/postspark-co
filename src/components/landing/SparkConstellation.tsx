import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import heroSculpture from "@/assets/hero-ceramic-ring.png";

/**
 * Spark Constellation — premium WebGL centerpiece.
 * Renders inside the existing hero container; transparent canvas so the
 * cream background shows through. Falls back to the static sculpture
 * image on mobile / low-power devices via <Suspense> + capability check.
 */

const PURPLE = new THREE.Color("#7c3aed");
const PURPLE_LIGHT = new THREE.Color("#A78BFA");
const GOLD = new THREE.Color("#C9A87C");
const WHITE = new THREE.Color("#ffffff");

function Core() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    m.rotation.y += 0.003;
    // pulsing 0.97 ↔ 1.03 over 4s
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin((t / 4) * Math.PI * 2) * 0.03;
    m.scale.setScalar(s);
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.6, 64, 64]} />
      <meshStandardMaterial
        color={PURPLE}
        emissive={PURPLE}
        emissiveIntensity={1.6}
        roughness={0.25}
        metalness={0.4}
      />
    </mesh>
  );
}

/** Möbius/figure-8 ribbon wrapping the core. */
function Ribbon() {
  const ref = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    class MobiusCurve extends THREE.Curve<THREE.Vector3> {
      getPoint(t: number, target = new THREE.Vector3()) {
        const u = t * Math.PI * 2;
        const R = 1.05;
        const x = R * Math.sin(u);
        const y = R * Math.sin(u) * Math.cos(u) * 0.9;
        const z = R * Math.cos(u) * 0.85;
        return target.set(x, y, z);
      }
    }
    const curve = new MobiusCurve();
    return new THREE.TubeGeometry(curve, 400, 0.045, 16, true);
  }, []);

  // vertex-color gradient purple → gold along the tube
  const material = useMemo(() => {
    const colors: number[] = [];
    const pos = geometry.attributes.position;
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = (i / pos.count);
      const mix = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      tmp.copy(PURPLE).lerp(GOLD, mix);
      colors.push(tmp.r, tmp.g, tmp.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      emissive: new THREE.Color("#8b5cf6"),
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.8,
    });
  }, [geometry]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y -= 0.002; // opposite to core
      ref.current.rotation.x += 0.0007;
    }
  });

  return <mesh ref={ref} geometry={geometry} material={material} />;
}

type Particle = {
  radius: number;
  speed: number;
  phase: number;
  inclination: number;
  size: number;
  color: THREE.Color;
};

function Particles() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 80;

  const particles = useMemo<Particle[]>(() => {
    const palette = [PURPLE, PURPLE_LIGHT, GOLD, WHITE];
    const inclinations = [0, Math.PI / 4, Math.PI / 2];
    return new Array(COUNT).fill(0).map((_, i) => ({
      radius: 1.15 + Math.random() * 0.55,
      speed: 0.15 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      inclination: inclinations[i % 3],
      size: 0.02 + Math.random() * 0.04,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));
  }, []);

  // assign per-instance colors once
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    particles.forEach((p, i) => m.setColorAt(i, p.color));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [particles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const a = p.phase + t * p.speed;
      const x = Math.cos(a) * p.radius;
      const yFlat = Math.sin(a) * p.radius;
      // tilt orbit by inclination around X axis
      const y = yFlat * Math.cos(p.inclination);
      const z = yFlat * Math.sin(p.inclination);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.size * 18); // sphere geo radius 1 → scale to size
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial
          emissive={WHITE}
          emissiveIntensity={2.2}
          toneMapped={false}
          vertexColors={false}
        />
      </instancedMesh>
    </group>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const MAX = (12 * Math.PI) / 180; // 12 deg
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
    current.current.x += (target.current.x - current.current.x) * 0.05;
    current.current.y += (target.current.y - current.current.y) * 0.05;
    g.rotation.x = current.current.x;
    g.rotation.y = current.current.y;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 3, 4]} intensity={1.6} color={PURPLE_LIGHT} />
      <pointLight position={[-3, -2, 3]} intensity={1.2} color={GOLD} />
      <pointLight position={[0, 0, 0]} intensity={2.2} color={PURPLE} distance={3} />

      <group ref={groupRef}>
        <Core />
        <Ribbon />
        <Particles />
      </group>

      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.3} luminanceSmoothing={0.6} mipmapBlur />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0008, 0.0012)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  );
}

function StaticFallback() {
  return (
    <img
      src={heroSculpture}
      alt=""
      className="h-full w-full object-contain animate-[heroSpin_42s_linear_infinite]"
      style={{
        filter:
          "drop-shadow(0 40px 80px rgba(124,58,237,0.30)) drop-shadow(0 20px 40px rgba(232,93,58,0.18)) saturate(1.08) contrast(1.03)",
      }}
    />
  );
}

export default function SparkConstellation() {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lowPower =
      window.matchMedia?.("(max-width: 640px)").matches ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      (navigator as any).hardwareConcurrency < 4;
    // Quick WebGL feature check
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setCanRender3D(webgl && !lowPower);
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
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
