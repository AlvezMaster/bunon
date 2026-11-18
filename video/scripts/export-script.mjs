/**
 * Writes VOICEOVER.md: every caption line with its start time and length, for recording the voice-over.
 *   npm run script
 */
import { writeFileSync } from "node:fs";
import { SEGMENTS, timeline } from "../src/script.ts";
import { VO } from "../src/vo.generated.ts";

const fps = 30;
const { lines, segments } = timeline(fps, VO);
const tc = (f) => {
  const s = f / fps;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};
const words = (t) => t.split(/\s+/).filter(Boolean).length;
let md =
  `# Bunon demo: voice-over script

Total: 3:00 in five parts. Each line stays on screen for its length; about 150 words a minute is a calm pace.

` +
  `**ElevenLabs:** generate each line as its own clip and save it as \`video/public/vo/line-NN.mp3\` (NN = the # column, 01 to ${lines.length}). ` +
  `Then run \`npm run vo\` in \`video/\`: it measures every clip, times each line to its voice (each part keeps its official length) and lists any clip that is too long. ` +
  `Render with \`npm run render:voice\` (captions on) or \`npm run render:clean\` (no captions).

` +
  `Pronunciation: write Bunon as "Boo-non", SLCP as "S. L. C. P.", Qwen as "Kwen" if the voice gets them wrong.

`;
segments.forEach((seg, s) => {
  md += `## ${s + 1}. ${seg.label} (${tc(seg.from)}–${tc(seg.from + seg.duration)})\n\n| # | Start | Length | Words | Voice clip | Line |\n|---|---|---|---|---|---|\n`;
  for (const [i, l] of lines.entries()) {
    if (l.segment !== s) continue;
    const clip = VO[i] ? `${VO[i].seconds.toFixed(1)} s` : "–";
    md += `| ${String(i + 1).padStart(2, "0")} | ${tc(l.from)} | ${(l.duration / fps).toFixed(1)} s | ${words(l.text)} | ${clip} | ${l.text.replace(/\n/g, " ")} |\n`;
  }
  md += "\n";
});
md += `## Sources for the numbers\n\n- 3,555 export garment factories, about 3 million workers: Mapped in Bangladesh, Dec 2024, via The Financial Express, 16 Feb 2025.\n- 871 base questions: SLCP converged assessment framework v1.7.1 (public flat file).\n- 45% of facilities pay $5,000–20,000 a year on audits: WRAP, "How Many Social Audits Are Enough?", Oct 2023.\n- Test results (16/16, 0 wrong drafts kept, 8/10 with Qwen 3.5 4B): Bunon's own tests, described in the project README.\n`;
writeFileSync("VOICEOVER.md", md);
console.log(`VOICEOVER.md: ${lines.length} lines across ${SEGMENTS.length} segments`);
