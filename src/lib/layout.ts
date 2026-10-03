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
  const base = i === HERO ? 13.5 : 10.8;
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
  // the contact object sits further out to the left so the terminal stays clear
  const dx = portrait ? 0 : W * (i === CONTACT ? 0.33 : 0.25);
  const shiftY = portrait ? H * (i === CONTACT ? 0.3 : 0.2) : 0;
  return [px - sideOf(i) * dx, py - shiftY, pz + D];
}
