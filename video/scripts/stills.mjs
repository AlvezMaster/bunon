/**
 * Renders check frames (one per line of the script, at 65% through it) into out/frames/ for review.
 *   node scripts/stills.mjs            every line
 *   node scripts/stills.mjs 0 3 9      only these line numbers
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { timeline } from "../src/script.ts";

const only = process.argv.slice(2).map(Number);
const out = resolve("out/frames");
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "BunonDemo", inputProps: { showCaptions: true, voiceover: false } });
const { lines } = timeline(30);
for (const [i, l] of lines.entries()) {
  if (only.length && !only.includes(i)) continue;
  const frame = l.from + Math.round(l.duration * 0.65);
  const file = join(out, `line${String(i).padStart(2, "0")}_f${frame}.png`);
  await renderStill({ composition, serveUrl, frame, output: file, imageFormat: "png", overwrite: true });
  console.log(file.replace(resolve("."), "."));
}
