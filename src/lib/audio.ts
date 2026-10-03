// Generative music and tiny UI sounds, all WebAudio. No audio files.
// Several tracks are available, and the listener can switch between them.

export type TrackId = "drift" | "nebula" | "lofi" | "arcade";
export type TrackInfo = { id: TrackId; name: string; mood: string };

export const TRACKS: TrackInfo[] = [
  { id: "drift", name: "Drift", mood: "soft pads and bells" },
  { id: "nebula", name: "Nebula", mood: "deep and cinematic" },
  { id: "lofi", name: "Lo fi", mood: "slow beat, warm keys" },
  { id: "arcade", name: "Arcade", mood: "bright chiptune" },
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let wet: GainNode | null = null;
let bus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = true;
let current: TrackId = "drift";
let timer: number | undefined;
let nextT = 0;
let stepN = 0;

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function makeImpulse(c: AudioContext, seconds = 3.2) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function ensure() {
  if (ctx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx);
  wet = ctx.createGain();
  wet.gain.value = 0.7;
  reverb.connect(wet);
  wet.connect(master);
  const n = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = n;
}

/* ---- building blocks ---------------------------------------------------- */
type NoteOpts = {
  t: number;
  hz: number;
  dur: number;
  vol: number;
  type?: OscillatorType;
  attack?: number;
  shape?: "pad" | "pluck";
  lp?: number;
  detune?: number;
  dest?: AudioNode;
};

function note(o: NoteOpts) {
  if (!ctx || !bus) return;
  const c = ctx;
  const osc = c.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.value = o.hz;
  if (o.detune) osc.detune.value = o.detune;
  const g = c.createGain();
  const a = o.attack ?? 0.01;
  g.gain.setValueAtTime(0, o.t);
  g.gain.linearRampToValueAtTime(o.vol, o.t + a);
  if (o.shape === "pad") g.gain.linearRampToValueAtTime(0.0001, o.t + o.dur);
  else g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
  let src: AudioNode = osc;
  if (o.lp) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    osc.connect(f);
    src = f;
  }
  src.connect(g);
  g.connect(o.dest ?? bus);
  osc.start(o.t);
  osc.stop(o.t + o.dur + 0.05);
}

const pad = (t: number, m: number, dur: number, vol: number, type: OscillatorType, lp: number, attack = 2.6) =>
  note({ t, hz: mtof(m), dur: dur + 1.5, vol, type, lp, attack, shape: "pad", detune: (Math.random() - 0.5) * 12 });

const bell = (t: number, m: number, vol = 0.07, len = 2.4) => {
  [1, 2.01].forEach((mult, i) => note({ t, hz: mtof(m) * mult, dur: len, vol: vol / (i + 1), attack: 0.015 }));
};

function noiseHit(t: number, kind: "bandpass" | "highpass", freq: number, vol: number, len: number) {
  if (!ctx || !bus || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = kind;
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + len + 0.02);
}

function kick(t: number, vol = 0.38) {
  if (!ctx || !bus) return;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.3);
}

/* ---- tracks ------------------------------------------------------------- */
type Def = { dur: number; send: number; step: (n: number, t: number) => void };

const DRIFT_CH = [
  [53, 57, 60, 64],
  [48, 55, 59, 64],
  [45, 55, 60, 64],
  [43, 55, 59, 62],
];
const DRIFT_SC = [72, 74, 76, 79, 81, 84, 88];

const NEB_CH = [
  [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 60],
  [48, 55, 60, 64, 67],
  [43, 50, 55, 59, 62],
];
const NEB_SC = [69, 72, 76, 81, 84, 88];

const LOFI_CH = [
  [50, 53, 57, 60, 64],
  [43, 53, 57, 59, 64],
  [48, 52, 55, 59, 62],
  [45, 52, 55, 60, 64],
];
const LOFI_SC = [62, 65, 67, 69, 72, 74, 77];

const ARC_CH = [
  [60, 64, 67, 72],
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [55, 59, 62, 67],
];
const ARC_SC = [72, 74, 76, 79, 81, 84];
const ARC_PAT = [0, 1, 2, 3, 2, 1, 3, 2];

const LOFI_DUR = 60 / 76 / 4;
const ARC_DUR = 60 / 118 / 4;

