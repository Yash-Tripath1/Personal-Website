import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "../data/projects";
import { CONTACT, HOME, STOP_COUNT, scrollToStop, stepStop } from "../lib/state";
import { TRACKS, type TrackId } from "../lib/audio";

export const STOP_LABELS = ["Hello", ...PROJECTS.map((p) => p.name), "About", "Contact"];

function Equalizer({ on }: { on: boolean }) {
  return (
    <span className="flex h-4 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded bg-cream"
          style={{
            height: on ? undefined : 4,
            animation: on ? `eq ${0.7 + i * 0.17}s ease-in-out ${i * 0.1}s infinite` : "none",
          }}
        />
      ))}
    </span>
  );
}

function MusicMenu({
  soundOn,
  track,
  onToggleSound,
  onSelectTrack,
}: {
  soundOn: boolean;
  track: TrackId;
  onToggleSound: () => void;
  onSelectTrack: (id: TrackId) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = TRACKS.find((t) => t.id === track) ?? TRACKS[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={wrap} className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full border border-cream/50 bg-[#1c1636]/75 px-3.5 font-mono text-[11px] uppercase tracking-widest text-cream backdrop-blur-md transition hover:bg-white/15 md:h-9"
        aria-label="Choose music"
        aria-expanded={open}
      >
        <Equalizer on={soundOn} />
        <span className="hidden sm:inline">{soundOn ? current.name : "music off"}</span>
        <span className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div
          className="glass-solid absolute right-0 top-12 w-[min(270px,calc(100vw-2.5rem))] rounded-2xl p-2"
          style={{ animation: "menuIn 0.18s ease-out" }}
        >
          <p className="px-3 pb-1.5 pt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/80">Pick a track</p>
          {TRACKS.map((t) => {
            const selected = soundOn && t.id === track;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTrack(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  selected ? "bg-blush/20" : "hover:bg-white/10"
                }`}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center">
                  {selected ? <Equalizer on /> : <span className="h-1.5 w-1.5 rounded-full bg-cream/60" />}
                </span>
                <span className="min-w-0">
                  <span className={`block font-display text-[15px] font-bold leading-tight ${selected ? "text-blush" : ""}`}>
                    {t.name}
                  </span>
                  <span className="block truncate text-[12.5px] text-cream/80">{t.mood}</span>
                </span>
              </button>
            );
          })}
          <div className="mt-1 border-t border-white/15 pt-1">
            <button
              onClick={onToggleSound}
              className="w-full rounded-xl px-3 py-3 text-left font-mono text-[11.5px] uppercase tracking-widest text-cream transition hover:bg-white/10"
            >
              {soundOn ? "Turn music off" : "Turn music on"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepButton({ dir, disabled }: { dir: 1 | -1; disabled: boolean }) {
  return (
    <button
      onClick={() => stepStop(dir)}
      disabled={disabled}
      aria-label={dir === 1 ? "Next planet" : "Previous planet"}
      className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-cream/50 bg-[#1c1636]/80 text-lg text-cream transition active:scale-90 disabled:opacity-30"
    >
      {dir === 1 ? "↓" : "↑"}
    </button>
  );
}

export function Hud({
  visible,
  active,
  soundOn,
  track,
  onToggleSound,
  onSelectTrack,
}: {
  visible: boolean;
  active: number;
  soundOn: boolean;
  track: TrackId;
  onToggleSound: () => void;
  onSelectTrack: (id: TrackId) => void;
}) {
  const projNo =
    active >= 1 && active <= PROJECTS.length
      ? `${String(active).padStart(2, "0")} / ${String(PROJECTS.length).padStart(2, "0")}`
      : "";
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0, transitionDelay: visible ? "1.2s" : "0s" }}
    >
      {/* soft scrims so the controls stay readable over bright planets */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#1c1636]/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1c1636]/70 to-transparent md:hidden" />

      {/* top left logo */}
      <button
        onClick={() => scrollToStop(0)}
        className="pointer-events-auto absolute flex items-center gap-2.5 md:left-9 md:top-7"
        style={{ left: "1.25rem", top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        aria-label="Back to top"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-cream font-display text-sm font-extrabold text-ink md:h-9 md:w-9">
          AT
        </span>
        <span className="legible hidden font-display text-lg font-bold italic leading-none sm:block">Anadi</span>
      </button>

      {/* top right controls */}
      <div
        className="absolute flex items-center gap-2 md:right-9 md:top-7"
        style={{ right: "1.25rem", top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <MusicMenu soundOn={soundOn} track={track} onToggleSound={onToggleSound} onSelectTrack={onSelectTrack} />
        <button
          onClick={() => scrollToStop(CONTACT)}
          className="pointer-events-auto h-10 rounded-full bg-blush px-4 font-sans text-[13px] font-bold text-ink transition hover:scale-105 active:scale-95 md:h-9 md:text-xs"
        >
          Say hi
        </button>
      </div>

      {/* nav dots (desktop) */}
      <nav className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex" aria-label="Planets">
        {Array.from({ length: STOP_COUNT }, (_, i) => (
          <button
            key={i}
            onClick={() => scrollToStop(i)}
            className="group pointer-events-auto flex items-center gap-3 py-0.5"
            aria-label={STOP_LABELS[i]}
          >
            <span className="legible translate-x-2 font-mono text-[11px] uppercase tracking-widest text-cream opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
              {STOP_LABELS[i]}
            </span>
            <span
              className="block rounded-full bg-cream transition-all"
              style={{
                width: active === i ? 10 : 7,
                height: active === i ? 10 : 7,
                opacity: active === i ? 1 : 0.55,
                boxShadow: active === i ? "0 0 14px 2px rgba(255,194,217,0.8)" : "0 0 6px rgba(12,6,32,0.8)",
              }}
            />
          </button>
        ))}
      </nav>

      {/* bottom left counter */}
      <div
        className="legible absolute flex items-baseline gap-3 font-mono text-[12px] uppercase tracking-[0.2em] text-cream md:bottom-7 md:left-9"
        style={{ left: "1.25rem", bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <span className="text-cream">{projNo || (active === HOME ? "about" : active === CONTACT ? "end" : "start")}</span>
        <span className="hidden text-cream/90 sm:inline">{STOP_LABELS[active]}</span>
      </div>

      {/* bottom right: previous / next planet, for thumbs */}
      <div
        className="absolute flex items-center gap-2 md:hidden"
        style={{ right: "1.25rem", bottom: "calc(0.9rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <StepButton dir={-1} disabled={active <= 0} />
        <StepButton dir={1} disabled={active >= STOP_COUNT - 1} />
      </div>
    </div>
  );
}
