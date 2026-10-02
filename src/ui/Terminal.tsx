import { useEffect, useRef, useState } from "react";
import { PROJECTS, LINKS } from "../data/projects";
import { HOME, scrollToStop } from "../lib/state";
import { emit, toast } from "../lib/bus";

type Line = { kind: "in" | "out" | "sys"; text: string; href?: string };

const BANNER: Line[] = [
  { kind: "sys", text: "cosmos-shell v1.0 · connection secure (probably)" },
  { kind: "sys", text: "type `help` to see what I can do. try `sudo` if you dare." },
];

export function Terminal({ onToggleMusic }: { onToggleMusic: () => string }) {
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  const out = (...t: string[]): Line[] => t.map((text) => ({ kind: "out", text }));

  const exec = (raw: string): Line[] | null => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ").toLowerCase();
    switch (cmd.toLowerCase()) {
      case "help":
        return out(
          "about · whoami · projects · skills · interests · education",
          "contact · email · github · linkedin · glymph",
          "fly <planet> · music · dino · meteor · clear",
          "(there are a few hidden ones. security people love secrets.)",
        );
      case "about":
        return out(
          "Anadi Tripathi (Yashh) · 18 · Lucknow, India.",
          "self-taught dev. BCA + IIT Madras BS Data Science.",
          "ships end-to-end: a browser engine, an LLM from scratch, desktop + web apps.",
        );
      case "whoami":
        return out("yashh // anadi tripathi // uid=18 // gid=builders");
      case "projects":
      case "ls":
        return PROJECTS.map((p, i) => ({ kind: "out" as const, text: `${String(i + 1).padStart(2, "0")}  ${p.name.padEnd(16)} ${p.kind}` }));
      case "skills":
        return out(
          "langs:   Python · JavaScript · TypeScript · HTML/CSS",
          "tools:   React · Vite · Node/Express · Tailwind · Electron · Firebase · Git",
          "ai:      LLM APIs (Groq) · llama.cpp / Ollama · training from scratch · prompt design",
          "other:   Linux (Ubuntu) · n8n · Vercel",
        );
      case "interests":
        return out("🛡  cybersecurity   🦖 dinosaurs   🎵 music   🧠 AI/ML   🛠  building products");
      case "education":
        return out(
          "IIT Madras · BS Data Science & Applications (online, ongoing)",
          "University of Lucknow · BCA (Aug 2026 – present)",
        );
      case "contact":
        return [
          ...out("let's talk:"),
          { kind: "out", text: `  ✉  ${LINKS.email}`, href: `mailto:${LINKS.email}` },
          { kind: "out", text: "  ⌥  github.com/Yash-Tripath1", href: LINKS.github },
          { kind: "out", text: "  in linkedin.com/in/anadi-tripathi-4a33543a6", href: LINKS.linkedin },
        ];
      case "email":
        return [{ kind: "out", text: LINKS.email, href: `mailto:${LINKS.email}` }];
      case "github":
        return [{ kind: "out", text: LINKS.github, href: LINKS.github }];
      case "linkedin":
        return [{ kind: "out", text: LINKS.linkedin, href: LINKS.linkedin }];
      case "glymph":
        return [
          ...out("Glymph Studio: indie dev studio shipping tools & apps fast."),
          { kind: "out", text: LINKS.glymph, href: LINKS.glymph },
        ];
      case "fly": {
        if (!arg) return out("usage: fly <planet>   e.g. fly klar");
        if (["home", "about", "dino"].includes(arg)) {
          scrollToStop(HOME);
          return out("engaging thrusters → home planet 🌍");
        }
        if (["top", "start", "hello"].includes(arg)) {
          scrollToStop(0);
          return out("returning to the start ↑");
        }
        const i = PROJECTS.findIndex((p) => p.id.includes(arg) || p.name.toLowerCase().includes(arg));
        if (i < 0) return out(`no planet called "${arg}". try \`projects\`.`);
        scrollToStop(i + 1);
        return out(`engaging thrusters → ${PROJECTS[i].name} 🚀`);
      }
      case "music":
        return out(onToggleMusic());
      case "dino":
        return out("        __", "       / _)    RAWR.", "  _.-^^^/ /", " /       /    (click the dino on the home planet too)");
      case "meteor":
        emit("meteor");
        return out("incoming. 🌠");
      case "sudo":
        return out("anadi is not in the sudoers file. this incident will be reported. 🚨");
      case "nmap":
        return out(
          "Starting Nmap 7.94 ( https://nmap.org )",
          "All 1000 scanned ports are filtered.",
          "(good. I like it that way.)",
        );
      case "hack":
      case "hacker":
        return out("[■■■■■■■□□□] 70%  bypassing firewall…", "ACCESS DENIED. I do defense, not offense. 🛡");
      case "ping":
        return out("PONG from Lucknow · 0% packet loss · ~∞ chai");
      case "rm":
        return out("rm: refusing to destroy the universe. 🌌");
      case "cat":
        return out(arg.includes("secret") ? "nice try. 🔒" : "meow? that's not how this works.");
      case "date":
        return out(new Date().toString());
      case "echo":
        return out(args.join(" "));
      case "exit":
        return out("you can't leave. it's a whole universe out here.");
      case "xyzzy":
      case "42":
        return out("a hollow voice says “fool.” (+1 nerd point)");
      default:
        return out(`command not found: ${cmd}. type \`help\`.`);
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
    if (cmd.toLowerCase() === "sudo") toast("🚨 incident reported");
    setLines((l) => [...l, { kind: "in", text: cmd }, ...(res ?? [])]);
  };

  return (
    <div className="card glass w-full overflow-hidden rounded-[22px] md:max-w-[640px]" onClick={() => input.current?.focus({ preventScroll: true })}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff9fb8]" />
        <span className="h-3 w-3 rounded-full bg-[#ffe29a]" />
        <span className="h-3 w-3 rounded-full bg-[#9fe6bd]" />
        <span className="ml-3 font-mono text-[11px] text-cream/60">yashh@cosmos: ~</span>
      </div>

      <div ref={box} className="term-scroll h-[190px] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed md:h-[250px] md:text-[13px]">
        {lines.map((l, i) => (
          <div key={i} className={l.kind === "in" ? "text-mint" : l.kind === "sys" ? "text-lilac/80" : "text-cream/90"}>
            {l.kind === "in" && <span className="mr-2 text-blush">❯</span>}
            {l.href ? (
              <a href={l.href} target="_blank" rel="noreferrer" className="underline decoration-blush/60 underline-offset-4 hover:text-blush">
                {l.text}
              </a>
            ) : (
              <span className="whitespace-pre-wrap">{l.text}</span>
            )}
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t border-white/10 px-4 py-3 font-mono text-[13px]"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
          setValue("");
        }}
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
          placeholder="type a command…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-cream outline-none placeholder:text-cream/30"
          aria-label="Terminal input"
        />
      </form>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {["help", "projects", "contact", "sudo", "music"].map((c) => (
          <button
            key={c}
            onClick={(e) => {
              e.stopPropagation();
              submit(c);
            }}
            className="rounded-full border border-white/20 px-3 py-1 font-mono text-[11px] text-cream/80 transition hover:bg-white/15"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
