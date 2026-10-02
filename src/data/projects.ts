export type Project = {
  id: "surfgambit" | "vynt" | "memoir" | "veyra" | "klar" | "roadsos" | "shakespeare" | "forge";
  name: string;
  kind: string;
  desc: string;
  metaphor: string;
  hint: string; // what clicking does
  tags: string[];
  live?: string; // add live URLs here
  repo: string;
  accent: string; // UI accent (css colour)
  type: number; // shader branch
  colors: [string, string, string, string]; // planet palette
  rim: string;
  rotSpeed: number;
};

// 👉 Add / change live links here — e.g. live: "https://veyra.vercel.app"
export const PROJECTS: Project[] = [
  {
    id: "surfgambit",
    name: "SurfGambit",
    kind: "Browser engine · Python",
    desc: "A web browser built from scratch in Python and Tkinter, following browser.engineering and implementing the core rendering pipeline: parse, layout, paint.",
    metaphor: "A planet that renders itself: wireframe, then layout boxes, then paint.",
    hint: "restart the render pipeline",
    tags: ["Python", "Tkinter", "Rendering"],
    repo: "https://github.com/Yash-Tripath1/SurfGambit",
    accent: "#b6f0d2",
    type: 0,
    colors: ["#ffc2d9", "#cdb8ff", "#b5dcff", "#b6f0d2"],
    rim: "#b6f0d2",
    rotSpeed: 0.08,
  },
  {
    id: "vynt",
    name: "Vynt",
    kind: "Y2K photo booth · Desktop + Web",
    desc: "Local-first Y2K-style photo booth with 8 real-time canvas filters, photo and video capture. Runs in the browser and ships as a Windows installer. No uploads, no tracking.",
    metaphor: "A glossy Y2K planet that cycles through filter modes, with an RGB-split rim.",
    hint: "snap a photo (flash!)",
    tags: ["React", "TypeScript", "Canvas", "Electron"],
    repo: "https://github.com/Yash-Tripath1/Vynt",
    accent: "#ffc2d9",
    type: 1,
    colors: ["#ffc2d9", "#cdb8ff", "#b5dcff", "#fff0a8"],
    rim: "#ffc2d9",
    rotSpeed: 0.12,
  },
  {
    id: "memoir",
    name: "Memoir",
    kind: "Web app · Glymph Studio",
    desc: "Turns WhatsApp chat exports (.txt / .zip) into digital scrapbooks, with a custom chat parser and a drag, resize and rotate canvas editor with PNG export.",
    metaphor: "A patchwork of paper tiles, with polaroids and chat bubbles orbiting as moons.",
    hint: "pop a chat bubble",
    tags: ["React", "Vite", "Tailwind", "Framer Motion"],
    live: "https://memoirr-sigma.vercel.app",
    repo: "https://github.com/Glymph-Studio/memoir",
    accent: "#ffd2a8",
    type: 2,
    colors: ["#ffe3c4", "#ffc2d9", "#fff0a8", "#c9ecff"],
    rim: "#ffd2a8",
    rotSpeed: 0.1,
  },
  {
    id: "veyra",
    name: "Veyra",
    kind: "Generative art · Zero backend",
    desc: "Type any text, get a deterministic generative aura: hashed into colour, frequency and form. Three pattern modes, AES-GCM shareable links, zero backend.",
    metaphor: "An aura planet. Its colour, pulse and shape are generated from whatever you type.",
    hint: "pulse the aura",
    tags: ["SHA-256", "AES-GCM", "Canvas", "HTML"],
    repo: "https://github.com/Yash-Tripath1/Veyra",
    accent: "#cdb8ff",
    type: 3,
    colors: ["#cdb8ff", "#ffc2d9", "#b5dcff", "#ffffff"],
    rim: "#cdb8ff",
    rotSpeed: 0.05,
  },
  {
    id: "klar",
    name: "Klar",
    kind: "Learning app · AI coach",
    desc: "A calm A1/A2 German learning app: 50 lessons, no streak pressure, and a Klar Coach for level-aware conversation practice. der / die / das are colour-coded.",
    metaphor: "A calm, slow planet. Its continents are der (blue), die (rose) and das (mint).",
    hint: "say Hallo",
    tags: ["JavaScript", "Web App", "LLM Coach"],
    live: "https://klar-german.vercel.app",
    repo: "https://github.com/Yash-Tripath1/Klar",
    accent: "#b5dcff",
    type: 4,
    colors: ["#9ccbff", "#ff9fb8", "#9fe6bd", "#fff7ee"],
    rim: "#d9ecff",
    rotSpeed: 0.035,
  },
  {
    id: "roadsos",
    name: "RoadSOS",
    kind: "Hackathon · CoERS IIT Madras 2026",
    desc: "A road-safety AI emergency-response tool with a Vite/React front end, a Node/Express backend and Groq-powered LLM inference. Built for the CoERS IIT Madras Hackathon 2026.",
    metaphor: "A dark planet laced with glowing roads, circled by a red-and-blue beacon.",
    hint: "send an SOS ping",
    tags: ["React", "Node", "Express", "Groq"],
    repo: "https://github.com/Yash-Tripath1/road-sos",
    accent: "#ff9fb8",
    type: 5,
    colors: ["#ff6f91", "#6fb1ff", "#ffe6a8", "#2a2150"],
    rim: "#ff9fb8",
    rotSpeed: 0.07,
  },
  {
    id: "shakespeare",
    name: "Shakespeare-GPT",
    kind: "Language model · From scratch",
    desc: "A GPT-style language model built and trained from scratch on about 80,000 lines of Shakespeare. It covers data preparation, training and text generation.",
    metaphor: "A parchment world whose surface is made of letters, ringed by its own verses.",
    hint: "summon a line of verse",
    tags: ["Python", "Transformers", "Training"],
    repo: "https://github.com/Yash-Tripath1/Shakespeare-GPT",
    accent: "#fff0a8",
    type: 6,
    colors: ["#f6e2b8", "#5a3b2b", "#d9b27c", "#fff7e0"],
    rim: "#fff0a8",
    rotSpeed: 0.06,
  },
  {
    id: "forge",
    name: "Forge",
    kind: "Digital brush maker · Glymph Studio",
    desc: "Turn any image into a configurable digital brush. Stamp and flow engines, with export to GIMP and Krita. Built under Glymph Studio.",
    metaphor: "A planet painted in stamped dabs, with a brush stroke orbiting it.",
    hint: "stamp the planet",
    tags: ["HTML", "Canvas", "GIMP", "Krita"],
    repo: "https://github.com/Glymph-Studio/forge",
    accent: "#ffb29e",
    type: 7,
    colors: ["#ffb29e", "#ffd2a8", "#ffc2d9", "#cdb8ff"],
    rim: "#ffb29e",
    rotSpeed: 0.09,
  },
];

export const LINKS = {
  email: "tripathiyash382@gmail.com",
  github: "https://github.com/Yash-Tripath1",
  linkedin: "https://linkedin.com/in/anadi-tripathi-4a33543a6",
  glymph: "https://github.com/glymph-studio",
};
