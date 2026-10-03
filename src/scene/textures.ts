import * as THREE from "three";

const VERSE = [
  "To be, or not to be, that is the question",
  "All the world's a stage, and all the men and women merely players",
  "Brevity is the soul of wit",
  "The course of true love never did run smooth",
  "We are such stuff as dreams are made on",
  "Though she be but little, she is fierce",
  "Some are born great, some achieve greatness",
  "If music be the food of love, play on",
  "The fault, dear Brutus, is not in our stars",
  "Parting is such sweet sorrow",
  "Now is the winter of our discontent",
  "Lord, what fools these mortals be",
];

let letters: THREE.CanvasTexture | null = null;
export function lettersTexture() {
  if (letters) return letters;
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  let row = 0;
  for (let y = 22; y < c.height; y += 34) {
    const size = 20 + ((row * 7) % 4) * 4;
    g.font = `italic ${size}px Georgia, "Times New Roman", serif`;
    let x = -((row * 97) % 300);
    let k = row * 3;
    while (x < c.width) {
      const s = VERSE[k++ % VERSE.length] + "   ✦   ";
      g.fillText(s, x, y);
      x += g.measureText(s).width;
    }
    row++;
  }
  letters = new THREE.CanvasTexture(c);
  letters.wrapS = THREE.RepeatWrapping;
  letters.anisotropy = 4;
  return letters;
}

let ring: THREE.CanvasTexture | null = null;
export function verseRingTexture() {
  if (ring) return ring;
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "#fff0c8";
  g.textBaseline = "middle";
  g.font = `italic 700 62px Georgia, serif`;
  const text = "To thine own self be true  ✦  Brevity is the soul of wit  ✦  All that glisters is not gold  ✦  ";
  const x = 10;
  const w = g.measureText(text).width;
  g.save();
  g.scale(c.width / Math.max(w + 20, c.width), 1);
  g.fillText(text, x, 64);
  g.restore();
  ring = new THREE.CanvasTexture(c);
  ring.wrapS = THREE.RepeatWrapping;
  ring.repeat.set(2, 1);
  ring.colorSpace = THREE.SRGBColorSpace;
  ring.anisotropy = 4;
  return ring;
}

const radialCache = new Map<string, THREE.CanvasTexture>();
export function radialTexture(color: string) {
  const hit = radialCache.get(color);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, color);
  grd.addColorStop(0.45, color + "55");
  grd.addColorStop(1, color + "00");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  radialCache.set(color, t);
  return t;
}

let dot: THREE.CanvasTexture | null = null;
export function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "#ffffffff");
  grd.addColorStop(0.5, "#ffffff88");
  grd.addColorStop(1, "#ffffff00");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c);
  dot.colorSpace = THREE.SRGBColorSpace;
  return dot;
}

// A tiny "screen" for the astronaut's laptop: lines of mint code scrolling by.
let code: THREE.CanvasTexture | null = null;
export function codeTexture() {
  if (code) return code;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1c1636";
  g.fillRect(0, 0, 256, 160);
  const cols = ["#b6f0d2", "#ffc2d9", "#cdb8ff", "#b5dcff"];
  for (let i = 0; i < 9; i++) {
    g.fillStyle = cols[i % cols.length];
    const indent = (i * 3) % 4;
    g.fillRect(16 + indent * 16, 14 + i * 15, 40 + ((i * 53) % 120), 6);
  }
  code = new THREE.CanvasTexture(c);
  code.colorSpace = THREE.SRGBColorSpace;
  return code;
}

export function hashWord(word: string) {
  // cyrb53: small, fast, deterministic hash
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (let i = 0; i < word.length; i++) {
    const ch = word.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return [h1 >>> 0, h2 >>> 0];
}

export function auraFromWord(word: string) {
  const [a, b] = hashWord(word.trim().toLowerCase() || "void");
  const hue = (a % 360) / 360;
  const sat = 0.65 + ((b >>> 3) % 20) / 100;
  const freq = 0.7 + ((a >>> 9) % 100) / 40; // 0.7 to 3.2
  const form = (b >>> 5) % 3;
  const c1 = new THREE.Color().setHSL(hue, sat, 0.78);
  const c2 = new THREE.Color().setHSL((hue + 0.12) % 1, sat, 0.8);
  const c3 = new THREE.Color().setHSL((hue + 0.32) % 1, sat, 0.76);
  const c4 = new THREE.Color().setHSL((hue + 0.5) % 1, 0.9, 0.9);
  return { c1, c2, c3, c4, freq, form };
}
