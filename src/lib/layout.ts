import { CONTACT, HERO } from "./state";

export const SPACING = 26;
export const FOV = 45;
export const PLANET_R = 2.2;

export function stopPos(i: number): [number, number, number] {
  if (i === HERO) return [0, 0, 0];
  return [Math.sin(i * 1.9) * 2.5, Math.cos(i * 1.4) * 1.2, -i * SPACING];
}

// +1 means the planet appears on the right of the screen (card on the left)
export function sideOf(i: number) {
  return i % 2 === 1 ? 1 : -1;
}

export function cameraDistance(i: number, aspect: number) {
  const base = i === HERO ? 12 : 9;
  const portrait = aspect < 1 ? (1 - aspect) * (i === HERO ? 10 : 16) : 0;
  return base + portrait;
}

const tanHalf = Math.tan((FOV * Math.PI) / 360);

export function visibleHeight(dist: number) {
  return 2 * dist * tanHalf;
}

export function cameraStop(i: number, aspect: number): [number, number, number] {
  const [px, py, pz] = stopPos(i);
  const D = cameraDistance(i, aspect);
  if (i === HERO) return [0, 0, D];
  const H = visibleHeight(D);
  const W = H * aspect;
  const portrait = aspect < 1;
  // The contact scene is centred in the free space left of the terminal card, so
  // nothing is clipped at the screen edge and nothing hides behind the card.
  let dx = 0;
  if (!portrait) {
    if (i === CONTACT && typeof window !== "undefined") {
      const w = window.innerWidth;
      const cardLeft = Math.max(0.2, 0.95 - Math.min(640, w * 0.9) / w);
      dx = W * (0.5 - cardLeft / 2);
    } else {
      dx = W * 0.25;
    }
  }
  // on phones the card covers the lower half, so the planet is lifted into the top half
  const shiftY = portrait ? H * (i === CONTACT ? 0.3 : 0.22) : 0;
  return [px - sideOf(i) * dx, py - shiftY, pz + D];
}
