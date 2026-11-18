/**
 * Synthesises the video's small sound effects into public/sfx/ (no downloads, deterministic):
 * click (cursor click), pop (a label appears), whoosh (a new segment), swipe (one screen to the next).
 *   node scripts/sfx.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RATE = 48000;
const out = join(process.cwd(), "public", "sfx");
mkdirSync(out, { recursive: true });

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function wav(name, samples) {
  const peak = Math.max(...samples.map(Math.abs)) || 1;
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  samples.forEach((v, i) => {
    // 5 ms fades at both ends, so nothing starts or stops with a click of its own.
    const edge = Math.min(1, i / (RATE * 0.005), (n - 1 - i) / (RATE * 0.005));
    buf.writeInt16LE(Math.round((v / peak) * 0.7 * edge * 32767), 44 + i * 2);
  });
  writeFileSync(join(out, `${name}.wav`), buf);
  console.log("  saved", name, (n / RATE).toFixed(2), "s");
}

/** Band-pass noise whose centre glides from f0 to f1, shaped by an attack/release envelope. */
function sweep(seconds, f0, f1, attack, q = 1.2) {
  const n = Math.round(seconds * RATE);
  const s = new Array(n);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = f0 * Math.pow(f1 / f0, t);
    const w = (2 * Math.PI * f) / RATE;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    const x = rand();
    const y = ((alpha * x - alpha * x2) - (-2 * Math.cos(w)) * y1 - (1 - alpha) * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    const env = t < attack ? Math.pow(t / attack, 2) : Math.pow(1 - (t - attack) / (1 - attack), 2.2);
    s[i] = y * env;
  }
  return s;
}

function click() {
  const n = Math.round(0.07 * RATE);
  return Array.from({ length: n }, (_, i) => {
    const t = i / RATE;
    const tick = Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-t / 0.006);
    const body = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.018) * 0.6;
    const grit = rand() * Math.exp(-t / 0.002) * 0.3;
    return tick + body + grit;
  });
}

function pop() {
  const n = Math.round(0.16 * RATE);
  let phase = 0;
  return Array.from({ length: n }, (_, i) => {
    const t = i / RATE;
    const f = 300 + 700 * Math.exp(-t / 0.025);
    phase += (2 * Math.PI * f) / RATE;
    return Math.sin(phase) * Math.min(1, t / 0.003) * Math.exp(-t / 0.045);
  });
}

console.log("Sound effects");
wav("click", click());
wav("pop", pop());
wav("whoosh", sweep(0.75, 300, 2600, 0.45));
wav("swipe", sweep(0.38, 900, 3400, 0.35, 1.6));
