// Mutable, non-reactive global state read every frame by the scene and overlay.
export const STOP_VH = 1.25; // how many viewport heights of scroll per stop
export const HERO = 0;
export const HOME = 9;
export const CONTACT = 10;
export const STOP_COUNT = 11;

export type Flight = { from: number; to: number; t0: number; dur: number };

export const state = {
  target: 0, // scroll progress (in stops)
  current: 0, // smoothed progress
  entered: false,
  enterTime: 0,
  meteorAt: -100,
  word: "anadi",
  isTouch: false,
  flight: null as Flight | null, // a guided jump between planets
};

const scrollTopFor = (i: number) => i * window.innerHeight * STOP_VH;

// Guided flight: one continuous eased camera move, instead of native smooth
// scrolling that makes the camera stop at every planet on the way.
export function scrollToStop(i: number) {
  if (!state.entered) return;
  const to = Math.min(STOP_COUNT - 1, Math.max(0, i));
  const from = state.current;
  const dist = Math.abs(to - from);
  if (dist < 0.02) return;
  const dur = Math.min(3.8, 1.6 + dist * 0.38);
  state.flight = { from, to, t0: performance.now() / 1000, dur };
  state.target = to;
  window.scrollTo(0, scrollTopFor(to));
}

// If the user grabs the wheel mid flight, hand control back from where we are.
export function cancelFlight() {
  if (!state.flight) return;
  const p = state.current;
  state.flight = null;
  state.target = p;
  window.scrollTo(0, scrollTopFor(p));
}

export function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

// decided once at load: phones and tablets get lighter geometry and effects
export const IS_MOBILE =
  typeof window !== "undefined" && (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
