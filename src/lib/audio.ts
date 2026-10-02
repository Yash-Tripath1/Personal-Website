// Generative ambient music + tiny UI sounds, all WebAudio — no files.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let wet: GainNode | null = null;
let running = false;
let muted = true;
let chordTimer: number | undefined;
let noteTimer: number | undefined;
let chordIdx = 0;

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const CHORDS = [
  [53, 57, 60, 64], // Fmaj7
  [48, 55, 59, 64], // Cmaj7
  [45, 55, 60, 64], // Am7
  [43, 55, 59, 62], // G6
];
const SCALE = [72, 74, 76, 79, 81, 84, 88];

function makeImpulse(c: AudioContext, seconds = 3.2) {
  const len = c.sampleRate * seconds;
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
}

function playChord() {
  if (!ctx || !master || !reverb || muted) return;
  const chord = CHORDS[chordIdx++ % CHORDS.length];
  const t = ctx.currentTime;
  const dur = 9;
  chord.forEach((m, i) => {
    const o = ctx!.createOscillator();
    o.type = i === 0 ? "sine" : "triangle";
    o.frequency.value = mtof(m);
    o.detune.value = (Math.random() - 0.5) * 12;
    const f = ctx!.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 2.6);
    g.gain.linearRampToValueAtTime(0, t + dur + 1.5);
    o.connect(f);
    f.connect(g);
    g.connect(master!);
    g.connect(reverb!);
    o.start(t);
    o.stop(t + dur + 1.6);
  });
}

function playBell(note?: number, vol = 0.07) {
  if (!ctx || !master || !reverb) return;
  const m = note ?? SCALE[Math.floor(Math.random() * SCALE.length)];
  const t = ctx.currentTime;
  [1, 2.01].forEach((mult, i) => {
    const o = ctx!.createOscillator();
    o.type = "sine";
    o.frequency.value = mtof(m) * mult;
    const g = ctx!.createGain();
    const v = vol / (i + 1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g);
    g.connect(master!);
    g.connect(reverb!);
    o.start(t);
    o.stop(t + 2.5);
  });
}

function loopNotes() {
  if (muted) return;
  if (Math.random() < 0.75) playBell();
  noteTimer = window.setTimeout(loopNotes, 1100 + Math.random() * 2400);
}

export function startMusic() {
  ensure();
  if (!ctx || !master) return;
  ctx.resume();
  muted = false;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
  if (!running) {
    running = true;
    playChord();
    chordTimer = window.setInterval(playChord, 8500);
    noteTimer = window.setTimeout(loopNotes, 1200);
  } else {
    window.clearTimeout(noteTimer);
    loopNotes();
  }
}

export function stopMusic() {
  muted = true;
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  }
  window.clearTimeout(noteTimer);
}

export function isMuted() {
  return muted;
}

export function destroyMusic() {
  window.clearInterval(chordTimer);
  window.clearTimeout(noteTimer);
}

// ---- tiny sfx -------------------------------------------------------------
export function sfx(kind: "click" | "flash" | "ping" | "arrive" | "roar", idx = 0) {
  if (muted || !ctx || !master) return;
  const t = ctx.currentTime;
  const tone = (type: OscillatorType, f0: number, f1: number, dur: number, vol: number) => {
    const o = ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master!);
    o.start(t);
    o.stop(t + dur + 0.05);
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
      setTimeout(() => tone("sine", 990, 990, 0.5, 0.06), 160);
      break;
    case "roar":
      tone("sawtooth", 180, 50, 0.7, 0.07);
      break;
    case "arrive":
      playBell(SCALE[idx % SCALE.length] + 0, 0.06);
      break;
  }
}
