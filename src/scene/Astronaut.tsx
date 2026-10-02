import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONTACT, IS_MOBILE, state } from "../lib/state";
import { cameraDistance, stopPos, visibleHeight } from "../lib/layout";
import { on, setCursorLabel, toast } from "../lib/bus";
import { sfx } from "../lib/audio";
import { codeTexture } from "./textures";

/*
  The astronaut floats at the Contact stop, typing on a laptop and sending messages out into space.
  - Every few seconds it stops typing and waves at you.
  - Click or tap it: a zero gravity backflip, a big wave and a burst of envelopes.
  - The terminal command `astro` triggers the same thing.
  Built from simple low poly shapes so it matches the dino on the home planet.
*/

const SUIT = "#ece6fb";
const SUIT_SHADE = "#cfc5ee";
const VISOR = "#40307a";
const MINT = "#9fe6bd";
const PINK = "#ff9fb8";
const PEACH = "#ffb29e";
const LILAC = "#cdb8ff";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const appearFor = (d: number) => {
  const k = clamp((2.3 - d) / 0.9, 0, 1);
  return k * k * (3 - 2 * k);
};
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// half width of the whole scene (orbiting envelopes included), in world units
const HALF_EXTENT = 2.9;
const CLICK_COOLDOWN_MS = 2600;

const MAIL = ["#fff4ea", "#ffc2d9", "#b6f0d2", "#cdb8ff", "#b5dcff"];
const LINES = [
  "Houston, we have a message 📡",
  "Hello, human! 👋",
  "typing… hello, world ✨",
  "Want to build something together? 🚀",
  "Sending good vibes at light speed 💌",
];

