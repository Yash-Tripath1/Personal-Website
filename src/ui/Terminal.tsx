import { useEffect, useRef, useState } from "react";
import { LINKS, PROJECTS } from "../data/projects";
import { emit } from "../lib/bus";
import { CONTACT, HOME, scrollToStop } from "../lib/state";

type Line = { kind: "in" | "out"; text: string; href?: string };

const out = (...t: string[]): Line[] => t.map((text) => ({ kind: "out", text }));

const SUGGESTIONS = ["help", "projects", "astro", "contact", "music", "fly home"];

export function Terminal({ onMusic }: { onMusic: (arg: string) => string }) {
  const [lines, setLines] = useState<Line[]>(() => out("Welcome. Type help to see what you can ask."));
  const [value, setValue] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  const exec = (raw: string): Line[] => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ").toLowerCase();
    switch (cmd.toLowerCase()) {
      case "help":
        return out(
          "about · whoami · projects · skills · interests · education",
          "contact · email · github · linkedin · glymph",
          "fly <planet> · music [name] · astro · dino · meteor · clear",
        );
      case "about":
        return out(
          "Anadi Tripathi, 18, from Lucknow, India.",
          "Self taught developer. BCA and IIT Madras BS in Data Science.",
          "I build end to end: a browser engine, an LLM from scratch, desktop and web apps.",
        );
      case "whoami":
        return out("Anadi Tripathi, developer and cofounder of Glymph Studio.");
      case "projects":
      case "ls":
        return [
          ...PROJECTS.map((p, i) => ({
            kind: "out" as const,
            text: `${String(i + 1).padStart(2, "0")}  ${p.name.padEnd(16)} ${p.live ? "live ↗" : "github ↗"}`,
            href: p.live ?? p.repo,
          })),
          ...out("Click a line to open it, or try: fly klar"),
        ];
      case "skills":
        return out(
          "langs:  Python · JavaScript · TypeScript · HTML and CSS",
          "tools:  React · Vite · Node and Express · Tailwind · Electron · Firebase · Git",
          "ai:     LLM APIs (Groq) · llama.cpp and Ollama · training from scratch",
          "other:  Linux (Ubuntu) · n8n · Vercel",
        );
      case "interests":
        return out("🛡 cybersecurity   🦖 dinosaurs   🎵 music    AI and ML   🛠 building products");
      case "education":
        return out(
          "IIT Madras · BS Data Science and Applications)",
          "University of Lucknow · BCA",
        );
      case "contact":
        return [
          ...out("Let's talk:"),
          { kind: "out", text: `  ✉  ${LINKS.email}`, href: `mailto:${LINKS.email}` },
          { kind: "out", text: "  GitHub profile ↗", href: LINKS.github },
          { kind: "out", text: "  LinkedIn profile ↗", href: LINKS.linkedin },
          ...out("  (Yash is my nickname, that's why my GitHub says Yash)"),
        ];
      case "email":
        return [{ kind: "out", text: LINKS.email, href: `mailto:${LINKS.email}` }];
      case "github":
        return [
          { kind: "out", text: "GitHub profile ↗", href: LINKS.github },
          ...out(LINKS.githubNote),
        ];
      case "linkedin":
        return [{ kind: "out", text: "LinkedIn profile ↗", href: LINKS.linkedin }];
      case "glymph":
        return [
          ...out("Glymph Studio: an indie dev studio shipping tools and apps fast."),
          { kind: "out", text: "Glymph Studio on GitHub ↗", href: LINKS.glymph },
        ];
      case "fly": {
        if (!arg) return out("usage: fly <planet>, for example: fly klar");
        if (["home", "about", "dino"].includes(arg)) {
          scrollToStop(HOME);
          return out("Flying to the home planet 🌍");
        }
        if (["contact", "end", "astronaut", "astro"].includes(arg)) {
          scrollToStop(CONTACT);
          return out("Flying to the astronaut 🧑‍🚀");
        }
        if (["top", "start", "hello"].includes(arg)) {
          scrollToStop(0);
          return out("Heading back to the start ↑");
        }
        const q = arg.replace(/\s+/g, "");
        const i = PROJECTS.findIndex((p) => p.id.includes(q) || p.name.toLowerCase().replace(/\s+/g, "").includes(q));
        if (i < 0) return out(`No planet called "${arg}". Try projects.`);
        scrollToStop(i + 1);
        return out(`Flying to ${PROJECTS[i].name} 🚀`);
      }
      case "music":
        return out(...onMusic(arg).split("\n"));
      case "astro":
      case "astronaut":
      case "wave":
      case "hi":
      case "hello":
        emit("astro-wave");
        return out("📡 Incoming transmission: the astronaut waves back. Hello, human!");
      case "dino":
        return out("RAWR. The little dino lives on the home planet, go say hi.");
      case "meteor":
        emit("meteor");
        return out("Incoming. 🌠");
      default:
        return out(`command not found: ${cmd}. Type help.`);
    }
  };

  const submit = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    setHist((h) => [cmd, ...h]);
    setHi(-1);
    if (cmd.toLowerCase() === "clear") {
      setLines([]);
      return;
    }
    const res = exec(cmd);
    setLines((l) => [...l, { kind: "in", text: cmd }, ...res]);
  };

  return (
    <div
      className="card glass-solid w-full overflow-hidden rounded-[22px] md:max-w-[640px]"
      onClick={() => input.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff9fb8]" />
        <span className="h-3 w-3 rounded-full bg-[#ffe29a]" />
        <span className="h-3 w-3 rounded-full bg-[#9fe6bd]" />
        <span className="ml-3 font-mono text-[11px] text-cream/60">anadi@cosmos: ~</span>
      </div>

      <div
        ref={box}
        className="term-scroll h-[190px] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-cream md:h-[250px] md:text-[13px]"
      >
        {lines.map((l, i) => (
          <div key={i} className={l.kind === "in" ? "text-cream" : "text-cream/90"}>
            {l.kind === "in" && <span className="mr-2 text-blush">❯</span>}
            {l.href ? (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="whitespace-pre-wrap underline decoration-blush/60 underline-offset-4 hover:text-blush"
              >
                {l.text}
              </a>
            ) : (
              <span className="whitespace-pre-wrap">{l.text}</span>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
          setValue("");
        }}
        className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 font-mono text-[13px]"
      >
        <span className="text-blush">❯</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const n = Math.min(hist.length - 1, hi + 1);
              if (n >= 0) {
                setHi(n);
                setValue(hist[n]);
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const n = hi - 1;
              setHi(n);
              setValue(n >= 0 ? hist[n] : "");
            }
          }}
          placeholder="type a command"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className="min-w-0 flex-1 bg-transparent text-cream outline-none placeholder:text-cream/30"
        />
      </form>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {SUGGESTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              submit(c);
            }}
            className="rounded-full border border-white/20 px-2.5 py-1 font-mono text-[11px] text-cream/75 transition hover:bg-white/10 hover:text-cream"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
