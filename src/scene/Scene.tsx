import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { PROJECTS } from "../data/projects";
import { FOV } from "../lib/layout";
import { CameraRig } from "./CameraRig";
import { HomePlanet, Meteors } from "./Home";
import { ContactAstronaut } from "./Astronaut";
import { NameParticles } from "./NameParticles";
import { Planet } from "./Planet";
import { Nebula, Stars } from "./Space";

/*
  Watches the frame rate and quietly lowers the render resolution when the
  device struggles (older phones, battery saver mode), so scrolling stays smooth.
*/
function AdaptiveQuality({ floor }: { floor: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, wait: 120 });
  useFrame((s, dt) => {
    const a = acc.current;
    // give the scene a couple of seconds to warm up (shader compile, font load)
    if (a.wait > 0) {
      a.wait--;
      return;
    }
    if (dt > 0.25) return; // ignore tab switches
    a.t += dt;
    a.n++;
    if (a.n < 90) return;
    const fps = a.n / a.t;
    a.t = 0;
    a.n = 0;
    const cur = s.viewport.dpr;
    if (fps < 40 && cur > floor) setDpr(Math.max(floor, +(cur * 0.8).toFixed(2)));
  });
  return null;
}

export default function Scene({ mobile }: { mobile: boolean }) {
  return (
    <Canvas
      flat
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 700, position: [0, 0, 52] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <color attach="background" args={["#1c1636"]} />
      <ambientLight intensity={1.2} color="#ffe9f5" />
      <directionalLight position={[-4, 5, 8]} intensity={2} color="#fff4ea" />

      <AdaptiveQuality floor={mobile ? 0.85 : 1} />
      <Stars count={mobile ? 1800 : 5500} />
      <Nebula count={mobile ? 10 : 18} />
      <CameraRig />
      <NameParticles mobile={mobile} />

      {PROJECTS.map((p, i) => (
        <Planet key={p.id} index={i + 1} project={p} />
      ))}
      <HomePlanet />
      <ContactAstronaut />
      <Meteors />

      <EffectComposer multisampling={mobile ? 0 : 4}>
        <Bloom intensity={mobile ? 0.55 : 0.8} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
        {!mobile && <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.4} />}
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
