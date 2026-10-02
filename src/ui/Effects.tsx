import { useEffect, useRef, useState } from "react";
import { on, type ToastDetail } from "../lib/bus";

type T = ToastDetail & { id: number };

// how long a message stays on screen
const TOAST_MS = 3800;

export function Toasts() {
  const [items, setItems] = useState<T[]>([]);
  const id = useRef(0);

  useEffect(
    () =>
      on<ToastDetail>("toast", (d) => {
        const n = ++id.current;
        // keep at most two on screen so nothing piles up
        setItems((l) => [...l.slice(-1), { ...d, id: n }]);
        window.setTimeout(() => setItems((l) => l.filter((t) => t.id !== n)), TOAST_MS + 100);
      }),
    [],
  );

  // long lines wrap instead of running off a narrow phone screen
  const maxW = Math.min(340, window.innerWidth - 32);
  const half = maxW / 2;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {items.map((t) => (
        <div
          key={t.id}
          className="absolute w-max rounded-2xl border border-white/30 bg-[#1c1636]/95 px-4 py-2.5 text-center font-display text-[15px] italic leading-snug text-cream shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] md:text-[16px]"
          style={{
            maxWidth: maxW,
            left: Math.min(Math.max(t.x, half + 16), window.innerWidth - half - 16),
            top: Math.max(70, t.y),
            animation: `floatUp ${TOAST_MS}ms cubic-bezier(.2,.7,.2,1) forwards`,
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Flash() {
  const [key, setKey] = useState(0);
  useEffect(() => on("flash", () => setKey((k) => k + 1)), []);
  if (!key) return null;
  return (
    <div
      key={key}
      className="pointer-events-none fixed inset-0 z-[70] bg-white"
      style={{ animation: "flashOut 0.7s ease-out forwards" }}
    />
  );
}
