import { useEffect, useRef, useState } from "react";

const STAR_COLORS = ["#ffffff", "#ffe3f0", "#e3dcff", "#d8efff", "#d9ffee", "#fff2d6"];
const SHOOTER_COLORS = ["#fff4ea", "#ffc2d9", "#cdb8ff", "#b5dcff"];

type Star = { x: number; y: number; r: number; tw: number; sp: number; dr: number; col: string };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string };

export function Preloader({ onEnter, leaving }: { onEnter: (sound: boolean) => void; leaving: boolean }) {
  const [p, setP] = useState(0);
  const ready = p >= 100;
  const sky = useRef<HTMLCanvasElement>(null);

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

  // twinkling starfield with the occasional shooting star, hand drawn on a 2D canvas
  useEffect(() => {
    const c = sky.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    let stars: Star[] = [];
    let shots: Shot[] = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 768 ? 110 : 200;
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.pow(Math.random(), 3) * 1.7,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 2.4,
        dr: 2 + Math.random() * 7,
        col: STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0],
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      g.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.tw += dt * s.sp;
        s.y += s.dr * dt;
        if (s.y > h + 3) {
          s.y = -3;
          s.x = Math.random() * w;
        }
        const a = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw));
        g.globalAlpha = a;
        g.fillStyle = s.col;
        g.beginPath();
        g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        g.fill();
        if (s.r > 1.35) {
          // a tiny cross sparkle on the brightest few
          g.globalAlpha = a * 0.45;
          g.strokeStyle = s.col;
          g.lineWidth = 0.7;
          const L = s.r * 3.2;
          g.beginPath();
          g.moveTo(s.x - L, s.y);
          g.lineTo(s.x + L, s.y);
          g.moveTo(s.x, s.y - L);
          g.lineTo(s.x, s.y + L);
          g.stroke();
        }
      }

      // shooting stars, at most two at a time
      if (shots.length < 2 && Math.random() < dt * 0.4) {
        shots.push({
          x: w * (0.45 + Math.random() * 0.55),
          y: -10,
          vx: -(90 + Math.random() * 140),
          vy: 150 + Math.random() * 160,
          life: 0,
          max: 1.1 + Math.random() * 0.5,
          col: SHOOTER_COLORS[(Math.random() * SHOOTER_COLORS.length) | 0],
        });
      }
      shots = shots.filter((sh) => {
        sh.life += dt;
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        const k = 1 - sh.life / sh.max;
        if (k <= 0 || sh.y > h + 30) return false;
        const len = Math.hypot(sh.vx, sh.vy) || 1;
        const tx = sh.x - (sh.vx / len) * 90;
        const ty = sh.y - (sh.vy / len) * 90;
        const grad = g.createLinearGradient(sh.x, sh.y, tx, ty);
        grad.addColorStop(0, sh.col);
        grad.addColorStop(1, "rgba(255,244,234,0)");
        g.globalAlpha = Math.min(1, k * 1.6);
        g.strokeStyle = grad;
        g.lineWidth = 1.6;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(sh.x, sh.y);
        g.lineTo(tx, ty);
        g.stroke();
        g.globalAlpha = Math.min(1, k * 2);
        g.fillStyle = "#fff4ea";
        g.beginPath();
        g.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2);
        g.fill();
        return true;
      });
      g.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 50% at 20% 20%, #4a3a86 0%, transparent 70%), radial-gradient(50% 50% at 85% 80%, #6a3f78 0%, transparent 70%), #1c1636",
        transform: leaving ? "translateY(-105%)" : "translateY(0)",
        transition: "transform 1.1s cubic-bezier(.77,0,.18,1)",
      }}
    >
      {/* the sky */}
      <canvas ref={sky} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      {/* soft glow breathing behind the glass */}
      <div className="pointer-events-none absolute h-[46vmin] w-[70vmin] rounded-full bg-blush/15 blur-[90px]" aria-hidden />

      {/* corner labels: stacked + centred on narrow screens, corners on md+ */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-col items-center gap-2 px-4 md:static md:block">
        <span className="rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.25em] text-cream/70 backdrop-blur-md md:absolute md:left-10 md:top-8 md:text-[11px]">
          Anadi Tripathi · Portfolio 2026
        </span>
        <span className="rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.25em] text-cream/70 backdrop-blur-md md:absolute md:right-10 md:top-8 md:text-[11px]">
          Lucknow, IN
        </span>
      </div>

      {/* glass panel */}
      <div
        className="relative w-[min(90vw,540px)] rounded-[28px] px-5 pb-6 pt-7 text-center md:rounded-[36px] md:px-12 md:pb-9 md:pt-10"
        style={{
          background: "linear-gradient(150deg, rgba(255,244,234,0.14), rgba(255,244,234,0.05) 55%, rgba(205,184,255,0.09))",
          border: "1px solid rgba(255,244,234,0.22)",
          backdropFilter: "blur(26px) saturate(1.35)",
          WebkitBackdropFilter: "blur(26px) saturate(1.35)",
          boxShadow: "0 40px 120px -40px rgba(8,4,26,0.85), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <div
          className="font-display font-extrabold leading-none tracking-tight"
          style={{
            fontSize: "clamp(4.5rem, 24vw, 9.5rem)",
            backgroundImage: "linear-gradient(100deg,#ffc2d9 0%,#cdb8ff 45%,#b5dcff 75%,#b6f0d2 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {String(p).padStart(2, "0")}
          <span>%</span>
        </div>
        <p className="mt-2 font-display text-lg italic text-lilac md:text-2xl">loading the universe…</p>

        {/* glass progress track, the dino still rides along */}
        <div className="relative mx-auto mt-7 h-10 w-full md:mt-9">
          <div className="absolute bottom-2 left-0 right-0 h-[10px] rounded-full border border-white/15 bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${p}%`,
                background: "linear-gradient(90deg,#ffc2d9,#cdb8ff,#b6f0d2)",
                boxShadow: "0 0 18px 2px rgba(255,194,217,0.5)",
              }}
            />
          </div>
          <div
            className="absolute bottom-[26px] text-2xl md:text-3xl"
            style={{
              left: `${p}%`,
              transform: "translateX(-50%) scaleX(-1)",
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
            }}
          >
            🦖
          </div>
        </div>
      </div>

      <div
        className="mt-9 flex flex-col items-center gap-3 transition-all duration-700 sm:flex-row md:mt-11"
        style={{ opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(14px)", pointerEvents: ready ? "auto" : "none" }}
      >
        <button
          onClick={() => onEnter(true)}
          className="rounded-full bg-cream px-7 py-3.5 font-sans text-sm font-bold text-ink transition hover:scale-105 hover:bg-blush"
          style={{ boxShadow: "0 0 44px -6px rgba(255,194,217,0.5)" }}
        >
          ♪ Launch with music
        </button>
        <button
          onClick={() => onEnter(false)}
          className="rounded-full border border-cream/40 px-7 py-3.5 font-sans text-sm font-medium text-cream backdrop-blur-md transition hover:bg-white/10"
          style={{ background: "rgba(255,244,234,0.06)" }}
        >
          Launch silent
        </button>
      </div>
    </div>
  );
}
