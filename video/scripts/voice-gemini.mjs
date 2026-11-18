/**
 * Generates the voice-over with Gemini text-to-speech (Google AI Studio), as public/vo/line-01.wav … line-32.wav.
 * Then run `npm run vo` to check the fit, and render.
 *
 * The free tier allows only a few requests a day, so each of the five parts is one request: the part is read in one
 * go with a pause between lines, and the audio is cut into line clips at those pauses (`--by-line` asks line by line).
 * The Bangla sentence is tried on its own and joined to its line; if Gemini cannot say it, record it on a phone.
 *
 *   npm run voice -- --voice=Charon                 parts that still miss a clip
 *   npm run voice -- --voice=Charon --force         every part again
 *   npm run voice -- --voice=Charon --part=3        one part (1–5) again
 *   npm run voice -- --voice=Charon --by-line --only=5,21
 *   npm run voice -- --list-voices
 *
 * Needs GEMINI_API_KEY in video/.env.local or the app's .env.local (both ignored by git); only the Gemini lines are
 * read, and the key is only sent to Google's API, never printed. GEMINI_TTS_MODEL picks a model.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SEGMENTS } from "../src/script.ts";
import { cleanEnds, splitAtPauses } from "./audio-split.mjs";

const VOICES = ["Kore", "Aoede", "Leda", "Zephyr", "Callirrhoe", "Autonoe", "Charon", "Puck", "Fenrir", "Orus", "Iapetus", "Enceladus"];
const STYLE =
  "Read this as a warm, confident startup founder presenting to competition judges: clear, friendly and credible, never salesy, at a brisk, natural conversational pace with only short pauses inside sentences. Light Bangladeshi English accent";
/** Spoken forms for words a voice may misread (the captions keep the written form). */
const SAY = [[/\bSLCP\b/g, "S. L. C. P."]];
const BANGLA = /[ঀ-৿]/;

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));

