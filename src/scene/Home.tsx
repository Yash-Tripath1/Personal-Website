import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HOME, CONTACT, state } from "../lib/state";
import { PLANET_R, cameraDistance, stopPos, visibleHeight } from "../lib/layout";
import { on, setCursorLabel, toast, emit } from "../lib/bus";
import { sfx } from "../lib/audio";
import { atmoFragment, atmoVertex, planetFragment, planetVertex } from "./shaders";

const dummyTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
dummyTex.needsUpdate = true;

const MINT = "#9fe6bd";
const PEACH = "#ffb29e";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const appearFor = (d: number) => {
  const k = clamp((2.3 - d) / 0.9, 0, 1);
  return k * k * (3 - 2 * k);
};

function Dino({ jump }: { jump: MutableRefObject<number> }) {
  const root = useRef<THREE.Group>(null!);
  const legA = useRef<THREE.Group>(null!);
  const legB = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const sp = 7;
    legA.current.rotation.z = Math.sin(t * sp) * 0.7;
    legB.current.rotation.z = Math.sin(t * sp + Math.PI) * 0.7;
    tail.current.rotation.y = Math.sin(t * 3) * 0.28;
    head.current.rotation.z = Math.sin(t * sp * 2) * 0.05;
    let h = 0;
    if (jump.current > 0) {
      jump.current = Math.max(0, jump.current - dt * 1.5);
      h = Math.sin((1 - jump.current) * Math.PI) * 0.9;
    }
    root.current.position.y = Math.abs(Math.sin(t * sp)) * 0.05 + h;
  });

  const spikes = [-0.5, -0.22, 0.06, 0.34].map((x) => ({
    x,
    y: 0.85 + 0.48 * Math.sqrt(Math.max(0, 1 - (x / 0.75) ** 2)) - 0.02,
  }));

  return (
    <group ref={root}>
      {/* body */}
      <mesh position={[0, 0.85, 0]} scale={[0.78, 0.48, 0.42]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color={MINT} flatShading />
      </mesh>
      <mesh position={[0.04, 0.72, 0]} scale={[0.66, 0.34, 0.44]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#fff4ea" flatShading />
      </mesh>
      {/* spikes */}
      {spikes.map((s, i) => (
        <mesh key={i} position={[s.x, s.y + 0.06, 0]} rotation={[0, 0, -0.1]}>
          <coneGeometry args={[0.1, 0.24, 4]} />
          <meshStandardMaterial color={PEACH} flatShading />
        </mesh>
      ))}
      {/* neck and head */}
      <mesh position={[0.62, 1.2, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.17, 0.5, 6, 10]} />
        <meshStandardMaterial color={MINT} flatShading />
      </mesh>
      <group ref={head} position={[0.95, 1.62, 0]}>
        <mesh scale={[0.36, 0.28, 0.27]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={MINT} flatShading />
        </mesh>
        <mesh position={[0.3, -0.04, 0]}>
          <boxGeometry args={[0.28, 0.17, 0.24]} />
          <meshStandardMaterial color={MINT} flatShading />
        </mesh>
        <mesh position={[0.14, 0.09, 0.2]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#1c1636" />
        </mesh>
        <mesh position={[0.14, 0.09, -0.2]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#1c1636" />
        </mesh>
        <mesh position={[-0.05, 0.28, 0]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.07, 0.16, 4]} />
          <meshStandardMaterial color={PEACH} flatShading />
        </mesh>
      </group>
      {/* tail */}
      <group ref={tail} position={[-0.6, 0.9, 0]}>
        <mesh position={[-0.54, -0.11, 0]} rotation={[0, 0, Math.PI / 2 + 0.2]}>
          <coneGeometry args={[0.3, 1.1, 8]} />
          <meshStandardMaterial color={MINT} flatShading />
        </mesh>
      </group>
      {/* arms */}
      {[0.3, -0.3].map((z, i) => (
        <mesh key={i} position={[0.5, 0.8, z]} rotation={[0, 0, -0.9]}>
          <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
          <meshStandardMaterial color={MINT} flatShading />
        </mesh>
      ))}
      {/* legs */}
      {[
        { ref: legA, z: 0.22 },
        { ref: legB, z: -0.22 },
      ].map((l, i) => (
        <group key={i} ref={l.ref} position={[0.12, 0.6, l.z]}>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.12, 0.09, 0.56, 8]} />
            <meshStandardMaterial color={MINT} flatShading />
          </mesh>
          <mesh position={[0.08, -0.58, 0]}>
            <boxGeometry args={[0.28, 0.1, 0.18]} />
            <meshStandardMaterial color={PEACH} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const SKILLS = [
  { c: "#ffc2d9", r: 3.3, s: 0.34, i: 0.3, sz: 0.2 },
  { c: "#cdb8ff", r: 3.7, s: -0.27, i: -0.5, sz: 0.17 },
  { c: "#b5dcff", r: 4.1, s: 0.22, i: 0.9, sz: 0.22 },
  { c: "#fff0a8", r: 3.5, s: -0.4, i: 1.2, sz: 0.15 },
  { c: "#b6f0d2", r: 4.5, s: 0.18, i: -0.9, sz: 0.19 },
  { c: "#ffd2a8", r: 3.9, s: 0.3, i: 0.1, sz: 0.16 },
  { c: "#ff9fb8", r: 4.8, s: -0.15, i: 0.6, sz: 0.21 },
];

const ROAR_COOLDOWN_MS = 3000;

export function HomePlanet() {
  const [x, y, z] = stopPos(HOME);
  const root = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const pivot = useRef<THREE.Group>(null!);
  const sats = useRef<THREE.Mesh[]>([]);
  const jump = useRef(0);
  const lastRoar = useRef(-1e9);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uType: { value: 4 },
      uHover: { value: 0 },
      uPulse: { value: 0 },
      uFreq: { value: 1 },
      uForm: { value: 0 },
      uMode: { value: 0 },
      uStart: { value: 0 },
      uA: { value: new THREE.Color("#9fe6bd") },
      uB: { value: new THREE.Color("#ffd2a8") },
      uC: { value: new THREE.Color("#cdb8ff") },
      uD: { value: new THREE.Color("#bfe3ff") },
      uRim: { value: new THREE.Color("#b6f0d2") },
      uTex: { value: dummyTex },
    }),
    [],
  );
  const atmo = useMemo(
    () => ({ uColor: { value: new THREE.Color("#b6f0d2") }, uIntensity: { value: 0.8 }, uPow: { value: 3 } }),
    [],
  );

  useFrame((s, dt) => {
    const d = Math.abs(state.current - HOME);
    root.current.visible = d < 2.3;
    if (d >= 2.3) return;
    const t = s.clock.elapsedTime;
    uniforms.uTime.value = t;
    mesh.current.rotation.y += dt * 0.05;
    root.current.scale.setScalar(Math.max(appearFor(d), 0.0001));
    root.current.position.y = y + Math.sin(t * 0.5) * 0.1;
    pivot.current.rotation.z = -t * 0.45;
    sats.current.forEach((m, i) => {
      if (!m) return;
      const k = SKILLS[i];
      const a = t * k.s + i * 1.7;
      m.position.set(Math.cos(a) * k.r, Math.sin(a) * k.r * Math.sin(k.i), Math.sin(a) * k.r * Math.cos(k.i));
    });
  });

  const roar = (e: { stopPropagation: () => void; nativeEvent: MouseEvent }) => {
    if (Math.abs(state.current - HOME) > 0.6) return;
    e.stopPropagation();
    const now = performance.now();
    if (now - lastRoar.current < ROAR_COOLDOWN_MS) return;
    lastRoar.current = now;
    jump.current = 1;
    sfx("roar");
    toast("RAWR 🦖", e.nativeEvent.clientX, e.nativeEvent.clientY);
    emit("meteor");
  };

  return (
    <group ref={root} position={[x, y, z]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[PLANET_R, 96, 96]} />
        <shaderMaterial vertexShader={planetVertex} fragmentShader={planetFragment} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.2}>
        <sphereGeometry args={[PLANET_R, 48, 48]} />
        <shaderMaterial
          vertexShader={atmoVertex}
          fragmentShader={atmoFragment}
          uniforms={atmo}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* the dino walks around the planet, Little Prince style */}
      <group rotation={[0.5, 0, 0]}>
        <group ref={pivot}>
          <group
            position={[0, PLANET_R - 0.02, 0]}
            scale={0.55}
            onPointerOver={() => {
              if (Math.abs(state.current - HOME) < 0.6) setCursorLabel(state.isTouch ? "" : "rawr?");
            }}
            onPointerOut={() => setCursorLabel("")}
            onClick={roar}
          >
            <Dino jump={jump} />
            <mesh position={[0.3, 0.9, 0]}>
              <sphereGeometry args={[1.5, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        </group>
      </group>

      {/* skill satellites */}
      {SKILLS.map((k, i) => (
        <mesh key={i} ref={(el) => void (el && (sats.current[i] = el))}>
          <sphereGeometry args={[k.sz, 20, 20]} />
          <meshBasicMaterial color={k.c} />
        </mesh>
      ))}
    </group>
  );
}

/* A wireframe lock floating at the contact stop. It is sized and dimmed so the terminal text stays readable. */
export function ContactLock() {
  const [x, y, z] = stopPos(CONTACT);
  const root = useRef<THREE.Group>(null!);
  const knot = useRef<THREE.Mesh>(null!);
  const core = useRef<THREE.Mesh>(null!);
  const bits = useRef<THREE.Group>(null!);
  const bitData = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        a: (i / 26) * Math.PI * 2,
        r: 3.1 + (i % 3) * 0.35,
        y: ((i * 37) % 17) / 17 - 0.5,
        s: 0.05 + ((i * 13) % 7) / 90,
      })),
    [],
  );

  useFrame((s, dt) => {
    const d = Math.abs(state.current - CONTACT);
    root.current.visible = d < 2.3;
    if (d >= 2.3) return;
    const t = s.clock.elapsedTime;

    // shrink to the free space left of the terminal card
    const w = s.size.width;
    const h = s.size.height;
    const aspect = w / h;
    let fit = 0.75;
    if (aspect >= 1) {
      const ppu = h / visibleHeight(cameraDistance(CONTACT, aspect));
      const centre = w * (0.5 - 0.33);
      const cardLeft = w * 0.95 - Math.min(640, w * 0.9);
      const free = Math.max(0, cardLeft - 24 - centre);
      fit = clamp(free / (3.6 * ppu), 0.4, 0.85);
    }
    root.current.scale.setScalar(Math.max(appearFor(d), 0.0001) * fit);

    knot.current.rotation.x += dt * 0.25;
    knot.current.rotation.y += dt * 0.35;
    core.current.rotation.y -= dt * 0.6;
    core.current.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    bits.current.rotation.y = t * 0.2;
    root.current.position.y = y + Math.sin(t * 0.6) * 0.15;
  });

  return (
    <group ref={root} position={[x, y, z]}>
      <mesh ref={knot}>
        <torusKnotGeometry args={[1.45, 0.34, 160, 18, 2, 3]} />
        <meshBasicMaterial color="#b6f0d2" wireframe transparent opacity={0.32} />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshBasicMaterial color={new THREE.Color("#ffc2d9").multiplyScalar(1.1)} wireframe transparent opacity={0.6} />
      </mesh>
      <group ref={bits}>
        {bitData.map((b, i) => (
          <mesh key={i} position={[Math.cos(b.a) * b.r, b.y * 2.6, Math.sin(b.a) * b.r]}>
            <boxGeometry args={[b.s * 2, b.s * 2, b.s * 2]} />
            <meshBasicMaterial color={i % 2 ? "#cdb8ff" : "#b5dcff"} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* Meteor shower, triggered by clicking the dino, the terminal, or the Konami code */
export function Meteors() {
  const group = useRef<THREE.Group>(null!);
  const start = useRef(-1);
  const items = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        delay: i * 0.13 + Math.random() * 0.15,
        x: 2 + Math.random() * 12,
        y: 3 + Math.random() * 7,
        z: -10 - Math.random() * 12,
        color: ["#ffd2a8", "#ffc2d9", "#fff0a8", "#b5dcff"][i % 4],
        speed: 14 + Math.random() * 8,
      })),
    [],
  );
  const refs = useRef<THREE.Group[]>([]);
  const dir = useMemo(() => new THREE.Vector3(-1, -0.7, 0).normalize(), []);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), [dir]);

  useEffect(
    () =>
      on("meteor", () => {
        const now = performance.now() / 1000;
        // ignore repeat triggers while a shower is still running
        if (start.current >= 0 && now - start.current < 3.6) return;
        start.current = now;
      }),
    [],
  );

  useFrame((s) => {
    group.current.position.copy(s.camera.position);
    group.current.quaternion.copy(s.camera.quaternion);
    const now = performance.now() / 1000;
    const el = now - start.current;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const it = items[i];
      const life = el - it.delay;
      if (start.current < 0 || life < 0 || life > 1.8) {
        g.visible = false;
        return;
      }
      g.visible = true;
      g.position.set(it.x + dir.x * life * it.speed, it.y + dir.y * life * it.speed, it.z);
      g.scale.setScalar(Math.min(1, (1.8 - life) * 1.2));
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group key={i} ref={(el) => void (el && (refs.current[i] = el))} visible={false} quaternion={quat}>
          <mesh position={[0, -1.1, 0]}>
            <cylinderGeometry args={[0.02, 0.09, 2.4, 8]} />
            <meshBasicMaterial color={it.color} transparent opacity={0.55} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshBasicMaterial color={new THREE.Color(it.color).multiplyScalar(2)} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
