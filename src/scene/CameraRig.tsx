import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { FOV, cameraStop } from "../lib/layout";
import { STOP_COUNT, state } from "../lib/state";
import { sfx } from "../lib/audio";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// gentle in and out, no sudden start or stop
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

let mx = 0;
let my = 0;

// where the camera sits for a (possibly fractional) scroll position
function pathAt(p: number, aspect: number) {
  const c = clamp(p, 0, STOP_COUNT - 1);
  const i = Math.min(Math.floor(c), STOP_COUNT - 2);
  const f = c - i;
  const u = smooth(0.16, 0.84, f);
  const A = cameraStop(i, aspect);
  const B = cameraStop(i + 1, aspect);
  return {
    x: A[0] + (B[0] - A[0]) * u,
    y: A[1] + (B[1] - A[1]) * u,
    z: A[2] + (B[2] - A[2]) * u,
    u,
    i,
  };
}

export function CameraRig() {
  const size = useThree((s) => s.size);

  useFrame((s, dtRaw) => {
    // a long frame (tab switch, slow phone) should not make the camera lurch
    const dt = Math.min(dtRaw, 0.05);
    const cam = s.camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;

    let x: number;
    let y: number;
    let z: number;
    let boost: number; // 0..~1.4, drives field of view stretch
    let bank: number;

    const fl = state.flight;
    if (fl) {
      // guided jump: one continuous eased move straight to the destination
      const k = clamp((performance.now() / 1000 - fl.t0) / fl.dur, 0, 1);
      const e = easeInOut(k);
      state.current = fl.from + (fl.to - fl.from) * e;
      const A = pathAt(fl.from, aspect);
      const B = cameraStop(fl.to, aspect);
      x = A.x + (B[0] - A.x) * e;
      y = A.y + (B[1] - A.y) * e;
      z = A.z + (B[2] - A.z) * e;
      const dist = Math.abs(fl.to - fl.from);
      const arc = Math.sin(k * Math.PI);
      boost = arc * (0.7 + Math.min(dist, 6) * 0.1);
      bank = arc * 0.045 * (fl.to > fl.from ? 1 : -1);
      if (k >= 1) {
        state.flight = null;
        state.current = fl.to;
        state.target = fl.to;
        sfx("arrive", fl.to);
      }
    } else {
      // regular scrolling: smoothed progress
      state.current += (state.target - state.current) * Math.min(1, dt * 3.6);
      if (Math.abs(state.target - state.current) < 0.0004) state.current = state.target;
      const P = pathAt(state.current, aspect);
      x = P.x;
      y = P.y;
      z = P.z;
      const arc = Math.sin(P.u * Math.PI);
      boost = arc * 1.4;
      bank = arc * 0.05 * (P.i % 2 === 0 ? 1 : -1);
    }

    // launch intro: fly in from far away
    let intro = 1;
    if (state.entered) {
      const k = clamp((performance.now() / 1000 - state.enterTime) / 3, 0, 1);
      intro = 1 - Math.pow(1 - k, 3);
    } else {
      intro = 0;
    }
    z += (1 - intro) * 40;

    // soft mouse parallax (off on touch screens, where the pointer is just the last tap)
    const px = state.isTouch ? 0 : s.pointer.x;
    const py = state.isTouch ? 0 : s.pointer.y;
    mx += (px - mx) * Math.min(1, dt * 3);
    my += (py - my) * Math.min(1, dt * 3);

    cam.position.set(x + mx * 0.55, y + my * 0.35, z);
    cam.lookAt(x + mx * 1.3, y + my * 0.8, z - 20);
    cam.rotateZ(bank);

    const fov = FOV + boost * 10 + (1 - intro) * 18;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
