import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EDUCATION, LINKS, PROJECTS, type Project } from "../data/projects";
import { STOP_COUNT, scrollToStop, state } from "../lib/state";
import { sideOf } from "../lib/layout";
import { Terminal } from "./Terminal";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

type Register = (i: number, el: HTMLDivElement | null) => void;

function Stop({ index, children, register, hero }: { index: number; children: ReactNode; register: Register; hero?: boolean }) {
  const side = sideOf(index);
  const pos = hero
    ? "items-end justify-center hero-pad"
    : `items-end justify-center stop-pad md:items-center ${side === 1 ? "md:justify-start" : "md:justify-end"}`;
  return (
    <div ref={(el) => register(index, el)} className={`stop fixed inset-0 z-20 flex px-4 md:px-[5vw] pointer-events-none ${pos}`}>
      {children}
    </div>
  );
}

function Chip({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="rounded-full border px-3 py-1 font-mono text-[11.5px] font-medium tracking-wide"
      style={{ borderColor: color + "aa", color, background: color + "22" }}
    >
      {children}
    </span>
  );
}

function Hero() {
  return (
    <div className="card legible flex flex-col items-center gap-3 text-center">
      <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-cream md:text-[13px] md:tracking-[0.25em]">
        18 · self taught developer · Lucknow
      </p>
      <p className="max-w-[30ch] font-display text-[18px] italic leading-snug text-lilac md:text-[22px]">
        every planet here is something I built
      </p>
      <button
        onClick={() => scrollToStop(1)}
        className="pointer-events-auto mt-2 flex flex-col items-center gap-1 rounded-full border border-cream/50 bg-[#1c1636]/70 px-6 py-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-cream transition hover:bg-white/15 active:scale-95"
      >
        <span>{state.isTouch ? "swipe up" : "scroll"} to fly</span>
        <span className="bob-anim text-base leading-none" style={{ animation: "bob 1.8s ease-in-out infinite" }}>
          ↓
        </span>
      </button>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [word, setWord] = useState(state.word);
  return (
    <article className="card glass card-fit term-scroll w-full rounded-[26px] p-5 md:max-w-[470px] md:rounded-[30px] md:p-8">
      <div className="flex items-center justify-between gap-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-cream/90">
        <span className="font-bold" style={{ color: project.accent }}>
          {String(index).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
        </span>
        <span className="truncate text-right">{project.kind}</span>
      </div>

      <h2
        className="mt-3 font-display text-[38px] font-extrabold leading-[0.98] tracking-tight md:mt-4 md:text-[64px] md:leading-[0.95]"
        style={{ color: project.accent }}
      >
        {project.name}
      </h2>

      <p className="mt-3 text-[14.5px] leading-relaxed text-cream md:mt-5 md:text-[16px]">{project.desc}</p>

      {project.id === "veyra" && (
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/30 bg-black/30 px-4 py-2.5">
          <span className="font-mono text-[11.5px] uppercase tracking-widest text-cream/85">aura of</span>
          <input
            value={word}
            maxLength={28}
            onChange={(e) => {
              setWord(e.target.value);
              state.word = e.target.value;
            }}
            placeholder="type anything…"
            className="min-w-0 flex-1 bg-transparent font-display text-[18px] italic text-cream outline-none placeholder:text-cream/55"
            spellCheck={false}
          />
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 md:mt-5">
        {project.tags.map((t) => (
          <Chip key={t} color={project.accent}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5 md:mt-6">
        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-5 py-3 text-[13.5px] font-bold text-ink transition hover:scale-105 active:scale-95 md:py-2.5"
            style={{ background: project.accent }}
          >
            Live site ↗
          </a>
        )}
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className={
            project.live
              ? "rounded-full border border-cream/55 px-5 py-3 text-[13.5px] font-medium text-cream transition hover:bg-white/10 active:scale-95 md:py-2.5"
              : "rounded-full px-5 py-3 text-[13.5px] font-bold text-ink transition hover:scale-105 active:scale-95 md:py-2.5"
          }
          style={project.live ? undefined : { background: project.accent }}
        >
          GitHub ↗
        </a>
      </div>

      <p className="mt-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-cream/80">
        ↳ {state.isTouch ? "tap" : "click"} the planet to {project.hint}
      </p>
    </article>
  );
}

const STACK = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Vite",
  "Node/Express",
  "Tailwind",
  "Electron",
  "Firebase",
  "Groq",
  "llama.cpp / Ollama",
  "Linux",
  "Vercel",
  "n8n",
];

function AboutCard() {
  return (
    <article className="card glass card-fit term-scroll w-full rounded-[26px] p-5 md:max-w-[570px] md:rounded-[30px] md:p-8">
      <p className="font-mono text-[11.5px] font-bold uppercase tracking-[0.2em] text-mint">about</p>
      <h2 className="mt-3 font-display text-[32px] font-extrabold leading-[1] tracking-tight md:text-[48px]">
        I'm <span className="italic text-blush">Anadi.</span>
      </h2>
      <p className="mt-4 text-[14.5px] leading-relaxed text-cream md:text-[16px]">
        I'm 18, self taught, and based in Lucknow. I ship end to end products: a browser engine, a language model trained from scratch,
        and desktop and web apps. I'm a cofounder of{" "}
        <a href={LINKS.glymph} target="_blank" rel="noreferrer" className="text-lilac underline underline-offset-4 hover:text-blush">
          Glymph Studio
        </a>
        , an indie dev studio that ships tools and apps quickly.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Chip color="#b6f0d2">🛡 cybersecurity</Chip>
        <Chip color="#ffd2a8">🦖 dinosaurs</Chip>
        <Chip color="#ffc2d9">🎵 music</Chip>
        <Chip color="#b5dcff">🧠 AI / ML</Chip>
      </div>

      <p className="mt-6 font-mono text-[11.5px] uppercase tracking-[0.2em] text-cream/85">education and work</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {EDUCATION.map((e) => (
          <div key={e.name} className="rounded-2xl border border-white/25 bg-white/[0.07] p-3 md:p-3.5">
            <div className="font-display text-[14.5px] font-bold leading-tight md:text-[15.5px]">{e.name}</div>
            <div className="mt-1.5 inline-block rounded-full border border-mint/50 bg-mint/15 px-2 py-0.5 font-mono text-[11px] font-medium text-mint">
              {e.when}
            </div>
            <div className="mt-1.5 text-[12.5px] leading-snug text-cream/90">{e.detail}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 font-mono text-[11.5px] uppercase tracking-[0.2em] text-cream/85">tech stack</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {STACK.map((s, i) => (
          <Chip key={s} color={["#ffc2d9", "#cdb8ff", "#b5dcff", "#b6f0d2", "#ffd2a8"][i % 5]}>
            {s}
          </Chip>
        ))}
      </div>

      <p className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-cream/80">
        ↳ {state.isTouch ? "tap" : "click"} the little dino 🦖
      </p>
    </article>
  );
}

function ContactCard({ onMusic }: { onMusic: (arg: string) => string }) {
  return (
    <div className="card flex w-full flex-col gap-3 md:max-w-[640px]">
      <h2 className="legible hidden font-display text-[56px] font-extrabold leading-[0.95] tracking-tight md:block">
        Let's build <span className="italic text-mint">something.</span>
      </h2>
      <Terminal onMusic={onMusic} />
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${LINKS.email}`}
          className="rounded-full bg-blush px-5 py-3 text-[13.5px] font-bold text-ink transition hover:scale-105 active:scale-95 md:py-2.5"
        >
          ✉ {LINKS.email}
        </a>
        <a
          href={LINKS.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-cream/55 bg-[#1c1636]/85 px-4 py-3 text-[13.5px] text-cream transition hover:bg-white/10 active:scale-95 md:py-2.5"
        >
          GitHub ↗
        </a>
        <a
          href={LINKS.linkedin}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-cream/55 bg-[#1c1636]/85 px-4 py-3 text-[13.5px] text-cream transition hover:bg-white/10 active:scale-95 md:py-2.5"
        >
          LinkedIn ↗
        </a>
      </div>
      <p className="legible font-mono text-[11.5px] uppercase tracking-[0.12em] text-cream">
        ↳ {state.isTouch ? "tap" : "click"} the astronaut to say hi 🧑‍🚀
      </p>
    </div>
  );
}

export function Overlay({ onMusic }: { onMusic: (arg: string) => string }) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const register = useCallback<Register>((i, el) => {
    els.current[i] = el;
  }, []);

  // every frame: fade and slide each section according to how far the camera is from it
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const cur = state.current;
      for (let i = 0; i < STOP_COUNT; i++) {
        const el = els.current[i];
        if (!el) continue;
        const d = i - cur;
        const ad = Math.abs(d);
        const o = 1 - smooth(0.22, 0.55, ad);
        if (o < 0.01) {
          if (el.style.visibility !== "hidden") {
            el.style.visibility = "hidden";
            el.style.opacity = "0";
            el.dataset.active = "0";
          }
          continue;
        }
        el.style.visibility = "visible";
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${(d * 60).toFixed(1)}px, 0)`;
        el.dataset.active = ad < 0.3 ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <Stop index={0} register={register} hero>
        <Hero />
      </Stop>

      {PROJECTS.map((p, i) => (
        <Stop key={p.id} index={i + 1} register={register}>
          <ProjectCard project={p} index={i + 1} />
        </Stop>
      ))}

      <Stop index={PROJECTS.length + 1} register={register}>
        <AboutCard />
      </Stop>

      <Stop index={PROJECTS.length + 2} register={register}>
        <ContactCard onMusic={onMusic} />
      </Stop>
    </>
  );
}
