import { useEffect, useState } from "react";
import { STOP_COUNT, scrollToStop, state } from "../lib/state";
import { sfx } from "../lib/audio";
import { STOP_LABELS } from "./Hud";

// Prev / next planet buttons for touch users — the nav dots are hidden on phones,
// so these two thumbs give the same one-tap travel between stops.
export function NavArrows({ visible }: { visible: boolean }) {
  const [stop, setStop] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const i = Math.round(state.current);
      if (i !== last) {
        last = i;
        setStop(i);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) return null;

  const go = (i: number) => {
    sfx("click");
    scrollToStop(i);
  };

  const btn =
    "grid h-11 w-11 place-items-center rounded-full border border-cream/25 bg-ink/70 text-cream backdrop-blur-md transition active:scale-90";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex items-center justify-center gap-3"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}
    >
      <button
        onClick={() => go(Math.max(0, stop - 1))}
        disabled={stop <= 0}
        aria-label={stop > 0 ? `Back to ${STOP_LABELS[stop - 1]}` : "Start"}
        className={`${btn} pointer-events-auto ${stop <= 0 ? "opacity-30" : "hover:bg-white/10"}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => go(Math.min(STOP_COUNT - 1, stop + 1))}
        disabled={stop >= STOP_COUNT - 1}
        aria-label={stop < STOP_COUNT - 1 ? `Next: ${STOP_LABELS[stop + 1]}` : "End"}
        className={`${btn} pointer-events-auto ${stop >= STOP_COUNT - 1 ? "opacity-30" : "hover:bg-white/10"}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 3v10M8 13l4.5-4.5M8 13L3.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
