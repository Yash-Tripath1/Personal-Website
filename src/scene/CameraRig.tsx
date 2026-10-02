import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { FOV, cameraStop } from "../lib/layout";
import { STOP_COUNT, state } from "../lib/state";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

let mx = 0;
let my = 0;

export function CameraRig() {
  const size = useThree((s) => s.size);

  useFrame((s, dt) => {
    const cam = s.camera as THREE.PerspectiveCamera;
    // smoothed scroll progress
    state.current += (state.target - state.current) * Math.min(1, dt * 4.2);
    if (Math.abs(state.target - state.current) < 0.0004) state.current = state.target;

    const aspect = size.width / size.height;
    const p = clamp(state.current, 0, STOP_COUNT - 1);
    const i = Math.min(Math.floor(p), STOP_COUNT - 2);
    const f = p - i;
    const u = smooth(0.16, 0.84, f);
    const A = cameraStop(i, aspect);
    const B = cameraStop(i + 1, aspect);
    let x = A[0] + (B[0] - A[0]) * u;
    let y = A[1] + (B[1] - A[1]) * u;
    let z = A[2] + (B[2] - A[2]) * u;

    // launch intro: fly in from far away
    let intro = 1;
    if (state.entered) {
      const k = clamp((performance.now() / 1000 - state.enterTime) / 3, 0, 1);
      intro = 1 - Math.pow(1 - k, 3);
    } else {
      intro = 0;
    }
    z += (1 - intro) * 40;

    // soft mouse parallax
    mx += (s.pointer.x - mx) * Math.min(1, dt * 3);
    my += (s.pointer.y - my) * Math.min(1, dt * 3);

    cam.position.set(x + mx * 0.55, y + my * 0.35, z);
    cam.lookAt(x + mx * 1.3, y + my * 0.8, z - 20);
    const bank = Math.sin(u * Math.PI) * 0.05 * (i % 2 === 0 ? 1 : -1);
    cam.rotateZ(bank);

    const fov = FOV + Math.sin(u * Math.PI) * 14 + (1 - intro) * 18;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
