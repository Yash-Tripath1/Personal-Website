import { useEffect, useState } from "react";

export function Preloader({ onEnter, leaving }: { onEnter: (sound: boolean) => void; leaving: boolean }) {
  const [p, setP] = useState(0);
  const ready = p >= 100;

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const k = Math.min(1, (performance.now() - t0) / 2400);
      const eased = 1 - Math.pow(1 - k, 2.2);
      setP(Math.round(eased * 100));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background:
          "radial-gradient(60% 50% at 20% 20%, #4a3a86 0%, transparent 70%), radial-gradient(50% 50% at 85% 80%, #6a3f78 0%, transparent 70%), #1c1636",
        transform: leaving ? "translateY(-105%)" : "translateY(0)",
        transition: "transform 1.1s cubic-bezier(.77,0,.18,1)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="absolute left-5 top-5 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/85 md:left-10 md:top-8 md:text-[12px] md:tracking-[0.25em]">
        Anadi Tripathi · Portfolio 2026
      </div>
      <div className="absolute right-5 top-12 font-mono text-[11px] uppercase tracking-[0.22em] text-cream/85 md:right-10 md:top-8 md:text-[12px] md:tracking-[0.25em]">
        Lucknow, IN
      </div>

      <div className="relative text-center">
        <div className="font-display text-[26vw] font-extrabold leading-none tracking-tight text-cream md:text-[14vw]">
          {String(p).padStart(2, "0")}
          <span className="text-blush">%</span>
        </div>
        <p className="mt-2 font-display text-lg italic text-lilac md:text-2xl">loading the universe…</p>
      </div>

      <div className="relative mt-10 h-8 w-[78vw] max-w-[520px]">
        <div className="absolute left-0 right-0 top-6 h-[2px] rounded bg-cream/25" />
        <div
          className="absolute left-0 top-6 h-[2px] rounded bg-gradient-to-r from-blush via-lilac to-mint"
          style={{ width: `${p}%` }}
        />
        <div className="absolute top-0 text-2xl" style={{ left: `${p}%`, transform: "translateX(-50%) scaleX(-1)" }}>
          🦖
        </div>
      </div>

      <div
        className="mt-10 flex w-full max-w-[340px] flex-col items-stretch gap-3 transition-all duration-700 sm:w-auto sm:max-w-none sm:flex-row sm:items-center md:mt-12"
        style={{ opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(14px)", pointerEvents: ready ? "auto" : "none" }}
      >
        <button
          onClick={() => onEnter(true)}
          className="rounded-full bg-cream px-7 py-4 font-sans text-[15px] font-bold text-ink transition active:scale-95 hover:scale-105 hover:bg-blush sm:py-3.5 sm:text-sm"
        >
          ♪ Launch with music
        </button>
        <button
          onClick={() => onEnter(false)}
          className="rounded-full border border-cream/60 px-7 py-4 font-sans text-[15px] font-medium text-cream transition active:scale-95 hover:bg-white/10 sm:py-3.5 sm:text-sm"
        >
          Launch silent
        </button>
      </div>
    </div>
  );
}
