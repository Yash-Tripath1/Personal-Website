import { useEffect, useState } from "react";

/* Professional loader: the live 3D starfield glows blurred behind a glass veil,
   an orbit emblem turns, the wordmark rises letter by letter, and a hairline —
   not a percentage — tracks readiness. */
export function Preloader({ onEnter, leaving }: { onEnter: (sound: boolean) => void; leaving: boolean }) {
  const [p, setP] = useState(0);
  const ready = p >= 100;

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / 2400);
      setP(Math.round((1 - Math.pow(1 - k, 2.2)) * 100));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const word = "ANADI TRIPATHI";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
      style={{
        background: "rgba(18, 13, 40, 0.52)",
        backdropFilter: "blur(18px) saturate(1.25)",
        WebkitBackdropFilter: "blur(18px) saturate(1.25)",
        transform: leaving ? "translateY(-105%)" : "none",
        transition: leaving ? "transform 0.9s cubic-bezier(0.7, 0, 0.3, 1)" : undefined,
      }}
    >
      <div className="flex flex-col items-center px-6 text-center">
        {/* orbit emblem */}
        <div className="relative h-24 w-24 md:h-28 md:w-28" aria-hidden>
          <div
            className="absolute inset-[-40%] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(205,184,255,0.28), transparent 65%)", filter: "blur(6px)" }}
          />
          {/* tilted ring, slow counter-spin */}
          <div className="absolute inset-0" style={{ animation: "orbitSpinRev 9s linear infinite" }}>
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <ellipse cx="50" cy="50" rx="46" ry="17" fill="none" stroke="rgba(255,194,217,0.55)" strokeWidth="1" transform="rotate(-18 50 50)" />
            </svg>
          </div>
          {/* outer ring with an orbiting satellite */}
          <div className="absolute inset-0" style={{ animation: "orbitSpin 3.6s linear infinite" }}>
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,244,234,0.25)" strokeWidth="1" />
              <circle cx="50" cy="10" r="3.2" fill="#b6f0d2" />
            </svg>
          </div>
          {/* core planet */}
          <div
            className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full md:h-8 md:w-8"
            style={{
              background: "linear-gradient(135deg, #cdb8ff 0%, #ffc2d9 55%, #b5dcff 100%)",
              boxShadow: "0 0 26px 4px rgba(205,184,255,0.45), inset -4px -5px 10px rgba(28,22,54,0.55)",
            }}
          />
        </div>

        {/* wordmark */}
        <h1 className="mt-8 flex font-display text-[26px] font-extrabold tracking-[0.18em] text-cream md:text-[34px]" aria-label={word}>
          {word.split("").map((ch, i) => (
            <span
              key={i}
              className="inline-block"
              style={{ animation: `riseIn 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) ${0.12 + i * 0.045}s both` }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>
        <p
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.42em] text-cream/55 md:text-[11px]"
          style={{ animation: "riseIn 0.8s ease 0.75s both" }}
        >
          Developer · Portfolio 2026
        </p>

        {/* hairline progress — no numbers */}
        <div
          className="mt-9 h-[2px] w-[min(70vw,320px)] overflow-hidden rounded-full bg-white/10"
          style={{ animation: "riseIn 0.8s ease 0.9s both" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${p}%`,
              background: "linear-gradient(90deg, #ffc2d9, #cdb8ff 55%, #b5dcff)",
              boxShadow: "0 0 12px 1px rgba(255,194,217,0.55)",
            }}
          />
        </div>
        <p
          className="mt-3 h-4 font-mono text-[10px] uppercase tracking-[0.3em] text-cream/40"
          style={{ animation: "riseIn 0.8s ease 1s both" }}
        >
          {ready ? "ready when you are" : "aligning orbits"}
        </p>

        <div
          className="mt-8 flex flex-col items-center gap-3 transition-all duration-700 sm:flex-row"
          style={{ opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(14px)", pointerEvents: ready ? "auto" : "none" }}
        >
          <button
            onClick={() => onEnter(true)}
            className="rounded-full bg-cream px-7 py-3 font-sans text-sm font-bold text-ink transition hover:scale-105 hover:bg-blush"
            style={{ boxShadow: "0 0 40px -8px rgba(255,194,217,0.55)" }}
          >
            ♪ Enter with sound
          </button>
          <button
            onClick={() => onEnter(false)}
            className="rounded-full border border-cream/30 px-7 py-3 font-sans text-sm font-medium text-cream/85 transition hover:bg-white/10"
          >
            Enter silent
          </button>
        </div>
      </div>
    </div>
  );
}
