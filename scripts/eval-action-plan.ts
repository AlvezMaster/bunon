/**
 * Stress test for the Compliance Action Plan on labelled synthetic rule changes (scripts/action-plan-cases.ts).
 * Keyword search only here (no network); the live site adds meaning search.
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/eval-action-plan.ts
 */
import { chunkText, hybridSearch } from "../src/lib/rag.ts";
import { buildPlan } from "../src/lib/action-plan.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";
import { ACTION_PLAN_CASES } from "./action-plan-cases.ts";

const passages = FACTORY_DOCUMENTS.flatMap((d) => chunkText(d.id, d.title, d.text));
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
let correct = 0;
let falseAlarms = 0;
let missed = 0;
let drafts = 0;
let draftsOk = 0;
for (const c of ACTION_PLAN_CASES) {
  const found = hybridSearch(c.before, passages, null, 6).map((p) => ({ docId: p.docId, title: passages.find((x) => x.id === p.id)?.title ?? p.docId, text: p.text }));
  const plan = buildPlan({ before: c.before, after: c.after, found, answers: [], questionnaires: [] });
  const got = plan.docs.map((d) => d.docId);
  const meets = plan.alreadyMeets.map((d) => d.docId);
  falseAlarms += got.filter((d) => !c.affected.includes(d)).length;
  missed += c.affected.filter((d) => !got.includes(d)).length;
  const ok = same(got, c.affected) && same(meets, c.meets);
  if (ok) correct++;
  if (c.draft) {
    drafts++;
    if (plan.docs.some((d) => d.draft?.includes(c.draft!))) draftsOk++;
  }
  console.log(`${ok ? "✓" : "✗"} ${c.name}\n    needs fixing: ${got.join(", ") || "none"} · already meets: ${meets.join(", ") || "none"}`);
}
console.log(`\nCorrect plans ${correct}/${ACTION_PLAN_CASES.length} · documents missed ${missed} · false alarms ${falseAlarms} · redrafts with the new value ${draftsOk}/${drafts}`);
