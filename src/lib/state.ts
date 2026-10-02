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
  isTouch: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
  flight: null as Flight | null, // a guided jump between planets
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// The scroll range is read from the real document height, so the mapping stays
// correct even when a phone's browser bars grow or shrink and change the
// viewport height mid scroll.
function maxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

export function progressFromScroll() {
  return clamp((window.scrollY / maxScroll()) * (STOP_COUNT - 1), 0, STOP_COUNT - 1);
}

const scrollTopFor = (i: number) => (i / (STOP_COUNT - 1)) * maxScroll();

// Guided flight: one continuous eased camera move, instead of native smooth
// scrolling that makes the camera stop at every planet on the way.
export function scrollToStop(i: number) {
  if (!state.entered) return;
  const to = clamp(Math.round(i), 0, STOP_COUNT - 1);
  const from = state.current;
  const dist = Math.abs(to - from);
  if (dist < 0.02) return;
  const dur = Math.min(3.8, 1.6 + dist * 0.38);
  state.flight = { from, to, t0: performance.now() / 1000, dur };
  state.target = to;
  window.scrollTo(0, scrollTopFor(to));
}

// next / previous planet, used by the on screen arrows
export function stepStop(dir: 1 | -1) {
  const base = state.flight ? state.flight.to : Math.round(state.current);
  scrollToStop(base + dir);
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
