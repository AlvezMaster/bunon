import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, norm, ruleDiff, swap } from "../src/lib/action-plan.ts";
import { chunkText, hybridSearch } from "../src/lib/rag.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";
import { WATCHED_RULES, latest } from "../src/lib/watched-rules.ts";

const passages = FACTORY_DOCUMENTS.flatMap((d) => chunkText(d.id, d.title, d.text));
const planFor = (before: string, after: string, answers: Parameters<typeof buildPlan>[0]["answers"] = [], questionnaires: Parameters<typeof buildPlan>[0]["questionnaires"] = []) =>
  buildPlan({ before, after, answers, questionnaires, found: hybridSearch(before, passages, null, 6).map((p) => ({ docId: p.docId, title: p.docId, text: p.text })) });

test("regulatory diff finds changed values, as digits or words", () => {
  assert.deepEqual(ruleDiff("BDT 12,500 per month", "BDT 15,000 per month"), [{ from: "12500", to: "15000" }]);
  assert.deepEqual(ruleDiff("the seventh working day", "the fifth working day"), [{ from: "7", to: "5" }]);
  assert.equal(norm("every three months, BDT 12,500"), "every 3 months, BDT 12500");
  assert.equal(swap("paid by the seventh day, BDT 12,500", "7", "5"), "paid by the fifth day, BDT 12,500");
  assert.equal(swap("BDT 12,500 per month", "12500", "15000"), "BDT 15,000 per month");
});

test("each watched rule's latest change gives the right plan on the demo documents", () => {
  const plans = Object.fromEntries(WATCHED_RULES.map((r) => [r.id, planFor(r.versions[0].text, latest(r).text)]));
  assert.deepEqual(plans["min-wage"].docs.map((d) => d.docId), ["wage-policy"]);
  assert.match(plans["min-wage"].docs[0].draft ?? "", /BDT 15,000 per month/);
  assert.match(plans["wage-payment"].docs[0].draft ?? "", /fifth working day/);
  assert.match(plans["weekly-hours"].docs[0].draft ?? "", /never exceed 56 hours per week/);
  assert.deepEqual(plans["minimum-age"].docs, []);
  assert.deepEqual(plans["minimum-age"].alreadyMeets.map((d) => d.docId), ["child-labour"]);
});

test("a sent answer quoting the old value is flagged for a corrected answer to its buyer", () => {
  const plan = planFor(
    "The legal minimum wage for the garment sector is BDT 12,500 per month for the entry grade.",
    "The legal minimum wage for the garment sector is BDT 15,000 per month for the entry grade.",
    [{ questionId: "q3", answer: "Yes: BDT 12,500", quote: "which is BDT 12,500 per month for the entry grade", docId: "wage-policy" }],
    [{ buyer: "Nordlys", questions: [{ id: "q3", text: "Do you pay the minimum wage?" }] }]
  );
  assert.deepEqual(plan.buyers, ["Nordlys"]);
  assert.ok(plan.answers[0].wrong);
  assert.ok(plan.fixes.some((f) => f.startsWith("Send a corrected answer to Nordlys")));
});