// ---- key: only the Gemini lines of video/.env.local or the app's .env.local, never printed
for (const envFile of [join(process.cwd(), ".env.local"), join(process.cwd(), "..", ".env.local")]) {
  if (!existsSync(envFile)) continue;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(GEMINI_API_KEY|GEMINI_TTS_MODEL)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const KEY = process.env.GEMINI_API_KEY?.trim() ?? "";
const API = "https://generativelanguage.googleapis.com/v1beta";
const headers = { "x-goog-api-key": KEY, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const short = (e) => String(e?.message ?? e).split("\n")[0].slice(0, 120);

/** Text-to-speech models this key can use, best first (pro before flash, newer before older). */
async function ttsModels() {
  if (process.env.GEMINI_TTS_MODEL) return [process.env.GEMINI_TTS_MODEL.replace(/^models\//, "")];
  const res = await fetch(`${API}/models?pageSize=1000`, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Could not list models (HTTP ${res.status}): ${json.error?.message ?? "check the key"}`);
  const names = (json.models ?? [])
    .filter((m) => /tts/i.test(m.name) && (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""));
  const version = (n) => Number(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  return names.sort((a, b) => /pro/.test(b) - /pro/.test(a) || version(b) - version(a));
}

/** One request → 16-bit PCM. Waits when asked to slow down; a daily limit ends the run (status 429, daily: true). */
async function speak(model, voice, text, note = "") {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`${API}/models/${model}:generateContent`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        // Directions and the words to speak are kept apart, so only the transcript is read aloud.
        contents: [{ parts: [{ text: `### DIRECTOR'S NOTES\n${STYLE}. ${note}Speak only the transcript below, nothing else.\n\n### TRANSCRIPT\n${text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      }),
    });
    const json = await res.json().catch(() => ({}));
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (res.ok && part) {
      const rate = Number(part.inlineData.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000);
      return { pcm: Buffer.from(part.inlineData.data, "base64"), rate };
    }
    const msg = json.error?.message ?? (res.ok ? "No audio generated" : `HTTP ${res.status}`);
    const daily = res.status === 429 && /per day/i.test(msg);
    const busy = res.status === 503 || /high demand/i.test(msg);
    if (((res.status === 429 && !daily) || busy) && attempt < 5) {
      const wait = Number(json.error?.details?.find((d) => d.retryDelay)?.retryDelay?.replace("s", "")) || 15 * attempt;
      console.log(`   ${busy ? "model busy" : "rate limit"}, waiting ${Math.ceil(wait)} s…`);
      await sleep(Math.ceil(wait) * 1000 + 500);
      continue;
    }
    throw Object.assign(new Error(msg), { status: res.status, daily });
  }
  throw new Error("Gave up after repeated retries.");
}

function wav({ pcm, rate }) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const words = (t) => t.split(/\s+/).filter(Boolean).length;
const spoken = (t) => SAY.reduce((x, [re, to]) => x.replace(re, to), t);
const englishPart = (t) => t.split("\n").filter((x) => !BANGLA.test(x)).join(" ").trim();
const banglaPart = (t) => t.split("\n").filter((x) => BANGLA.test(x)).join(" ").trim();

async function main() {
  if (args["list-voices"]) {
    console.log(`Some Gemini voices: ${VOICES.join(", ")}. Try them in AI Studio first.`);
    return;
  }
  if (!KEY) {
    console.error("No GEMINI_API_KEY. Create a key in Google AI Studio and save it in video/.env.local as GEMINI_API_KEY=your-key");
    process.exitCode = 1;
    return;
  }
  const voice = typeof args.voice === "string" ? args.voice : "Kore";
  const dir = join(process.cwd(), "public", "vo");
  mkdirSync(dir, { recursive: true });
  const file = (n) => join(dir, `line-${pad(n)}.wav`);

  const models = await ttsModels();
  if (!models.length) throw new Error("This key has no text-to-speech model available. Check Google AI Studio.");
  let model = models[0];
  console.log(`Voice ${voice}, model ${model}\n`);

  /** One request, moving on to the next model when this key may not use one. */
  const say = async (text, note) => {
    for (;;) {
      try {
        return await speak(model, voice, text, note);
      } catch (e) {
        if ([403, 404, 429].includes(e.status) && models.indexOf(model) < models.length - 1) {
          model = models[models.indexOf(model) + 1];
          console.log(`   switching to model ${model} (${short(e)})`);
          continue;
        }
        throw e;
      }
    }
  };

  const notes = [];
  const all = SEGMENTS.flatMap((s, si) => s.lines.map((l) => ({ text: l.text, part: si + 1 })));
  const banglaLines = [];
  try {
    if (args["by-line"] && args.together && typeof args.only === "string") {
      // Several chosen lines in ONE request (saves the free daily allowance), cut apart at the pauses.
      const nums = args.only.split(",").map(Number).filter((n) => n >= 1 && n <= all.length);
      const texts = nums.map((n) => spoken(englishPart(all[n - 1].text)));
      const reading = cleanEnds(await say(texts.join("\n\n"), "Leave a clear pause of about one second between paragraphs. "));
      const clips = splitAtPauses(reading, texts.length, texts.map(words))?.map(cleanEnds);
      if (!clips) notes.push(`lines ${nums.join(", ")}: could not find the pauses; run them --by-line one at a time`);
      else clips.forEach((c, k) => {
        writeFileSync(file(nums[k]), wav(c));
        console.log(`✓ line ${pad(nums[k])}`);
      });
    } else if (args["by-line"]) {
      const only = typeof args.only === "string" ? new Set(args.only.split(",").map(Number)) : null;
      for (const [i, l] of all.entries()) {
        const n = i + 1;
        if (only ? !only.has(n) : existsSync(file(n)) && !args.force) continue;
        writeFileSync(file(n), wav(cleanEnds(await say(spoken(englishPart(l.text))))));
        console.log(`✓ line ${pad(n)}`);
        if (BANGLA.test(l.text)) banglaLines.push(n);
        await sleep(1200);
      }
    } else {
      for (const [si, seg] of SEGMENTS.entries()) {
        const first = all.findIndex((l) => l.part === si + 1) + 1;
        const nums = seg.lines.map((_, k) => first + k);
        const wanted = args.part ? Number(args.part) === si + 1 : args.force || nums.some((n) => !existsSync(file(n)));
        if (!wanted) continue;
        const texts = seg.lines.map((l) => spoken(englishPart(l.text)));
        const reading = cleanEnds(await say(texts.join("\n\n"), "Leave a clear pause of about one second between paragraphs. "));
        const clips = splitAtPauses(reading, texts.length, texts.map(words))?.map(cleanEnds);
        if (!clips) {
          notes.push(`part ${si + 1}: could not find a pause between every line; try --part=${si + 1} again or --by-line`);
          console.log(`✗ part ${si + 1} ${seg.label}: pauses not clear enough`);
          continue;
        }
        // Each clip should be roughly as long as its share of the words; a big mismatch means a wrong cut.
        const total = clips.reduce((t, c) => t + c.pcm.length, 0);
        const allWords = texts.reduce((t, x) => t + words(x), 0);
        clips.forEach((c, k) => {
          const ratio = c.pcm.length / total / (words(texts[k]) / allWords);
          if (ratio < 0.45 || ratio > 2.2) notes.push(`line ${pad(nums[k])}: length looks off (×${ratio.toFixed(1)} of expected); listen to it`);
          writeFileSync(file(nums[k]), wav(c));
        });
        seg.lines.forEach((l, k) => BANGLA.test(l.text) && banglaLines.push(nums[k]));
        console.log(`✓ part ${si + 1} ${seg.label}: ${clips.length} clips (lines ${pad(nums[0])}–${pad(nums.at(-1))})`);
        await sleep(1500);
      }
    }
    // The Bangla sentence on its own, joined after the English part of its line.
    for (const n of banglaLines) {
      try {
        const bn = cleanEnds(await say(banglaPart(all[n - 1].text)));
        const en = readFileSync(file(n)).subarray(44);
        const gap = Buffer.alloc(Math.round(bn.rate * 0.35) * 2);
        writeFileSync(file(n), wav({ pcm: Buffer.concat([en, gap, bn.pcm]), rate: bn.rate }));
        console.log(`✓ line ${pad(n)}: Bangla sentence added`);
      } catch (e) {
        if (e.daily) throw e;
        notes.push(`line ${pad(n)}: Gemini could not say the Bangla sentence (${short(e)}); record it on a phone`);
      }
    }
  } catch (e) {
    if (!e.daily) throw e;
    notes.push(`Google's free daily limit is used up (${short(e)}). It resets around 14:00 Bangladesh time; run the same command again then.`);
  }

  const have = all.filter((_, i) => existsSync(file(i + 1))).length;
  console.log(`\nClips on disk: ${have} of ${all.length}`);
  if (notes.length) console.log(`Needs attention:\n- ${notes.join("\n- ")}`);
  console.log("Next: npm run vo   (checks the fit and times every line to its voice)");
}

await main();
