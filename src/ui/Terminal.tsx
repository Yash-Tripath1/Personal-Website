import { useEffect, useRef, useState } from "react";
import { EDUCATION, LINKS, PROJECTS } from "../data/projects";
import { CONTACT, HOME, scrollToStop } from "../lib/state";
import { emit } from "../lib/bus";

type Line = { kind: "in" | "out"; text: string; href?: string };

const out = (...text: string[]): Line[] => text.map((t) => ({ kind: "out" as const, text: t }));

const SUGGESTIONS = ["help", "projects", "skills", "education", "astro", "contact", "music next"];

export function Terminal({ onMusic }: { onMusic: (arg: string) => string }) {
  const [lines, setLines] = useState<Line[]>(() =>
    out("Welcome aboard. Type help, or tap a command below ↓"),
  );
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
        return out("🛡 cybersecurity   🦖 dinosaurs   🎵 music   🧠 AI and ML   🛠 building products");
      case "education":
        return out(...EDUCATION.map((e) => `${e.name} · ${e.detail} (${e.when})`));
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
        return [{ kind: "out", text: "GitHub profile ↗", href: LINKS.github }, ...out(LINKS.githubNote)];
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

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  return (
    <div
      className="card glass-solid w-full overflow-hidden rounded-[22px] md:max-w-[640px]"
      onClick={() => input.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center gap-1.5 border-b border-white/15 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff9fb8]" />
        <span className="h-3 w-3 rounded-full bg-[#ffe29a]" />
        <span className="h-3 w-3 rounded-full bg-[#9fe6bd]" />
        <span className="ml-3 font-mono text-[12px] text-cream/85">anadi@cosmos: ~</span>
      </div>

      <div
        ref={box}
        className="term-scroll h-[22dvh] min-h-[120px] max-h-[200px] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-cream md:h-[250px] md:max-h-none md:text-[13px]"
      >
        {lines.map((l, i) => (
          <div key={i} className="break-words">
            {l.kind === "in" && <span className="mr-2 text-blush">❯</span>}
            {l.href ? (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="whitespace-pre-wrap underline decoration-blush/70 underline-offset-4 hover:text-blush"
              >
                {l.text}
              </a>
            ) : (
              <span className={`whitespace-pre-wrap ${l.kind === "in" ? "text-cream" : "text-cream/95"}`}>{l.text}</span>
            )}
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t border-white/15 px-4 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
          setValue("");
        }}
      >
        <span className="font-mono text-blush">❯</span>
        {/* 16px on phones: anything smaller makes iOS zoom the page when the field is focused */}
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder="type help…"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="send"
          aria-label="Terminal command"
          className="min-w-0 flex-1 bg-transparent py-1.5 font-mono text-[16px] text-cream outline-none placeholder:text-cream/55 md:text-[13px]"
        />
      </form>

      <div className="term-scroll flex gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2">
        {SUGGESTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              submit(c);
            }}
            className="shrink-0 rounded-full border border-cream/35 px-3 py-1.5 font-mono text-[11.5px] text-cream transition hover:border-blush hover:text-blush active:scale-95"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
