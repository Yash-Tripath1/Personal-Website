import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { state } from "../lib/state";
import { auraFromWord, verseRingTexture } from "./textures";

export type Shared = {
  hover: MutableRefObject<number>;
  pulse: MutableRefObject<number>;
};

const bright = (hex: string, k = 1.6) => new THREE.Color(hex).multiplyScalar(k);

function Plane({
  w,
  h,
  color,
  pos = [0, 0, 0],
  opacity = 1,
}: {
  w: number;
  h: number;
  color: string;
  pos?: [number, number, number];
  opacity?: number;
}) {
  return (
    <mesh position={pos}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* SurfGambit: three browser panes (parse, layout, paint) */
function Pane({ kind }: { kind: 0 | 1 | 2 }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 0.76, 0.04)), []);
  const lineColor = kind === 0 ? "#b6f0d2" : kind === 1 ? "#cdb8ff" : "#ffffff";
  return (
    <group>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={lineColor} />
      </lineSegments>
      {kind === 0 && <Plane w={1.18} h={0.74} color="#1c1636" opacity={0.55} />}
      {kind === 1 && (
        <>
          <Plane w={1.18} h={0.74} color="#1c1636" opacity={0.6} />
          <Plane w={1.08} h={0.14} color="#cdb8ff" pos={[0, 0.27, 0.025]} opacity={0.8} />
          <Plane w={0.3} h={0.46} color="#ffc2d9" pos={[-0.4, -0.08, 0.025]} opacity={0.8} />
          <Plane w={0.66} h={0.46} color="#b5dcff" pos={[0.17, -0.08, 0.025]} opacity={0.8} />
        </>
      )}
      {kind === 2 && (
        <>
          <Plane w={1.18} h={0.74} color="#fff4ea" />
          <Plane w={1.08} h={0.14} color="#ffc2d9" pos={[0, 0.27, 0.025]} />
          <Plane w={0.3} h={0.46} color="#b6f0d2" pos={[-0.4, -0.08, 0.025]} />
          <Plane w={0.66} h={0.2} color="#b5dcff" pos={[0.17, 0.05, 0.025]} />
          <Plane w={0.66} h={0.2} color="#cdb8ff" pos={[0.17, -0.2, 0.025]} />
        </>
      )}
    </group>
  );
}

export function SurfExtras({ pulse }: Shared) {
  const g = useRef<THREE.Group>(null!);
  useFrame((s) => {
    g.current.rotation.y = s.clock.elapsedTime * 0.22 + pulse.current * 0.4;
  });
  return (
    <group ref={g} rotation={[0.18, 0, 0.1]}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 3.6, Math.sin(a * 2) * 0.35, Math.sin(a) * 3.6]}
            rotation={[0, Math.PI / 2 - a, 0]}
          >
            <Pane kind={i as 0 | 1 | 2} />
          </group>
        );
      })}
    </group>
  );
}