function Envelope({ color }: { color: string }) {
  const flap = useMemo(() => new THREE.Color(color).multiplyScalar(0.8), [color]);
  return (
    <group scale={1.3}>
      <mesh>
        <boxGeometry args={[0.5, 0.34, 0.04]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* the flap is a flattened triangle pointing down from the top edge */}
      <mesh position={[0, 0.1065, 0.025]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 2.27, 1]}>
        <circleGeometry args={[0.127, 3]} />
        <meshBasicMaterial color={flap} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function ContactAstronaut() {
  const [x, y, z] = stopPos(CONTACT);
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const mail = useRef<THREE.Group[]>([]);
  const arms = useRef<THREE.Group[]>([]);
  const fores = useRef<THREE.Group[]>([]);
  const thighs = useRef<THREE.Group[]>([]);
  const shins = useRef<THREE.Group[]>([]);
  const lights = useRef<THREE.Mesh[]>([]);
  const rings = useRef<THREE.Mesh[]>([]);
  const tip = useRef<THREE.Mesh>(null!);
  const eyes = useRef<THREE.Mesh[]>([]);
  const smile = useRef<THREE.Mesh>(null!);

  const waveT = useRef(0); // seconds of waving left
  const wv = useRef(0); // smoothed 0..1 wave amount
  const flip = useRef(0); // 1 -> 0 while a backflip is running
  const burst = useRef(0); // envelopes fly outwards
  const idle = useRef(3.5);
  const lastClick = useRef(-1e9);
  const screen = useMemo(() => codeTexture(), []);

  const trigger = () => {
    waveT.current = 2.8;
    flip.current = 1;
    burst.current = 1;
    sfx("wave");
  };

  useEffect(() => on("astro-wave", trigger), []);

  useFrame((s, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const d = Math.abs(state.current - CONTACT);
    root.current.visible = d < 2.3;
    if (d >= 2.3) return;
    const t = s.clock.elapsedTime;

    // ---- fit into the free space beside the terminal (or above it on phones) ----
    const w = s.size.width;
    const h = s.size.height;
    const aspect = w / h;
    const D = cameraDistance(CONTACT, aspect);
    let fit: number;
    if (aspect >= 1) {
      const ppu = h / visibleHeight(D);
      const cardLeft = w * 0.95 - Math.min(640, w * 0.9);
      const centre = cardLeft / 2;
      const room = Math.max(0, Math.min(centre - 14, cardLeft - 24 - centre));
      fit = clamp(room / (HALF_EXTENT * ppu), 0.45, 1.15);
    } else {
      const W = visibleHeight(D) * aspect;
      fit = clamp((W * 0.92) / (2 * HALF_EXTENT), 0.5, 1.2);
    }
    root.current.scale.setScalar(Math.max(appearFor(d), 0.0001) * fit);
    root.current.position.y = y + Math.sin(t * 0.6) * 0.18;

    // ---- what is the astronaut doing? ----
    if (d < 0.5) {
      idle.current -= dt;
      if (idle.current <= 0) {
        waveT.current = 2.2;
        idle.current = 7 + Math.random() * 4;
      }
    }
    waveT.current = Math.max(0, waveT.current - dt);
    wv.current += ((waveT.current > 0 ? 1 : 0) - wv.current) * Math.min(1, dt * 6);
    const wave = wv.current;

    let flipAng = 0;
    if (flip.current > 0) {
      flip.current = Math.max(0, flip.current - dt / 1.4);
      if (flip.current > 0) flipAng = easeInOut(1 - flip.current) * Math.PI * 2;
    }
    burst.current = Math.max(0, burst.current - dt * 0.55);
    const bst = easeInOut(burst.current);

    // drifting in zero g, turned towards the terminal
    body.current.rotation.set(Math.sin(t * 0.45) * 0.06 - flipAng, 0.85 + Math.sin(t * 0.35) * 0.15, Math.sin(t * 0.5) * 0.07);

    // head looks at the viewer, more so when waving
    head.current.rotation.set(0.08 + Math.sin(t * 0.7) * 0.03, lerp(-0.45, -0.85, wave) + Math.sin(t * 0.8) * 0.07, 0);

    // arms: typing, or waving with the right arm
    const tapA = Math.sin(t * 12) * 0.05;
    const tapB = Math.sin(t * 12 + 2.1) * 0.05;
    arms.current[0]?.rotation.set(lerp(-0.5 + tapA, 0, wave), 0, lerp(-0.16, 2.6, wave));
    fores.current[0]?.rotation.set(lerp(-0.7 + tapA * 2, 0, wave), 0, wave * Math.sin(t * 11) * 0.6);
    arms.current[1]?.rotation.set(-0.5 + tapB, 0, 0.16);
    fores.current[1]?.rotation.set(-0.7 + tapB * 2, 0, 0);

    // legs dangle and sway
    thighs.current.forEach((g, i) => g && g.rotation.set(-1.15 + Math.sin(t * 0.9 + i * 1.7) * 0.05, 0, 0));
    shins.current.forEach((g, i) => g && g.rotation.set(1.0 + Math.sin(t * 1.1 + i * 2.3) * 0.12, 0, 0));

    // chest lights, antenna and signal rings
    lights.current.forEach((m, i) => m && m.scale.setScalar(0.8 + Math.max(0, Math.sin(t * 3 + i * 1.3)) * 0.5));
    tip.current.scale.setScalar(1 + (Math.sin(t * 4) > 0.55 ? 0.6 : 0) + bst * 0.5);
    rings.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 0.6 + i * 0.5) % 1;
      m.scale.setScalar(0.25 + p * 2.4);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.75;
    });

    // face: blink now and then, grin when waving
    const blink = t % 4.3 < 0.13 ? 0.15 : 1;
    eyes.current.forEach((m) => m && m.scale.set(1, blink, 1));
    smile.current.scale.set(1 + wave * 0.4, 1 + wave * 0.7, 1);

    // envelopes orbit; a click flings them outwards for a moment
    mail.current.forEach((g, i) => {
      if (!g) return;
      const a = t * 0.35 * (1 + bst * 3) + (i * Math.PI * 2) / MAIL.length;
      const r = 2.45 + bst * 1.2;
      g.position.set(Math.cos(a) * r, Math.sin(a * 2 + i) * 0.45 + 0.35, Math.sin(a) * r * 0.55);
      g.rotation.set(0.1, Math.sin(a) * 0.4, Math.sin(a * 2) * 0.25);
    });
  });

  const onClick = (e: { stopPropagation: () => void; nativeEvent: MouseEvent }) => {
    if (Math.abs(state.current - CONTACT) > 0.6) return;
    e.stopPropagation();
    const now = performance.now();
    if (now - lastClick.current < CLICK_COOLDOWN_MS) return;
    lastClick.current = now;
    trigger();
    toast(LINES[Math.floor(Math.random() * LINES.length)], e.nativeEvent.clientX, e.nativeEvent.clientY);
  };

  return (
    <group ref={root} position={[x, y, z]}>
      {/* invisible hit area, generous enough for a thumb */}
      <mesh
        position={[0, 0.3, 0]}
        onPointerOver={() => {
          if (Math.abs(state.current - CONTACT) < 0.6) setCursorLabel(state.isTouch ? "" : "wave?");
        }}
        onPointerOut={() => setCursorLabel("")}
        onClick={onClick}
      >
        <sphereGeometry args={[IS_MOBILE ? 2.3 : 2, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* messages flying around the astronaut */}
      <group rotation={[0.45, 0, 0]}>
        {MAIL.map((c, i) => (
          <group key={i} ref={(el) => void (el && (mail.current[i] = el))}>
            <Envelope color={c} />
          </group>
        ))}
      </group>

      <group ref={body}>
        <group position={[0, -0.4, 0]}>
          {/* torso */}
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.44, 0.5, 8, 16]} />
            <meshStandardMaterial color={SUIT} flatShading />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.05, 8, 24]} />
            <meshStandardMaterial color={PEACH} flatShading />
          </mesh>
          <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.07, 8, 24]} />
            <meshStandardMaterial color={MINT} flatShading />
          </mesh>

          {/* chest panel with blinking lights */}
          <mesh position={[0, 0.62, 0.43]}>
            <boxGeometry args={[0.42, 0.26, 0.06]} />
            <meshStandardMaterial color={SUIT_SHADE} flatShading />
          </mesh>
          {[PINK, MINT, PEACH].map((c, i) => (
            <mesh key={i} position={[-0.12 + i * 0.12, 0.62, 0.47]} ref={(el) => void (el && (lights.current[i] = el))}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshBasicMaterial color={new THREE.Color(c).multiplyScalar(1.25)} />
            </mesh>
          ))}

          {/* backpack, antenna and signal rings */}
          <mesh position={[0, 0.55, -0.55]}>
            <boxGeometry args={[0.82, 0.98, 0.34]} />
            <meshStandardMaterial color={SUIT_SHADE} flatShading />
          </mesh>
          <mesh position={[0, 0.55, -0.74]}>
            <boxGeometry args={[0.5, 0.4, 0.06]} />
            <meshStandardMaterial color={LILAC} flatShading />
          </mesh>
          <mesh position={[0.28, 1.25, -0.55]}>
            <cylinderGeometry args={[0.022, 0.022, 0.7, 6]} />
            <meshStandardMaterial color="#9a8fc4" />
          </mesh>
          <group position={[0.28, 1.62, -0.55]}>
            <mesh ref={tip}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color={new THREE.Color(PINK).multiplyScalar(1.4)} />
            </mesh>
            {[0, 1].map((i) => (
              <mesh key={i} ref={(el) => void (el && (rings.current[i] = el))}>
                <ringGeometry args={[0.92, 1, 40]} />
                <meshBasicMaterial color={PINK} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            ))}
          </group>

          {/* helmet */}
          <group ref={head} position={[0, 1.38, 0]}>
            <mesh>
              <sphereGeometry args={[0.62, 28, 22]} />
              <meshStandardMaterial color={SUIT} />
            </mesh>
            {[1, -1].map((s) => (
              <mesh key={s} position={[0.62 * s, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.13, 0.13, 0.12, 12]} />
                <meshStandardMaterial color={PEACH} flatShading />
              </mesh>
            ))}
            <mesh position={[0, 0.02, 0.36]} scale={[1, 0.78, 0.62]}>
              <sphereGeometry args={[0.5, 24, 18]} />
              <meshStandardMaterial color={VISOR} roughness={0.3} />
            </mesh>
            {/* reflections on the glass */}
            <mesh position={[-0.2, 0.2, 0.64]} rotation={[0, 0, 0.5]} scale={[1.7, 0.7, 0.3]}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
            </mesh>
            <mesh position={[0.22, -0.17, 0.62]} scale={[1.4, 0.6, 0.3]}>
              <sphereGeometry args={[0.06, 10, 8]} />
              <meshBasicMaterial color={PINK} transparent opacity={0.5} />
            </mesh>
            {/* a friendly face */}
            {[-1, 1].map((s, i) => (
              <mesh key={s} position={[0.16 * s, 0.07, 0.66]} ref={(el) => void (el && (eyes.current[i] = el))}>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshBasicMaterial color={new THREE.Color(MINT).multiplyScalar(1.3)} />
              </mesh>
            ))}
            <mesh position={[0, -0.04, 0.655]} rotation={[0, 0, Math.PI]} ref={smile}>
              <torusGeometry args={[0.1, 0.016, 6, 16, Math.PI]} />
              <meshBasicMaterial color={new THREE.Color(MINT).multiplyScalar(1.3)} />
            </mesh>
          </group>

          {/* arms: [0] is the waving arm */}
          {[1, -1].map((side, i) => (
            <group key={side} ref={(el) => void (el && (arms.current[i] = el))} position={[0.62 * side, 0.85, 0]}>
              <mesh>
                <sphereGeometry args={[0.19, 12, 10]} />
                <meshStandardMaterial color={MINT} flatShading />
              </mesh>
              <mesh position={[0, -0.35, 0]}>
                <capsuleGeometry args={[0.15, 0.4, 6, 10]} />
                <meshStandardMaterial color={SUIT} flatShading />
              </mesh>
              <group ref={(el) => void (el && (fores.current[i] = el))} position={[0, -0.7, 0]}>
                <mesh position={[0, -0.35, 0]}>
                  <capsuleGeometry args={[0.14, 0.4, 6, 10]} />
                  <meshStandardMaterial color={SUIT} flatShading />
                </mesh>
                <mesh position={[0, -0.62, 0]}>
                  <cylinderGeometry args={[0.165, 0.165, 0.1, 10]} />
                  <meshStandardMaterial color={MINT} flatShading />
                </mesh>
                <mesh position={[0, -0.78, 0]}>
                  <sphereGeometry args={[0.17, 12, 10]} />
                  <meshStandardMaterial color={PEACH} flatShading />
                </mesh>
              </group>
            </group>
          ))}

          {/* legs, bent as if sitting in mid air */}
          {[1, -1].map((side, i) => (
            <group key={side} ref={(el) => void (el && (thighs.current[i] = el))} position={[0.24 * side, -0.2, 0]}>
              <mesh position={[0, -0.35, 0]}>
                <capsuleGeometry args={[0.19, 0.36, 6, 10]} />
                <meshStandardMaterial color={SUIT} flatShading />
              </mesh>
              <group ref={(el) => void (el && (shins.current[i] = el))} position={[0, -0.72, 0]}>
                <mesh position={[0, -0.33, 0]}>
                  <capsuleGeometry args={[0.17, 0.3, 6, 10]} />
                  <meshStandardMaterial color={SUIT} flatShading />
                </mesh>
                <mesh position={[0, -0.72, 0.08]}>
                  <boxGeometry args={[0.32, 0.2, 0.46]} />
                  <meshStandardMaterial color={PINK} flatShading />
                </mesh>
              </group>
            </group>
          ))}

          {/* laptop: the lid faces us and carries a glowing logo, the screen faces the astronaut */}
          <mesh position={[0, -0.1, 0.85]}>
            <boxGeometry args={[1.0, 0.05, 0.72]} />
            <meshStandardMaterial color={LILAC} flatShading />
          </mesh>
          <mesh position={[0, -0.072, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.86, 0.5]} />
            <meshBasicMaterial color="#5b4a99" />
          </mesh>
          <group position={[0, -0.07, 1.21]} rotation={[0.35, 0, 0]}>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[1.0, 0.58, 0.04]} />
              <meshStandardMaterial color={LILAC} flatShading />
            </mesh>
            <mesh position={[0, 0.3, 0.025]}>
              <circleGeometry args={[0.1, 20]} />
              <meshBasicMaterial color={new THREE.Color(MINT).multiplyScalar(1.35)} />
            </mesh>
            <mesh position={[0, 0.3, -0.025]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.92, 0.5]} />
              <meshBasicMaterial map={screen} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
