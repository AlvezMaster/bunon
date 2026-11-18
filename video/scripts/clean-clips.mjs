/**
 * Cleans every voice clip in public/vo/: cuts Gemini's trailing static burst and adds short fades (see cleanEnds).
 * Safe to run more than once.   node scripts/clean-clips.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanEnds } from "./audio-split.mjs";

const dir = join(process.cwd(), "public", "vo");
for (const name of readdirSync(dir).filter((f) => /^line-\d+\.wav$/.test(f))) {
  const b = readFileSync(join(dir, name));
  const rate = b.readUInt32LE(24);
  const pcm = b.subarray(b.indexOf("data") + 8);
  const out = cleanEnds({ pcm, rate });
  const h = Buffer.from(b.subarray(0, 44));
  h.writeUInt32LE(36 + out.pcm.length, 4);
  h.writeUInt32LE(out.pcm.length, 40);
  writeFileSync(join(dir, name), Buffer.concat([h, out.pcm]));
  const cut = (pcm.length - out.pcm.length) / 2 / rate;
  if (cut > 0.05) console.log(`${name}: cut ${cut.toFixed(2)} s of static at the end`);
}
console.log("Clips cleaned.");