const DEFS: Record<TrackId, Def> = {
  drift: {
    dur: 0.5,
    send: 1,
    step(n, t) {
      if (n % 16 === 0) {
        DRIFT_CH[(n / 16) % DRIFT_CH.length].forEach((m, i) => pad(t, m, 9, 0.045, i === 0 ? "sine" : "triangle", 900));
      }
      if (Math.random() < 0.22) bell(t, pick(DRIFT_SC), 0.07);
    },
  },
  nebula: {
    dur: 0.5,
    send: 1.35,
    step(n, t) {
      if (n % 20 === 0) {
        const ch = NEB_CH[(n / 20) % NEB_CH.length];
        ch.forEach((m) => {
          pad(t, m, 10, 0.013, "sawtooth", 620, 4);
          pad(t, m, 10, 0.013, "sawtooth", 620, 4);
        });
        note({ t, hz: mtof(ch[0] - 12), dur: 12, vol: 0.07, attack: 3.5, shape: "pad" });
      }
      if (Math.random() < 0.13) bell(t, pick(NEB_SC), 0.05, 3.6);
    },
  },
  lofi: {
    dur: LOFI_DUR,
    send: 0.45,
    step(n, t) {
      const s = n % 16;
      const ch = LOFI_CH[Math.floor(n / 16) % LOFI_CH.length];
      const tt = s % 2 === 1 ? t + LOFI_DUR * 0.22 : t;
      if (s === 0 || s === 10) {
        const lvl = s === 0 ? 1 : 0.6;
        ch.slice(1).forEach((m, i) => {
          note({ t: tt + i * 0.025, hz: mtof(m), dur: 1.9, vol: 0.05 * lvl, type: "triangle", lp: 1500 });
          note({ t: tt + i * 0.025, hz: mtof(m), dur: 1.4, vol: 0.025 * lvl, type: "sine" });
        });
        note({ t: tt, hz: mtof(ch[0] - 12), dur: 0.7, vol: 0.14 * lvl, type: "triangle", lp: 400 });
      }
      if (s === 0 || s === 7 || s === 10) kick(tt, s === 0 ? 0.36 : 0.26);
      if (s === 4 || s === 12) noiseHit(tt, "bandpass", 1700, 0.11, 0.18);
      noiseHit(tt, "highpass", 7500, s % 2 === 0 ? 0.03 : 0.015, 0.05);
      if (s % 2 === 0 && Math.random() < 0.28) {
        note({ t: tt, hz: mtof(pick(LOFI_SC)), dur: 1.2, vol: 0.05, type: "sine", lp: 2200 });
      }
    },
  },
  arcade: {
    dur: ARC_DUR,
    send: 0.3,
    step(n, t) {
      const s = n % 16;
      const ch = ARC_CH[Math.floor(n / 16) % ARC_CH.length];
      note({ t, hz: mtof(ch[ARC_PAT[s % 8]]), dur: 0.11, vol: 0.02, type: "square", lp: 4000 });
      if (s % 4 === 0) note({ t, hz: mtof(ch[0] - 24), dur: 0.24, vol: 0.1, type: "triangle", lp: 600 });
      if (s % 8 === 0) kick(t, 0.22);
      if (s % 2 === 1) noiseHit(t, "highpass", 8000, 0.018, 0.04);
      if (s % 8 === 0 && Math.random() < 0.6) {
        note({ t, hz: mtof(pick(ARC_SC)), dur: 0.38, vol: 0.022, type: "square", lp: 3200 });
      }
    },
  },
};

function tick() {
  if (!ctx || !bus || muted) return;
  const d = DEFS[current];
  while (nextT < ctx.currentTime + 0.3) {
    d.step(stepN, nextT);
    stepN++;
    nextT += d.dur;
  }
}

// begin (or restart) the current track on a fresh bus; the old bus fades out
function launch() {
  if (!ctx || !master || !reverb) return;
  const now = ctx.currentTime;
  const old = bus;
  if (old) {
    old.gain.cancelScheduledValues(now);
    old.gain.setValueAtTime(old.gain.value, now);
    old.gain.linearRampToValueAtTime(0, now + 0.9);
    window.setTimeout(() => old.disconnect(), 1500);
  }
  const b = ctx.createGain();
  b.gain.setValueAtTime(0, now);
  b.gain.linearRampToValueAtTime(1, now + 1.6);
  b.connect(master);
  const send = ctx.createGain();
  send.gain.value = DEFS[current].send;
  b.connect(send);
  send.connect(reverb);
  bus = b;
  stepN = 0;
  nextT = now + 0.12;
  if (timer === undefined) timer = window.setInterval(tick, 60);
}

export function startMusic() {
  ensure();
  if (!ctx || !master) return;
  ctx.resume();
  muted = false;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
  if (timer === undefined) launch();
}

export function stopMusic() {
  muted = true;
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  }
  window.clearInterval(timer);
  timer = undefined;
}

export function setTrack(id: TrackId) {
  current = id;
  if (!muted && ctx) launch();
}

export function getTrack() {
  return current;
}

export function isMuted() {
  return muted;
}

// ---- tiny sfx --------------------------------------------------------------
export function sfx(kind: "click" | "flash" | "ping" | "arrive" | "roar" | "wave", idx = 0) {
  if (muted || !ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const tone = (type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t + delay);
    o.frequency.exponentialRampToValueAtTime(f1, t + delay + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + delay);
    g.gain.linearRampToValueAtTime(vol, t + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
    o.connect(g);
    g.connect(master!);
    o.start(t + delay);
    o.stop(t + delay + dur + 0.05);
  };
  switch (kind) {
    case "click":
      tone("sine", 880, 1320, 0.18, 0.08);
      break;
    case "flash":
      tone("square", 2200, 300, 0.12, 0.05);
      break;
    case "ping":
      tone("sine", 660, 660, 0.5, 0.07);
      window.setTimeout(() => tone("sine", 990, 990, 0.5, 0.06), 160);
      break;
    case "roar":
      tone("sawtooth", 180, 50, 0.7, 0.07);
      break;
    case "wave":
      // a friendly radio blip: three rising beeps
      tone("sine", 520, 540, 0.16, 0.07, 0);
      tone("sine", 700, 720, 0.16, 0.07, 0.14);
      tone("sine", 940, 960, 0.3, 0.07, 0.28);
      break;
    case "arrive": {
      const m = DRIFT_SC[idx % DRIFT_SC.length];
      [1, 2.01].forEach((mult, i) => {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = mtof(m) * mult;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06 / (i + 1), t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        o.connect(g);
        g.connect(master!);
        if (reverb) g.connect(reverb);
        o.start(t);
        o.stop(t + 2.3);
      });
      break;
    }
  }
}
