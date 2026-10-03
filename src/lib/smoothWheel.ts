import { state } from "./state";

// Desktop-only inertia scrolling: the wheel charges a target and a rAF loop
// eases the real scroll toward it, so the whole page glides instead of stepping.
// Touch devices keep their native momentum scrolling.
export function initSmoothWheel(): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768) return () => {};

  let cur = window.scrollY;
  let tgt = cur;
  let last = performance.now();
  let raf = 0;

  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

  const onWheel = (e: WheelEvent) => {
    if (!state.entered || state.flight || e.ctrlKey) return; // pinch-zoom stays native
    const t = e.target as HTMLElement | null;
    if (t && t.closest(".term-scroll")) return; // the terminal and about card scroll natively
    e.preventDefault();
    const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    tgt = Math.min(maxScroll(), Math.max(0, tgt + step));
  };

  const onScroll = () => {
    const y = window.scrollY;
    // scrollbar drags, keyboard and programmatic jumps: adopt, don't fight
    if (Math.abs(y - cur) > 1.5) {
      cur = y;
      tgt = y;
    }
  };

  const onResize = () => {
    cur = Math.min(maxScroll(), cur);
    tgt = Math.min(maxScroll(), tgt);
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.flight) {
      // a guided flight owns the camera and the scroll position
      cur = tgt = window.scrollY;
      return;
    }
    const d = tgt - cur;
    if (Math.abs(d) < 0.5) {
      cur = tgt;
      return;
    }
    cur += d * Math.min(1, dt * 7.5);
    window.scrollTo(0, cur);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  raf = requestAnimationFrame(loop);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    cancelAnimationFrame(raf);
  };
}
