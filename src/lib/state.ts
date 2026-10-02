// Mutable, non-reactive global state read every frame by the scene + overlay.
export const STOP_VH = 1.25; // how many viewport-heights of scroll per stop
export const HERO = 0;
export const HOME = 9;
export const CONTACT = 10;
export const STOP_COUNT = 11;

export const state = {
  target: 0, // scroll progress (in stops)
  current: 0, // smoothed progress
  entered: false,
  enterTime: 0,
  meteorAt: -100,
  word: "anadi",
  isTouch: false,
};

export function scrollToStop(i: number) {
  const vh = window.innerHeight;
  window.scrollTo({ top: i * vh * STOP_VH, behavior: "smooth" });
}

export function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}
