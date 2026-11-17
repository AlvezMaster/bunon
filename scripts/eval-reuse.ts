/**
 * Answer reuse test: how many repeated questions does Bunon find, and how often does it suggest a wrong answer?
 * Usage: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/eval-reuse.ts [--verbose]
 * Uses meaning search too when an embedding model is available on this computer.
 */
import { bestReuse, type PastQuestion } from "../src/lib/answer-reuse.ts";
import { dequantize, quantize } from "../src/lib/rag.ts";
import { embed } from "../src/lib/server/embeddings.ts";
import { BUYER_A, LATER_BUYERS } from "./reuse-questions.ts";

const all = [...BUYER_A.map((q) => q.text), ...LATER_BUYERS.map((q) => q.text)];
const vecs = await embed("documents", all);
const vec = (text: string) => (vecs ? dequantize(quantize(vecs.vectors[all.indexOf(text)])) : null);

const past: PastQuestion[] = BUYER_A.map((q) => ({ questionId: q.id, questionnaireId: "buyer-a", text: q.text, approvedAt: "2026-11-01", vector: vec(q.text) }));
let found = 0;
let missed = 0;
let wrong = 0;
let leftAlone = 0;
const repeats = LATER_BUYERS.filter((q) => q.repeats).length;
const different = LATER_BUYERS.length - repeats;
for (const q of LATER_BUYERS) {
  const m = bestReuse({ questionId: q.text, questionnaireId: `buyer-${q.buyer}`, text: q.text, vector: vec(q.text) }, past);
  const got = m?.questionId ?? null;
  const verdict = got === q.repeats ? (got ? "found" : "correctly none") : got ? "WRONG" : "missed";
  if (verdict === "found") found++;
  if (verdict === "missed") missed++;
  if (verdict === "WRONG") wrong++;
  if (verdict === "correctly none") leftAlone++;
  if (process.argv.includes("--verbose") || verdict === "WRONG") console.log(`${verdict.padEnd(15)} ${q.buyer} ${q.text}  →  ${got ?? "-"}${m ? ` (${m.how} ${m.score.toFixed(2)})` : ""}`);
}
const suggested = found + wrong;
console.log(`\nMatching: ${vecs ? `words + meaning (${vecs.model})` : "words only (no embedding model on this computer)"}`);
console.log(`Repeated questions found:        ${found}/${repeats} (${Math.round((100 * found) / repeats)}%)`);
console.log(`Different questions left alone:  ${leftAlone}/${different}`);
console.log(`Wrong suggestions:               ${wrong} of ${suggested} suggestions`);
console.log(`Missed (asked again from documents instead): ${missed}`);
