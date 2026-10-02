import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraDistance, visibleHeight } from "../lib/layout";
import { state } from "../lib/state";
import { dotTexture } from "./textures";

const WORLD_W = 11;
const GRADIENT = ["#ffc2d9", "#cdb8ff", "#b5dcff", "#b6f0d2"].map((c) => new THREE.Color(c));

function build(step: number) {
  const W = 900;
  const H = 400;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  let size = 200;
  g.font = `800 ${size}px Fraunces, Georgia, serif`;
  const w = g.measureText("TRIPATHI").width;
  size = Math.floor((size * 840) / w);
  g.font = `800 ${size}px Fraunces, Georgia, serif`;
  g.fillText("ANADI", W / 2, H * 0.3);
  g.fillText("TRIPATHI", W / 2, H * 0.72);
  const data = g.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }
  const n = pts.length / 2;
  const s = WORLD_W / W;
  const target = new Float32Array(n * 3);
  const scatter = new Float32Array(n * 3);
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const delay = new Float32Array(n);
  const tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const px = pts[i * 2];
    const py = pts[i * 2 + 1];
    const tx = (px - W / 2) * s;
    const ty = -(py - H / 2) * s;
    target[i * 3] = tx;
    target[i * 3 + 1] = ty;
    target[i * 3 + 2] = 0;
    // scattered start — a loose galaxy-ish disc
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 18;
    scatter[i * 3] = Math.cos(a) * r;
    scatter[i * 3 + 1] = Math.sin(a) * r * 0.6;
    scatter[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
    pos[i * 3] = scatter[i * 3];
    pos[i * 3 + 1] = scatter[i * 3 + 1];
    pos[i * 3 + 2] = scatter[i * 3 + 2];
    const k = px / W;
    const seg = Math.min(2.999, k * 3);
    const i0 = Math.floor(seg);
    tmp.copy(GRADIENT[i0]).lerp(GRADIENT[i0 + 1], seg - i0);
    const v = 0.55 + Math.random() * 0.2;
    col[i * 3] = tmp.r * v;
    col[i * 3 + 1] = tmp.g * v;
    col[i * 3 + 2] = tmp.b * v;
    delay[i] = k * 0.9 + Math.random() * 0.5;
  }
  return { n, target, scatter, pos, vel, col, delay };
}

export function NameParticles({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const geo = useRef<THREE.BufferGeometry>(null!);
  const [ready, setReady] = useState(false);
  const moved = useRef(false);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let alive = true;
    const go = () => alive && setReady(true);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) fonts.load("800 120px Fraunces").then(go, go);
    const t = window.setTimeout(go, 2500);
    const mv = () => (moved.current = true);
    window.addEventListener("pointermove", mv, { once: true });
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  const data = useMemo(() => (ready ? build(mobile ? 6 : 4) : null), [ready, mobile]);

  useEffect(() => {
    if (!data || !geo.current) return;
    geo.current.setAttribute("position", new THREE.BufferAttribute(data.pos, 3));
    geo.current.setAttribute("color", new THREE.BufferAttribute(data.col, 3));
  }, [data]);

  useFrame((s, dt) => {
    const g = group.current;
    g.visible = state.current < 1.8;
    if (!data || !g.visible) return;
    const aspect = s.size.width / s.size.height;
    const D = cameraDistance(0, aspect);
    const W = visibleHeight(D) * aspect;
    const sc = Math.min(1, (W * 0.9) / WORLD_W);
    g.scale.setScalar(sc);
    g.position.set(0, aspect < 1 ? 0.6 : 0.9, 0);

    const t = s.clock.elapsedTime;
    const since = state.entered ? performance.now() / 1000 - state.enterTime : -1;

    // mouse -> local space of the particle plane
    let mx = 1e5;
    let my = 1e5;
    if (moved.current) {
      s.raycaster.setFromCamera(s.pointer, s.camera);
      if (s.raycaster.ray.intersectPlane(plane, hit)) {
        mx = (hit.x - g.position.x) / sc;
        my = (hit.y - g.position.y) / sc;
      }
    }

    const { n, target, scatter, pos, vel, delay } = data;
    const h = Math.min(dt, 0.04);
    const damp = Math.exp(-5 * h);
    const R = 1.5;
    const R2 = R * R;
    const push = 120 * h;
    const k = 18 * h;
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      const assembled = since - delay[i] > 0;
      let tx: number, ty: number, tz: number;
      if (assembled) {
        tx = target[ix];
        ty = target[ix + 1];
        tz = target[ix + 2] + Math.sin(t * 1.3 + target[ix] * 0.8 + target[ix + 1]) * 0.07;
      } else {
        tx = scatter[ix] + Math.sin(t * 0.3 + i) * 0.4;
        ty = scatter[ix + 1] + Math.cos(t * 0.27 + i * 1.3) * 0.4;
        tz = scatter[ix + 2];
      }
      vel[ix] += (tx - pos[ix]) * k;
      vel[ix + 1] += (ty - pos[ix + 1]) * k;
      vel[ix + 2] += (tz - pos[ix + 2]) * k;
      if (assembled) {
        const dx = pos[ix] - mx;
        const dy = pos[ix + 1] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.0001;
          const f = (1 - d / R) * (1 - d / R) * push;
          vel[ix] += (dx / d) * f;
          vel[ix + 1] += (dy / d) * f;
          vel[ix + 2] += f * 0.6;
        }
      }
      vel[ix] *= damp;
      vel[ix + 1] *= damp;
      vel[ix + 2] *= damp;
      pos[ix] += vel[ix] * h;
      pos[ix + 1] += vel[ix + 1] * h;
      pos[ix + 2] += vel[ix + 2] * h;
    }
    const attr = geo.current.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry ref={geo} />
        <pointsMaterial
          size={0.085}
          sizeAttenuation
          vertexColors
          map={dotTexture()}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.001}
        />
      </points>
    </group>
  );
}
