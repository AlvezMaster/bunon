/**
 * Voice clips: checks the recorded clips in public/vo/ (line-01.mp3 … line-31.mp3, also .wav or .m4a), writes their
 * lengths to src/vo.generated.ts so every line is timed to its voice, and reports any line that does not fit.
 *   npm run vo
 * Then render with `npm run render:voice` (captions on) or `npm run render:clean` (no captions).
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { FPS, SEGMENTS, VO_LEAD_S, VO_MAX_RATE, VO_TAIL_S, timeline } from "../src/script.ts";

const dir = join(process.cwd(), "public", "vo");
const remotion = join(process.cwd(), "node_modules", "@remotion");
const compositor = readdirSync(remotion).find((d) => d.startsWith("compositor-"));
const ffprobe = compositor && join(remotion, compositor, process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
if (!ffprobe || !existsSync(ffprobe)) throw new Error("ffprobe not found; run npm install in video/ first.");

const count = SEGMENTS.reduce((n, s) => n + s.lines.length, 0);
const vo = {};
for (let i = 0; i < count; i++) {
  const name = [".mp3", ".wav", ".m4a"].map((ext) => `line-${String(i + 1).padStart(2, "0")}${ext}`).find((f) => existsSync(join(dir, f)));
  if (!name) continue;
  const seconds = Number(execFileSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(dir, name)]).toString().trim());
  if (seconds > 0) vo[i] = { file: name, seconds: Math.round(seconds * 100) / 100 };
}

writeFileSync(
  join(process.cwd(), "src", "vo.generated.ts"),
  `// Written by \`npm run vo\` from the clips in public/vo/. Do not edit by hand.\nimport type { VoClips } from "./script";\n\nexport const VO: VoClips = ${JSON.stringify(vo, null, 2)};\n`
);

const { lines, segments } = timeline(FPS, vo);
const found = Object.keys(vo).length;
console.log(`Clips found: ${found} of ${count} (in public/vo/)\n`);
let problems = 0;
segments.forEach((seg, s) => {
  const segLines = lines.map((l, i) => ({ ...l, i })).filter((l) => l.segment === s);
  const voiced = segLines.filter((l) => vo[l.i]);
  const need = voiced.reduce((t, l) => t + vo[l.i].seconds + VO_LEAD_S + VO_TAIL_S, 0);
  const slot = seg.duration / FPS;
  const rate = segLines[0].rate;
  const status =
    voiced.length < segLines.length
      ? `${segLines.length - voiced.length} clip(s) missing`
      : need / VO_MAX_RATE > slot
        ? `TOO LONG by ${(need / VO_MAX_RATE - slot).toFixed(1)} s even at ×${VO_MAX_RATE} speed`
        : rate > 1
          ? `fits when played at ×${rate.toFixed(2)} speed`
          : `fits (${(slot - need).toFixed(1)} s spare)`;
  console.log(`${s + 1}. ${seg.label.padEnd(20)} ${(seg.duration / FPS).toFixed(0)} s slot, voice ${need.toFixed(1)} s: ${status}`);
  if (status.startsWith("TOO")) problems++;
  for (const l of voiced) {
    const room = l.duration / FPS - VO_LEAD_S;
    if (vo[l.i].seconds / l.rate > room + 0.05) {
      problems++;
      console.log(`   line ${String(l.i + 1).padStart(2, "0")}: clip ${vo[l.i].seconds.toFixed(1)} s, room ${room.toFixed(1)} s, will be cut off`);
    }
  }
});
console.log(
  problems
    ? "\nFix: make the long clips again a little faster (or shorten the line in src/script.ts), then rerun npm run vo."
    : found
      ? "\nAll clips fit. Render with: npm run render:voice (captions) or npm run render:clean (no captions)."
      : "\nNo clips yet. Save them as public/vo/line-01.mp3 … and rerun."
);
