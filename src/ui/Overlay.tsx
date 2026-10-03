import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LINKS, PROJECTS, type Project } from "../data/projects";
import { CONTACT, HOME, state } from "../lib/state";
import { sideOf } from "../lib/layout";
import { Terminal } from "./Terminal";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

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

/* A soft dark pocket behind the hero name so the particles read crisp
   against the scene instead of merging with planets behind them. */
function HeroPocket() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = ref.current;
      if (!el) return;
      const o = 1 - smooth(0.2, 0.8, Math.abs(state.current));
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o <= 0.01 ? "hidden" : "visible";
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} className="hero-pocket" aria-hidden />;
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
            Live site ↗
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
          GitHub ↗
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
    <article className="card glass term-scroll max-h-[62vh] w-full overflow-y-auto rounded-[26px] p-5 md:max-h-[82vh] md:max-w-[570px] md:rounded-[30px] md:p-8">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mint">about</p>
      <h2 className="mt-3 font-display text-[32px] font-extrabold leading-[1] tracking-tight md:text-[48px]">
        I'm <span className="italic text-blush">Anadi.</span>
      </h2>
      <p className="mt-4 text-[14px] leading-relaxed text-cream/85 md:text-[15.5px]">
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

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {[
          ["IIT Madras", "BS Data Science and Applications, online, ongoing"],
          ["University of Lucknow", "BCA, from Aug 2026"],
          ["Glymph Studio", "Cofounder, from 2026"],
          ["City Montessori School", "Mahanagar, Lucknow"],
        ].map(([a, b]) => (
          <div key={a} className="rounded-2xl border border-white/12 bg-white/5 p-3.5">
            <div className="font-display text-[15px] font-bold">{a}</div>
            <div className="mt-0.5 text-[12.5px] leading-snug text-cream/65">{b}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-cream/50">tech stack</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {STACK.map((s, i) => (
          <Chip key={s} color={["#ffc2d9", "#cdb8ff", "#b5dcff", "#b6f0d2", "#ffd2a8"][i % 5]}>
            {s}
          </Chip>
        ))}
      </div>

      <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-cream/45">
        ↳ {state.isTouch ? "tap" : "click"} the little dino 🦖
      </p>
    </article>
  );
}

function ContactCard({ onMusic }: { onMusic: (arg: string) => string }) {
  return (
    <div className="card flex w-full flex-col gap-3 md:max-w-[640px]">
      <h2 className="hidden font-display text-[56px] font-extrabold leading-[0.95] tracking-tight md:block">
        Let's build <span className="italic text-mint">something.</span>
      </h2>
      <Terminal onMusic={onMusic} />
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${LINKS.email}`}
          className="rounded-full bg-blush px-5 py-2.5 text-[13px] font-bold text-ink transition hover:scale-105"
        >
          ✉ {LINKS.email}
        </a>
        <a
          href={LINKS.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-cream/35 bg-ink/60 px-4 py-2.5 text-[13px] transition hover:bg-white/10"
        >
          GitHub ↗
        </a>
        <a
          href={LINKS.linkedin}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-cream/35 bg-ink/60 px-4 py-2.5 text-[13px] transition hover:bg-white/10"
        >
          LinkedIn ↗
        </a>
        <a
          href={LINKS.glymph}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-cream/35 bg-ink/60 px-4 py-2.5 text-[13px] transition hover:bg-white/10"
        >
          Glymph Studio ↗
        </a>
      </div>
      <p className="font-mono text-[11px] tracking-wide text-cream/60">{LINKS.githubNote}</p>
    </div>
  );
}

export function Overlay({ onMusic }: { onMusic: (arg: string) => string }) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const register = useCallback((i: number, el: HTMLDivElement | null) => {
    els.current[i] = el;
  }, []);

  // cards fade and drift with the camera, so each planet hands over smoothly to the next
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const cur = state.current;
      els.current.forEach((el, i) => {
        if (!el) return;
        const d = cur - i;
        const a = Math.abs(d);
        const o = 1 - smooth(0.1, 0.5, a);
        if (o <= 0.003) {
          if (el.style.visibility !== "hidden") {
            el.style.visibility = "hidden";
            el.style.opacity = "0";
            el.dataset.active = "0";
          }
          return;
        }
        el.style.visibility = "visible";
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${clamp(-d * 90, -50, 50).toFixed(1)}px, 0)`;
        const act = a < 0.3 ? "1" : "0";
        if (el.dataset.active !== act) el.dataset.active = act;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <HeroPocket />
      <Stop index={0} register={register} hero>
        <div className="card pointer-events-none text-center">
          <p className="font-display text-lg italic text-cream/85 md:text-2xl">Developer from Lucknow</p>
          <p
            className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-cream/55"
            style={{ animation: "bob 2.4s ease-in-out infinite" }}
          >
            Scroll to explore ↓
          </p>
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
        <ContactCard onMusic={onMusic} />
      </Stop>
    </>
  );
}
