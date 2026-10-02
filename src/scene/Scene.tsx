import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { PROJECTS } from "../data/projects";
import { FOV } from "../lib/layout";
import { CameraRig } from "./CameraRig";
import { ContactLock, HomePlanet, Meteors } from "./Home";
import { NameParticles } from "./NameParticles";
import { Planet } from "./Planet";
import { Nebula, Stars } from "./Space";

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

      <Stars count={mobile ? 2600 : 5500} />
      <Nebula count={mobile ? 12 : 18} />
      <CameraRig />
      <NameParticles mobile={mobile} />

      {PROJECTS.map((p, i) => (
        <Planet key={p.id} index={i + 1} project={p} />
      ))}
      <HomePlanet />
      <ContactLock />
      <Meteors />

      <EffectComposer multisampling={mobile ? 0 : 4}>
        <Bloom intensity={mobile ? 0.6 : 0.8} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.4} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
