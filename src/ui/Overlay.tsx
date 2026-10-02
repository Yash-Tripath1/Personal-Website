import { useEffect, useRef, useState, type ReactNode } from "react";
import { LINKS, PROJECTS, type Project } from "../data/projects";
import { CONTACT, HOME, STOP_COUNT, state } from "../lib/state";
import { sideOf } from "../lib/layout";
import { Terminal } from "./Terminal";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function Stop({
  index,
  children,
  register,
  hero,
}: {
  index: number;
  children: ReactNode;
  register: (i: number, el: HTMLDivElement | null) => void;
  hero?: boolean;
}) {
  const side = sideOf(index);
  const pos = hero
    ? "items-end justify-center pb-16 md:pb-14"
    : `items-end justify-center pb-14 md:items-center md:pb-0 ${side === 1 ? "md:justify-start" : "md:justify-end"}`;
  return (
    <div ref={(el) => register(index, el)} className={`stop fixed inset-0 z-20 flex px-4 md:px-[5vw] pointer-events-none ${pos}`}>
      {children}
    </div>
  );
}

function Chip({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide"
      style={{ borderColor: color + "88", color, background: color + "14" }}
    >
      {children}
    </span>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [word, setWord] = useState(state.word);
  return (
    <article className="card glass w-full rounded-[26px] p-5 md:max-w-[470px] md:rounded-[30px] md:p-8">
      <div className="flex items-center justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-cream/70">
        <span style={{ color: project.accent }}>
          {String(index).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
        </span>
        <span className="truncate text-right">{project.kind}</span>
      </div>

      <h2
        className="mt-3 font-display text-[40px] font-extrabold leading-[0.95] tracking-tight md:mt-4 md:text-[64px]"
        style={{ color: project.accent }}
      >
        {project.name}
      </h2>

      <p className="mt-3 text-[14px] leading-relaxed text-cream/85 md:mt-5 md:text-[15.5px]">{project.desc}</p>

      <p className="mt-3 hidden font-display text-[14px] italic leading-snug text-cream/60 md:block">
        <span style={{ color: project.accent }}>◐</span> {project.metaphor}
      </p>

      {project.id === "veyra" && (
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/20 bg-black/20 px-4 py-2.5">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-cream/60">aura of</span>
          <input
            value={word}
            maxLength={28}
            onChange={(e) => {
              setWord(e.target.value);
              state.word = e.target.value;
            }}
            placeholder="type anything…"
            className="min-w-0 flex-1 bg-transparent font-display text-lg italic text-cream outline-none placeholder:text-cream/30"
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
            className="rounded-full px-5 py-2.5 text-[13px] font-bold text-ink transition hover:scale-105"
            style={{ background: project.accent }}
          >
            Live ↗
          </a>
        )}
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className={
            project.live
              ? "rounded-full border border-cream/35 px-5 py-2.5 text-[13px] font-medium transition hover:bg-white/10"
              : "rounded-full px-5 py-2.5 text-[13px] font-bold text-ink transition hover:scale-105"
          }
          style={project.live ? undefined : { background: project.accent }}
        >
          {project.live ? "Code ↗" : "View on GitHub ↗"}
        </a>
      </div>

      <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-cream/45">
        ↳ {state.isTouch ? "tap" : "click"} the planet to {project.hint}
      </p>
    </article>
  );
}

const STACK = ["Python", "JavaScript", "TypeScript", "React", "Vite", "Node/Express", "Tailwind", "Electron", "Firebase", "Groq", "llama.cpp / Ollama", "Linux", "Vercel", "n8n"];

function AboutCard() {
  return (
    <article className="card glass max-h-[62vh] w-full overflow-y-auto rounded-[26px] p-5 md:max-h-[82vh] md:max-w-[570px] md:rounded-[30px] md:p-8 term-scroll">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mint">home planet · about</p>
      <h2 className="mt-3 font-display text-[32px] font-extrabold leading-[1] tracking-tight md:text-[48px]">
        I'm Anadi. <span className="italic text-blush">Most people call me Yashh.</span>
      </h2>
      <p className="mt-4 text-[14px] leading-relaxed text-cream/85 md:text-[15.5px]">
        I'm 18, self-taught, and based in Lucknow. I ship end-to-end products: a browser engine, a language model trained from scratch,
        and desktop and web apps. I'm co-founder of{" "}
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

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {[
          ["IIT Madras", "BS Data Science & Applications · online, ongoing"],
          ["University of Lucknow", "BCA · Aug 2026 – present"],
          ["Glymph Studio", "Co-founder · 2026 – present"],
          ["City Montessori School", "Mahanagar, Lucknow"],
        ].map(([a, b]) => (
          <div key={a} className="rounded-2xl border border-white/12 bg-white/5 p-3.5">
            <div className="font-display text-[15px] font-bold">{a}</div>
            <div className="mt-0.5 text-[12.5px] leading-snug text-cream/65">{b}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-cream/50">orbiting me · tech stack</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {STACK.map((s, i) => (
          <Chip key={s} color={["#ffc2d9", "#cdb8ff", "#b5dcff", "#b6f0d2", "#ffd2a8"][i % 5]}>
            {s}
          </Chip>
        ))}
      </div>

      <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-cream/45">
        ↳ psst. {state.isTouch ? "tap" : "click"} the little dino 🦖
      </p>
    </article>
  );
}

function ContactCard({ onToggleMusic }: { onToggleMusic: () => string }) {
  return (
    <div className="card flex w-full flex-col gap-3 md:max-w-[640px]">
      <h2 className="hidden font-display text-[56px] font-extrabold leading-[0.95] tracking-tight md:block">
        Let's build <span className="italic text-mint">something.</span>
      </h2>
      <Terminal onToggleMusic={onToggleMusic} />
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${LINKS.email}`}
          className="rounded-full bg-blush px-5 py-2.5 text-[13px] font-bold text-ink transition hover:scale-105"
        >
          ✉ {LINKS.email}
        </a>
        <a href={LINKS.github} target="_blank" rel="noreferrer" className="rounded-full border border-cream/35 px-4 py-2.5 text-[13px] transition hover:bg-white/10">
          GitHub ↗
        </a>
        <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="rounded-full border border-cream/35 px-4 py-2.5 text-[13px] transition hover:bg-white/10">
          LinkedIn ↗
        </a>
      </div>
      <p className="hidden font-mono text-[10.5px] uppercase tracking-[0.16em] text-cream/40 md:block">
        © 2026 Anadi Tripathi · built with React, three.js & a lot of music
      </p>
    </div>
  );
}

export function Overlay({ onToggleMusic }: { onToggleMusic: () => string }) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const register = (i: number, el: HTMLDivElement | null) => {
    els.current[i] = el;
  };

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const gate = state.entered ? clamp((performance.now() / 1000 - state.enterTime - 1.5) / 0.9, 0, 1) : 0;
      for (let i = 0; i < STOP_COUNT; i++) {
        const el = els.current[i];
        if (!el) continue;
        const d = state.current - i;
        const vis = clamp((0.5 - Math.abs(d)) * 4, 0, 1) * gate;
        if (vis < 0.005) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `translate3d(0, ${(-d * 70).toFixed(1)}px, 0)`;
        el.dataset.active = vis > 0.7 ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <h1 className="sr-only">Anadi Tripathi — developer, 18, Lucknow</h1>

      <Stop index={0} register={register} hero>
        <div className="card flex flex-col items-center text-center">
          <p className="font-display text-[17px] italic leading-snug text-cream/85 md:text-[22px]">
            Hi, I'm <span className="text-blush">Yashh</span> — 18, self-taught, building things
            <br className="hidden md:block" /> from a browser engine to a language model.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <Chip color="#ffc2d9">Developer</Chip>
            <Chip color="#cdb8ff">BCA + IIT Madras BS</Chip>
            <Chip color="#b6f0d2">Lucknow, India</Chip>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.3em] text-cream/60">
            scroll to launch
            <span style={{ animation: "bob 1.6s ease-in-out infinite" }}>↓</span>
          </div>
        </div>
      </Stop>

      {PROJECTS.map((p, i) => (
        <Stop key={p.id} index={i + 1} register={register}>
          <ProjectCard project={p} index={i + 1} />
        </Stop>
      ))}

      <Stop index={HOME} register={register}>
        <AboutCard />
      </Stop>

      <Stop index={CONTACT} register={register}>
        <ContactCard onToggleMusic={onToggleMusic} />
      </Stop>
    </>
  );
}
