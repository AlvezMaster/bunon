/**
 * Renders check frames (one per line of the script, at 65% through it) into out/frames/ for review.
 *   node scripts/stills.mjs            every line
 *   node scripts/stills.mjs 0 3 9      only these line numbers
 *   node scripts/stills.mjs 22@0.3     line 22 at 30% through it
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { timeline } from "../src/script.ts";
import { VO } from "../src/vo.generated.ts";

const picks = process.argv.slice(2).map((a) => a.split("@").map(Number));
const only = picks.map(([n]) => n);
const out = resolve("out/frames");
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "BunonDemo", inputProps: { showCaptions: true, voiceover: false } });
const { lines } = timeline(30, VO);
const jobs = picks.length ? picks : lines.map((_, i) => [i]);
for (const [i, at = 0.65] of jobs) {
  const l = lines[i];
  if (!l) continue;
  const frame = l.from + Math.round(l.duration * at);
  const file = join(out, `line${String(i).padStart(2, "0")}_f${frame}.jpg`);
  await renderStill({ composition, serveUrl, frame, output: file, imageFormat: "jpeg", jpegQuality: 80, scale: 0.5, overwrite: true });
  console.log(file.replace(resolve("."), "."));
}
