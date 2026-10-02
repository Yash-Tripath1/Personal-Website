import { useEffect, useRef, useState } from "react";
import { on } from "../lib/bus";

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [big, setBig] = useState(false);
  const [enabled] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches);

  useEffect(() => on<string>("cursor-label", setLabel), []);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("has-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const el = e.target as HTMLElement | null;
      setBig(!!el?.closest("a,button,input,[data-hover]"));
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;
  const grow = big || !!label;
  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-[6px] w-[6px] rounded-full bg-cream mix-blend-difference"
      />
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[99] flex items-center justify-center rounded-full border border-cream/70 transition-[width,height,background-color] duration-300"
        style={{
          width: grow ? 76 : 34,
          height: grow ? 76 : 34,
          backgroundColor: label ? "rgba(255,194,217,0.22)" : "transparent",
        }}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream">{label}</span>
      </div>
    </>
  );
}
