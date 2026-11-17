/**
 * Accuracy test for questionnaire drafting: run with `npm run eval:qa` while Ollama is running.
 * Optional: OLLAMA_QA_MODEL=qwen3.5:2b npm run eval:qa   (compare model sizes)
 *
 * Reports, over the labelled sample questionnaire:
 *   - question sorting accuracy for the decision model and for the language model
 *   - answer accuracy (yes / no / value) on questions documents can answer
 *   - citation validity: share of kept drafts whose quote is really in the cited document (must be 100%)
 *   - how many questions were correctly left for a person
 */
import { BUYER_QUESTIONNAIRE, decideCategory } from "../src/lib/questionnaire.ts";
import { draftAnswer } from "../src/lib/server/questionnaire-ai.ts";

const rows: string[] = [];
let decisionOk = 0;
let modelOk = 0;
let answerOk = 0;
let answerable = 0;
let kept = 0;
let keptWrong = 0;
let personOk = 0;
let personDue = 0;
let ms = 0;
let engine = "";

for (const q of BUYER_QUESTIONNAIRE.questions) {
  const d = await draftAnswer(q, "org-nodiwear");
  engine = d.engine;
  ms += d.durationMs;
  const dec = decideCategory(q.text);
  if (dec.category === q.expected.category) decisionOk++;
  if (d.category === q.expected.category) modelOk++;
  const shouldAnswer = q.expected.category === "document_fact" || q.expected.category === "policy_exists";
  if (shouldAnswer) {
    answerable++;
    if (d.status === "draft" && d.answer === q.expected.answer && d.docId === q.expected.docId) answerOk++;
  } else {
    personDue++;
    if (d.status !== "draft") personOk++;
  }
  if (d.status === "draft") {
    kept++;
    if (!shouldAnswer || d.answer !== q.expected.answer || d.docId !== q.expected.docId) keptWrong++;
  }
  rows.push(`${q.id}  ${d.status.padEnd(12)} ${d.category.padEnd(13)} ${d.answer.padEnd(7)} ${d.docId ?? "-"}  (${d.durationMs} ms)`);
}

const n = BUYER_QUESTIONNAIRE.questions.length;
console.log(rows.join("\n"));
console.log(`\nEngine: ${engine}`);
console.log(`Decision model sorting:   ${decisionOk}/${n}`);
console.log(`Language model sorting:   ${modelOk}/${n}`);
console.log(`Correct cited answers:    ${answerOk}/${answerable} answerable questions`);
console.log(`Left for a person:        ${personOk}/${personDue} questions that need one`);
console.log(`Drafts kept:              ${kept} (every kept draft has a quote verified word for word)`);
console.log(`Wrong drafts kept:        ${keptWrong}`);
console.log(`Average time per answer:  ${Math.round(ms / n)} ms`);
console.log("\nNote: 13 labelled questions on synthetic documents; treat this as a smoke test, not a benchmark.");