/* Vynt: RGB split rings */
export function VyntExtras({ pulse, hover }: Shared) {
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const glitch = Math.sin(t * 3) > 0.92 || pulse.current > 0.5 ? 0.12 : 0.03 + hover.current * 0.05;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const dir = i - 1;
      m.position.x = dir * glitch * (1 + Math.sin(t * 20 + i) * 0.4);
      m.rotation.z = t * 0.15 * (i + 1) * 0.4;
      m.scale.setScalar(1 + pulse.current * 0.3);
    });
  });
  const cols = ["#ff5a8a", "#6dffb2", "#5aa8ff"];
  return (
    <group rotation={[1.25, 0.2, 0.3]}>
      {cols.map((c, i) => (
        <mesh key={i} ref={(el) => void (el && (refs.current[i] = el))}>
          <torusGeometry args={[3.35, 0.028, 8, 120]} />
          <meshBasicMaterial color={c} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* Memoir: polaroids and chat bubbles */
export function MemoirExtras({ pulse, hover }: Shared) {
  const g = useRef<THREE.Group>(null!);
  const bubbles = useRef<THREE.Group[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    g.current.rotation.y = t * 0.2;
    bubbles.current.forEach((b, i) => {
      if (!b) return;
      const k = 0.7 + hover.current * 0.6 + Math.sin(pulse.current * Math.PI) * 0.9;
      b.scale.setScalar(k);
      b.position.y = Math.sin(t * 0.9 + i * 2) * 0.25 + (i - 1) * 0.5;
    });
  });
  const photos = ["#ffc2d9", "#b5dcff", "#b6f0d2", "#fff0a8"];
  const chat = ["#ffffff", "#b6f0d2", "#ffd2a8"];
  return (
    <group ref={g} rotation={[0.15, 0, 0.08]}>
      {photos.map((c, i) => {
        const a = (i / photos.length) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 3.5, Math.sin(i * 2) * 0.5, Math.sin(a) * 3.5]}
            rotation={[0, Math.PI / 2 - a, (i % 2 ? 1 : -1) * 0.18]}
          >
            <mesh>
              <boxGeometry args={[0.72, 0.88, 0.03]} />
              <meshBasicMaterial color="#fff9f2" />
            </mesh>
            <Plane w={0.58} h={0.58} color={c} pos={[0, 0.07, 0.02]} />
          </group>
        );
      })}
      {chat.map((c, i) => {
        const a = (i / chat.length) * Math.PI * 2 + 0.9;
        return (
          <group
            key={i}
            position={[Math.cos(a) * 4.1, 0, Math.sin(a) * 4.1]}
            ref={(el) => void (el && (bubbles.current[i] = el))}
          >
            <mesh scale={[1, 0.65, 0.55]}>
              <sphereGeometry args={[0.38, 20, 16]} />
              <meshBasicMaterial color={c} />
            </mesh>
            <mesh position={[-0.2, -0.28, 0]} rotation={[0, 0, 0.6]}>
              <coneGeometry args={[0.1, 0.2, 3]} />
              <meshBasicMaterial color={c} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* Veyra: breathing aura shells */
export function VeyraExtras({ pulse }: Shared) {
  const m1 = useRef<THREE.Mesh>(null!);
  const m2 = useRef<THREE.Mesh>(null!);
  const last = useRef("");
  const aura = useRef(auraFromWord(state.word));
  useFrame((s) => {
    if (last.current !== state.word) {
      last.current = state.word;
      aura.current = auraFromWord(state.word);
      (m1.current.material as THREE.MeshBasicMaterial).color.copy(aura.current.c1);
      (m2.current.material as THREE.MeshBasicMaterial).color.copy(aura.current.c2);
    }
    const t = s.clock.elapsedTime * aura.current.freq * 1.6;
    m1.current.scale.setScalar(1.18 + Math.sin(t) * 0.05 + pulse.current * 0.25);
    m2.current.scale.setScalar(1.36 + Math.sin(t + 1.5) * 0.07 + pulse.current * 0.4);
  });
  return (
    <>
      <mesh ref={m1}>
        <sphereGeometry args={[2.2, 40, 40]} />
        <meshBasicMaterial color="#cdb8ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={m2}>
        <sphereGeometry args={[2.2, 40, 40]} />
        <meshBasicMaterial color="#ffc2d9" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  );
}

/* Klar: der, die, das orbs */
export function KlarExtras({ pulse }: Shared) {
  const refs = useRef<THREE.Mesh[]>([]);
  const cols = ["#9ccbff", "#ff9fb8", "#9fe6bd"];
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const a = t * (0.22 + i * 0.05) + (i * Math.PI * 2) / 3;
      const r = 3.3 + i * 0.35;
      m.position.set(Math.cos(a) * r, Math.sin(a * 0.7 + i) * 0.7, Math.sin(a) * r);
      m.scale.setScalar(1 + pulse.current * 0.8);
    });
  });
  return (
    <group>
      {cols.map((c, i) => (
        <mesh key={i} ref={(el) => void (el && (refs.current[i] = el))}>
          <sphereGeometry args={[0.17 + i * 0.03, 24, 24]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

/* RoadSOS: beacon ring, siren satellite, SOS ping */
export function RoadExtras({ pulse }: Shared) {
  const ring = useRef<THREE.Mesh>(null!);
  const sat = useRef<THREE.Group>(null!);
  const red = useRef<THREE.Mesh>(null!);
  const blue = useRef<THREE.Mesh>(null!);
  const ping = useRef<THREE.Mesh>(null!);
  const redC = useMemo(() => bright("#ff4f78", 2.2), []);
  const blueC = useMemo(() => bright("#4f9bff", 2.2), []);
  const off = useMemo(() => new THREE.Color("#2a2150"), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const flip = Math.sin(t * 8) > 0;
    const rm = ring.current.material as THREE.MeshBasicMaterial;
    rm.color.copy(Math.sin(t * 3) > 0 ? redC : blueC);
    (red.current.material as THREE.MeshBasicMaterial).color.copy(flip ? redC : off);
    (blue.current.material as THREE.MeshBasicMaterial).color.copy(flip ? off : blueC);
    const a = t * 0.9;
    sat.current.position.set(Math.cos(a) * 3.5, Math.sin(a) * 1.4, Math.sin(a) * 3.5 * Math.cos(0.4));
    sat.current.rotation.y = -a;
    const p = pulse.current;
    ping.current.visible = p > 0.01;
    ping.current.scale.setScalar(2.2 * (1.05 + (1 - p) * 2.4));
    (ping.current.material as THREE.MeshBasicMaterial).opacity = p * 0.9;
  });
  return (
    <group>
      <mesh ref={ring} rotation={[1.35, 0.3, 0]}>
        <torusGeometry args={[3.1, 0.022, 8, 140]} />
        <meshBasicMaterial color="#ff4f78" toneMapped={false} />
      </mesh>
      <group ref={sat}>
        <mesh>
          <boxGeometry args={[0.38, 0.16, 0.2]} />
          <meshBasicMaterial color="#fff4ea" />
        </mesh>
        <mesh ref={red} position={[-0.1, 0.12, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#ff4f78" toneMapped={false} />
        </mesh>
        <mesh ref={blue} position={[0.1, 0.12, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#4f9bff" toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={ping} visible={false}>
        <ringGeometry args={[0.98, 1, 96]} />
        <meshBasicMaterial color="#ffb3c6" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* Shakespeare GPT: ring of verse */
export function VerseExtras({ pulse }: Shared) {
  const g = useRef<THREE.Group>(null!);
  const tex = useMemo(() => verseRingTexture(), []);
  useFrame((s) => {
    g.current.rotation.y = s.clock.elapsedTime * 0.18 + pulse.current * 0.6;
  });
  return (
    <group rotation={[0.28, 0, -0.32]}>
      <group ref={g}>
        <mesh>
          <cylinderGeometry args={[3.45, 3.45, 0.66, 96, 1, true]} />
          <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/* Forge: orbiting brush stroke */
export function ForgeExtras({ pulse }: Shared) {
  const g = useRef<THREE.Group>(null!);
  const dabs = useMemo(() => {
    const pal = ["#ffb29e", "#ffd2a8", "#ffc2d9", "#cdb8ff"];
    const n = 34;
    return Array.from({ length: n }, (_, j) => {
      const k = j / (n - 1);
      const a = k * Math.PI * 1.7;
      const r = 3.45 + Math.sin(a * 2.2) * 0.18;
      return {
        pos: [Math.cos(a) * r, Math.sin(a * 1.5) * 0.25, Math.sin(a) * r] as [number, number, number],
        size: 0.03 + k * k * 0.24,
        c: pal[j % 4],
        o: 0.25 + k * 0.75,
      };
    });
  }, []);
  useFrame((s) => {
    g.current.rotation.y = -s.clock.elapsedTime * 0.45;
    g.current.scale.setScalar(1 + pulse.current * 0.15);
  });
  return (
    <group rotation={[0.45, 0, 0.35]}>
      <group ref={g}>
        {dabs.map((d, i) => (
          <mesh key={i} position={d.pos}>
            <sphereGeometry args={[d.size, 14, 14]} />
            <meshBasicMaterial color={d.c} transparent opacity={d.o} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
