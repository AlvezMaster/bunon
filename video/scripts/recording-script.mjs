/**
 * Writes RECORDING_SCRIPT.md: every narration line with its start time, how long it should take and how to say it,
 * for recording the voice-over with our own voices.   node scripts/recording-script.mjs
 */
import { writeFileSync } from "node:fs";
import { SEGMENTS, timeline } from "../src/script.ts";
import { VO } from "../src/vo.generated.ts";

/** How each part should sound. */
const PART = {
  problem: "Calm and serious. You are describing a real burden on real factories: no drama, let the numbers land. Short pause after each number.",
  solution: "Warmer and confident. This is the answer to the problem: clear, simple, a little lift in the voice on \"once\".",
  demo: "Relaxed and clear, like showing a friend around the app. Slightly quicker; the screen does the talking.",
  ai: "Precise and credible. You know how it works and you are not overselling it. Even pace.",
  impact: "Confident and forward-looking. Slow down for the very last line.",
};

/** Delivery notes for single lines (1-based line numbers). */
const NOTE = {
  1: "Friendly opening, a slight smile. Stress \"Bunon\" (say BOO-non).",
  2: "Say \"three thousand, five hundred and fifty-five\". Pause briefly after it.",
  3: "Plain statement. Stress \"its own\".",
  4: "Say \"eight hundred and seventy-one\". Stress \"alone\"; small pause after \"871\".",
  5: "List rhythm: fire safety… wages… child labour. Slight weariness: the same questions again.",
  6: "Say \"forty-five percent\" and \"five thousand to twenty thousand dollars\". Don't rush the numbers.",
  7: "A touch of concern, end the part with a falling tone.",
  8: "The key line of the video. Stress \"every\" and lift on \"once\".",
  9: "Clear and welcoming: two groups, factories and the brands that buy from them.",
  10: "Explaining step 1. Stress \"once\".",
  11: "Stress \"exact sentence\".",
  12: "Reassuring. Stress \"person\".",
  13: "Steady. Say \"tamper-evident\" clearly.",
  14: "Stress \"source sentence\".",
  15: "Honest and firm. Stress \"checks\" and \"does not certify\".",
  16: "Start of the demo. Stress \"one questionnaire\" and \"all\".",
  17: "Light and easy.",
  18: "Stress \"one click\" and \"source sentence\".",
  19: "Small pause after \"never guesses.\" Stress \"person\".",
  20: "Stress \"sealed\".",
  21: "Stress \"other words\". This is answer reuse: a little pleased.",
  22: "Say \"A-I agent\". Stress \"its own\" and \"a person checks and sends\".",
  23: "Brisk: three steps, one click.",
  24: "Stress \"side by side\" and \"source\".",
  25: "Simple. Stress \"next job\" and \"one big button\".",
  26: "Say \"Bangla\" naturally. Stress \"one click\".",
  27: "Say \"twelve-hour undo\" and \"thirty days\". Calm, reassuring.",
  28: "Stress \"sign out everywhere\". End of the demo: falling tone.",
  29: "Stress \"only that factory's documents\" and \"English and Bangla\".",
  30: "Say Qwen as \"Chwen\" (or \"Kwen\"; pick one and keep it). Stress \"open-source\" and \"own computer\". Never \"OpenAI\".",
  31: "Two clear halves: \"word for word\"… \"a second model must agree\".",
  32: "Long line: breathe before it. Say \"sixteen of sixteen\" and \"zero wrong answers\"; stress \"zero\".",
  33: "Stress \"once\" and \"not once per brand\".",
  34: "Stress \"three seconds\".",
  35: "Even list rhythm: hours saved… answers with a source… buyer follow-ups.",
  36: "The longest line (about 9.5 s): breathe first. Say \"three thousand five hundred taka\" and \"seven thousand five hundred\". Stress \"Buyers join free\".",
  37: "Say \"S-L-C-P\" letter by letter, and \"i-O-S and Android\". Forward-looking.",
  38: "The closing line. Slow down, warm, a short pause after \"Bunon.\"",
};

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const { lines } = timeline(30, VO);
let n = 0;
let md = `# Bunon video: script for recording our own voice

**Total: 3:00, in five parts.** Each line has a start time in the video, a **target** length and a **maximum**.
Aim for the target; up to the maximum still fits, because the video can play a line up to 15% faster.
Problem and Solution are the tightest parts, so keep those lines close to their targets.

## How it should sound overall
- **Who:** a warm, confident founder presenting to competition judges. Credible and friendly, never salesy.
- **Pace:** natural conversation, about 150 words a minute. Short pauses at commas, a breath between lines.
- **Accent:** your own Bangladeshi English is good: it is our story.
- **Energy:** smile slightly on the opening and closing lines; steadier and calmer in the middle.

## Say these words like this
| Word | Say it |
|---|---|
| Bunon | BOO-non (বুনন) |
| Qwen | Chwen (or Kwen: pick one and keep it). **Never "OpenAI".** |
| SLCP | S-L-C-P, letter by letter |
| AI / MCP | A-I / M-C-P |
| 3,555 | three thousand five hundred and fifty-five |
| 871 | eight hundred and seventy-one |
| ৳3,500 / ৳7,500 | three thousand five hundred taka / seven thousand five hundred |

## How to record
- A phone's voice recorder is fine. Record in a small, quiet room with soft things around (a wardrobe full of clothes is ideal); no fan, no AC.
- Hold the phone 15–20 cm from your mouth, a little to the side, and keep the **same place and distance** for every line.
- Record **one line per file**, with about 1 second of silence before and after.
- Name the files \`line-01\` … \`line-38\` (WAV, M4A or MP3) and send them to me. I'll trim them, check every length, and re-render the video.
- One voice for the whole video sounds most polished. If you want to show the team, switch voices only between parts (for example one person for Problem and Impact, another for Demo and AI).

`;

SEGMENTS.forEach((seg, s) => {
  const segLines = lines.filter((l) => l.segment === s);
  md += `\n## Part ${s + 1}: ${seg.label} (${mmss(segLines[0].from / 30)}–${mmss((segLines[0].from + segLines.reduce((t, l) => t + l.duration, 0)) / 30)})\n\n*${PART[seg.id]}*\n\n| # | Starts | Target | Max | Line | How to say it |\n|---|---|---|---|---|---|\n`;
  for (const l of segLines) {
    n++;
    const target = VO[n - 1]?.seconds ?? l.duration / 30;
    const max = Math.max(target, (l.duration / 30 - 0.4) * 1.15);
    md += `| ${String(n).padStart(2, "0")} | ${mmss(l.from / 30)} | ${target.toFixed(1)} s | ${max.toFixed(1)} s | ${l.text.replace(/\|/g, "\\|")} | ${NOTE[n] ?? ""} |\n`;
  }
});

writeFileSync("RECORDING_SCRIPT.md", md);
console.log(`RECORDING_SCRIPT.md: ${n} lines`);
