import { PROJECTS } from "../data/projects";
import { CONTACT, HOME, STOP_COUNT, scrollToStop } from "../lib/state";

export const STOP_LABELS = ["Hello", ...PROJECTS.map((p) => p.name), "About", "Contact"];

export function Hud({
  visible,
  active,
  soundOn,
  onToggleSound,
}: {
  visible: boolean;
  active: number;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const projNo = active >= 1 && active <= PROJECTS.length ? `${String(active).padStart(2, "0")} / ${String(PROJECTS.length).padStart(2, "0")}` : "";
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0, transitionDelay: visible ? "1.2s" : "0s" }}
    >
      {/* top-left logo */}
      <button
        onClick={() => scrollToStop(0)}
        className="pointer-events-auto absolute left-5 top-5 flex items-center gap-2.5 md:left-9 md:top-7"
        aria-label="Back to top"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-cream font-display text-sm font-extrabold text-ink">AT</span>
        <span className="hidden font-display text-lg font-bold italic leading-none sm:block">yashh</span>
      </button>

      {/* top-right controls */}
      <div className="absolute right-5 top-5 flex items-center gap-2 md:right-9 md:top-7">
        <button
          onClick={onToggleSound}
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full border border-cream/30 bg-white/5 px-3.5 font-mono text-[11px] uppercase tracking-widest backdrop-blur-md transition hover:bg-white/15"
          aria-label="Toggle music"
        >
          <span className="flex h-4 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[2px] rounded bg-cream"
                style={{
                  height: soundOn ? undefined : 4,
                  animation: soundOn ? `eq ${0.7 + i * 0.17}s ease-in-out ${i * 0.1}s infinite` : "none",
                }}
              />
            ))}
          </span>
          <span className="hidden sm:inline">{soundOn ? "music on" : "music off"}</span>
        </button>
        <button
          onClick={() => scrollToStop(CONTACT)}
          className="pointer-events-auto h-9 rounded-full bg-blush px-4 font-sans text-xs font-bold text-ink transition hover:scale-105"
        >
          Say hi
        </button>
      </div>

      {/* nav dots */}
      <nav className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex" aria-label="Planets">
        {Array.from({ length: STOP_COUNT }, (_, i) => (
          <button
            key={i}
            onClick={() => scrollToStop(i)}
            className="group pointer-events-auto flex items-center gap-3"
            aria-label={STOP_LABELS[i]}
          >
            <span className="translate-x-2 font-mono text-[10px] uppercase tracking-widest text-cream opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
              {STOP_LABELS[i]}
            </span>
            <span
              className="block rounded-full bg-cream transition-all"
              style={{
                width: active === i ? 10 : 6,
                height: active === i ? 10 : 6,
                opacity: active === i ? 1 : 0.4,
                boxShadow: active === i ? "0 0 14px 2px rgba(255,194,217,0.8)" : "none",
              }}
            />
          </button>
        ))}
      </nav>

      {/* bottom-left counter */}
      <div className="absolute bottom-5 left-5 flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/70 md:bottom-7 md:left-9">
        <span className="text-cream">{projNo || (active === HOME ? "home" : active === CONTACT ? "end" : "start")}</span>
        <span className="hidden sm:inline">{STOP_LABELS[active]}</span>
      </div>
    </div>
  );
}
