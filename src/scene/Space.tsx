import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { starFragment, starVertex } from "./shaders";
import { radialTexture } from "./textures";

const PALETTE = ["#ffffff", "#ffe3f0", "#e3dcff", "#d8efff", "#d9ffee", "#fff2d6"];

export function Stars({ count }: { count: number }) {
  const { geo, uniforms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 2] = 40 - Math.random() * 360;
      size[i] = 0.8 + Math.pow(Math.random(), 3) * 3.2;
      phase[i] = Math.random();
      c.set(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return {
      geo: g,
      uniforms: { uTime: { value: 0 }, uPx: { value: Math.min(window.devicePixelRatio || 1, 2) } },
    };
  }, [count]);

  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const NEBULA = ["#ff9ec7", "#a894ff", "#7fc4ff", "#7fe8c4", "#ffb89a"];

export function Nebula({ count = 18 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        return {
          pos: [side * (16 + Math.random() * 30), (Math.random() - 0.5) * 36, 10 - i * (15.5 * (18 / count)) - Math.random() * 6] as [
            number,
            number,
            number,
          ],
          scale: 34 + Math.random() * 40,
          color: NEBULA[i % NEBULA.length],
          opacity: 0.14 + Math.random() * 0.14,
          rot: Math.random() * Math.PI,
        };
      }),
    [count],
  );
  return (
    <group>
      {items.map((n, i) => (
        <sprite key={i} position={n.pos} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={radialTexture(n.color)}
            transparent
            opacity={n.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            rotation={n.rot}
          />
        </sprite>
      ))}
    </group>
  );
}
