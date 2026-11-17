/**
 * Writes VOICEOVER.md: every caption line with its start time and length, for recording the voice-over.
 *   npm run script
 */
import { writeFileSync } from "node:fs";
import { SEGMENTS, timeline } from "../src/script.ts";

const fps = 30;
const { lines, segments } = timeline(fps);
const tc = (f) => {
  const s = f / fps;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};
const words = (t) => t.split(/\s+/).filter(Boolean).length;
let md = `# Bunon demo: voice-over script\n\nRead each line so it starts at its time code; the length column is how long it stays on screen. Total: 3:00. About 150 words a minute is a calm pace.\n\nRecord one file for the whole video and save it as \`video/public/voiceover.mp3\`, then render with \`npm run render:voice\` (or tell Claude to fit the timings to your recording).\n\n`;
segments.forEach((seg, s) => {
  md += `## ${s + 1}. ${seg.label} (${tc(seg.from)}–${tc(seg.from + seg.duration)})\n\n| Start | Length | Words | Line |\n|---|---|---|---|\n`;
  for (const l of lines.filter((x) => x.segment === s)) md += `| ${tc(l.from)} | ${(l.duration / fps).toFixed(1)} s | ${words(l.text)} | ${l.text.replace(/\n/g, " ")} |\n`;
  md += "\n";
});
md += `## Sources for the numbers\n\n- 3,555 export garment factories, about 3 million workers: Mapped in Bangladesh, Dec 2024, via The Financial Express, 16 Feb 2025.\n- 871 base questions: SLCP converged assessment framework v1.7.1 (public flat file).\n- 45% of facilities pay $5,000–20,000 a year on audits: WRAP, "How Many Social Audits Are Enough?", Oct 2023.\n- Test results (16/16, 0 wrong drafts kept, 9/10): Bunon's own tests, described in the project README.\n`;
writeFileSync("VOICEOVER.md", md);
console.log(`VOICEOVER.md: ${lines.length} lines across ${SEGMENTS.length} segments`);
