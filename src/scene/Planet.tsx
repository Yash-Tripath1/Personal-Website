import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Project } from "../data/projects";
import { PLANET_R, stopPos } from "../lib/layout";
import { state } from "../lib/state";
import { emit, setCursorLabel, toast } from "../lib/bus";
import { sfx } from "../lib/audio";
import { atmoFragment, atmoVertex, planetFragment, planetVertex } from "./shaders";
import { auraFromWord, lettersTexture } from "./textures";
import {
  ForgeExtras,
  KlarExtras,
  MemoirExtras,
  RoadExtras,
  SurfExtras,
  VerseExtras,
  VeyraExtras,
  VyntExtras,
  type Shared,
} from "./Extras";

const dummyTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
dummyTex.needsUpdate = true;

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const MESSAGES: Record<string, string[]> = {
  surfgambit: ["parse → layout → paint ✓", "re-rendering the world…", "<html> loading…"],
  vynt: ["say cheese 📸", "click! ✨", "y2k forever 💿"],
  memoir: ["did u eat?? 🍜", "lol remember that trip 😭", "ok but sending this to the scrapbook 📎", "goodnight 🌙"],
  klar: ["Hallo! 👋", "Guten Tag!", "Wie geht's? 🌿", "Alles klar!"],
  roadsos: ["SOS ping sent · help is on the way 🚑", "location shared · stay calm 🛟"],
  shakespeare: [
    "Shall I compare thee to a cloudy sky?",
    "What light through yonder window breaks…",
    "Good night, good night! parting is such sweet code.",
    "The lady doth compile too much, methinks.",
  ],
  forge: ["stamp! 🖌️", "flow engine: on", "exporting to Krita…"],
};

export function Planet({ index, project }: { index: number; project: Project }) {
  const [x, y, z] = stopPos(index);
  const clock = useThree((s) => s.clock);
  const root = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const hover = useRef(0);
  const hovering = useRef(false);
  const pulse = useRef(0);
  const modeAcc = useRef(0);
  const lastWord = useRef("");

  const colors = useMemo(() => project.colors.map((c) => new THREE.Color(c)), [project]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uType: { value: project.type },
      uHover: { value: 0 },
      uPulse: { value: 0 },
      uFreq: { value: 1 },
      uForm: { value: 0 },
      uMode: { value: 0 },
      uStart: { value: 0 },
      uA: { value: colors[0].clone() },
      uB: { value: colors[1].clone() },
      uC: { value: colors[2].clone() },
      uD: { value: colors[3].clone() },
      uRim: { value: new THREE.Color(project.rim) },
      uTex: { value: project.type === 6 ? lettersTexture() : dummyTex },
    }),
    [project, colors],
  );
  const atmo = useMemo(
    () => ({
      uColor: { value: new THREE.Color(project.rim) },
      uIntensity: { value: 0.75 },
      uPow: { value: 3.0 },
    }),
    [project],
  );

  useFrame((s, dt) => {
    const d = Math.abs(state.current - index);
    root.current.visible = d < 2.3;
    if (d >= 2.3) return;
    const t = s.clock.elapsedTime;
    hover.current += ((hovering.current ? 1 : 0) - hover.current) * Math.min(1, dt * 6);
    pulse.current = Math.max(0, pulse.current - dt * 0.8);
    mesh.current.rotation.y += dt * project.rotSpeed * (1 + hover.current * 1.6);
    const sc = 1 + hover.current * 0.04 + Math.sin(pulse.current * Math.PI) * 0.05;
    root.current.scale.setScalar(sc);
    root.current.position.y = y + Math.sin(t * 0.5 + index) * 0.12;

    const u = uniforms;
    u.uTime.value = t;
    u.uHover.value = hover.current;
    u.uPulse.value = pulse.current;
    modeAcc.current += dt * (0.45 + hover.current * 2.6 + pulse.current * 4);
    u.uMode.value = modeAcc.current;

    if (project.id === "veyra" && lastWord.current !== state.word) {
      lastWord.current = state.word;
      const a = auraFromWord(state.word);
      u.uA.value.copy(a.c1);
      u.uB.value.copy(a.c2);
      u.uC.value.copy(a.c3);
      u.uD.value.copy(a.c4);
      u.uRim.value.copy(a.c1);
      atmo.uColor.value.copy(a.c1);
      u.uFreq.value = a.freq;
      u.uForm.value = a.form;
      pulse.current = Math.max(pulse.current, 0.7);
    }
    atmo.uIntensity.value = 0.7 + hover.current * 0.5 + pulse.current * 0.6;
  });

  const active = () => Math.abs(state.current - index) < 0.6;

  const onClick = (e: { stopPropagation: () => void; nativeEvent: MouseEvent }) => {
    if (!active()) return;
    e.stopPropagation();
    pulse.current = 1;
    const { clientX: cx, clientY: cy } = e.nativeEvent;
    switch (project.id) {
      case "surfgambit":
        uniforms.uStart.value = clock.elapsedTime;
        sfx("click");
        break;
      case "vynt":
        emit("flash");
        sfx("flash");
        break;
      case "roadsos":
        sfx("ping");
        break;
      case "veyra":
        sfx("ping");
        toast(`aura of “${state.word}” ✦`, cx, cy);
        return;
      default:
        sfx("click");
    }
    toast(rand(MESSAGES[project.id]), cx, cy);
  };

  const shared: Shared = { hover, pulse };

  return (
    <group ref={root} position={[x, y, z]}>
      <mesh
        ref={mesh}
        onPointerOver={(e) => {
          if (!active()) return;
          e.stopPropagation();
          hovering.current = true;
          setCursorLabel(state.isTouch ? "" : "click");
        }}
        onPointerOut={() => {
          hovering.current = false;
          setCursorLabel("");
        }}
        onClick={onClick}
      >
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

      {project.id === "surfgambit" && <SurfExtras {...shared} />}
      {project.id === "vynt" && <VyntExtras {...shared} />}
      {project.id === "memoir" && <MemoirExtras {...shared} />}
      {project.id === "veyra" && <VeyraExtras {...shared} />}
      {project.id === "klar" && <KlarExtras {...shared} />}
      {project.id === "roadsos" && <RoadExtras {...shared} />}
      {project.id === "shakespeare" && <VerseExtras {...shared} />}
      {project.id === "forge" && <ForgeExtras {...shared} />}
    </group>
  );
}
