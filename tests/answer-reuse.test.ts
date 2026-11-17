import { test } from "node:test";
import assert from "node:assert/strict";
import { bestReuse, formOf, matchQuestion, topicsOf, wordOverlap, type PastQuestion } from "../src/lib/answer-reuse.ts";
import { QUESTIONNAIRES } from "../src/lib/questionnaire.ts";
import { BUYER_A, LATER_BUYERS } from "../scripts/reuse-questions.ts";

const past = (text: string, extra: Partial<PastQuestion> = {}): PastQuestion => ({
  questionId: "old",
  questionnaireId: "buyer-a",
  text,
  approvedAt: "2026-11-01T00:00:00Z",
  ...extra,
});
const next = (text: string, extra: Partial<PastQuestion> = {}) => ({ questionId: "new", questionnaireId: "buyer-b", text, ...extra });

test("the same question in other words reuses the earlier answer", () => {
  const pairs: Array<[string, string]> = [
    ["Has an independent building safety assessment been completed?", "Has an independent engineer assessed the building?"],
    ["Does the factory hold a valid fire licence?", "Does the factory have a valid fire licence?"],
    ["Is overtime voluntary?", "Is all overtime voluntary for workers?"],
    ["Are all workers paid at least the legal minimum wage?", "Do all workers receive at least the legal minimum wage?"],
  ];
  for (const [a, b] of pairs) assert.ok(matchQuestion(next(b), past(a)), `should match: "${a}" / "${b}"`);
  const same = matchQuestion(next("Do you have a written health and safety policy?"), past("Do you have a written health and safety policy?"));
  assert.equal(same?.how, "same");
});

test("different questions on the same topic do not reuse an answer", () => {
  const pairs: Array<[string, string, string]> = [
    ["Does the factory hold a valid fire licence?", "Does the factory hold a valid trade licence?", "different licence"],
    ["Are fire drills held every month?", "Are fire drills held every year?", "different time period"],
    ["Does the factory employ anyone under the age of 18?", "Does the factory employ anyone under the age of 16?", "different number"],
    ["Can workers raise grievances anonymously?", "Is there a written grievance procedure for workers?", "related, not the same"],
    ["Does the factory employ anyone under the age of 18?", "What is the minimum age of workers?", "yes/no against a value"],
    ["Is overtime voluntary?", "Is overtime never forced?", "one is negative"],
  ];
  for (const [a, b, why] of pairs) assert.equal(matchQuestion(next(b), past(a)), null, `should not match (${why})`);
});

test("never reuses within the same questionnaire", () => {
  const q = "Does the factory hold a valid fire licence?";
  assert.equal(matchQuestion(next(q, { questionnaireId: "buyer-a" }), past(q)), null);
});

test("meaning only counts when some words are shared too", () => {
  const v = new Int8Array([90, 10, 0, 40]);
  const close = matchQuestion(next("Is there a valid fire certificate?", { vector: v }), past("Does the factory hold a valid fire licence?", { vector: v }));
  assert.equal(close?.how, "meaning");
  const far = matchQuestion(next("Are evacuation routes kept clear?", { vector: v }), past("Is there a fire alarm on each floor?", { vector: v }));
  assert.equal(far, null);
});

test("picks the closest earlier answer, then the newest", () => {
  const list = [
    past("Is overtime voluntary for workers in every unit?", { questionId: "a", approvedAt: "2026-11-01" }),
    past("Is overtime voluntary?", { questionId: "b", approvedAt: "2026-10-01" }),
    past("Is overtime voluntary?", { questionId: "c", approvedAt: "2026-11-05" }),
  ];
  assert.equal(bestReuse(next("Is overtime voluntary?"), list)?.questionId, "c");
});

test("topics, question kinds and overlap work for English and Bangla", () => {
  assert.deepEqual(topicsOf("When was the last fire evacuation drill held?"), ["fire"]);
  assert.ok(topicsOf("কারখানায় কি ১৮ বছরের কম বয়সী কেউ কাজ করে?").includes("child"));
  assert.equal(formOf("কারখানায় কি ১৮ বছরের কম বয়সী কেউ কাজ করে?"), "yes_no");
  assert.equal(formOf("কারখানায় কতজন শ্রমিক কাজ করেন?"), "value");
  assert.equal(formOf("How many workers does the factory employ?"), "value");
  assert.equal(formOf("সর্বশেষ অগ্নি মহড়া কবে হয়েছিল?"), "value");
  assert.equal(formOf("নিয়োগের সময় শ্রমিকদের বয়স যাচাইয়ের কোনো পদ্ধতি আছে কি?"), "yes_no");
  assert.equal(wordOverlap("Is overtime voluntary?", "Is overtime voluntary?"), 1);
});

test("demo data: Vela's building question reuses Nodiwear's answer to Nordlys, and nothing else matches", () => {
  const nordlys = QUESTIONNAIRES.find((q) => q.id === "nordlys-2026")!;
  const vela = QUESTIONNAIRES.find((q) => q.id === "vela-2026")!;
  const answered = nordlys.questions.map((q) => past(q.text, { questionId: q.id, questionnaireId: nordlys.id }));
  const found = Object.fromEntries(
    vela.questions.map((q) => [q.id, bestReuse({ questionId: q.id, questionnaireId: vela.id, text: q.text }, answered)?.questionId ?? null])
  );
  assert.deepEqual(found, { v01: null, v02: null, v03: "q10", v04: null });
});

test("reuse test set (words only): no wrong suggestions, and at least 18 of 24 repeats found", () => {
  const answered = BUYER_A.map((q) => past(q.text, { questionId: q.id, questionnaireId: "buyer-a" }));
  let found = 0;
  for (const q of LATER_BUYERS) {
    const got = bestReuse({ questionId: q.text, questionnaireId: `buyer-${q.buyer}`, text: q.text }, answered)?.questionId ?? null;
    if (got) assert.equal(got, q.repeats, `wrong suggestion for "${q.text}"`);
    if (got && got === q.repeats) found++;
  }
  assert.ok(found >= 18, `only ${found} repeats found`);
});
