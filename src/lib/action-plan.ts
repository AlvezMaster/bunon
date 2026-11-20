/**
 * Compliance Action Plan logic, pure (unit-tested in tests/action-plan.test.ts and measured by
 * scripts/eval-action-plan.ts).
 *
 *   regulatory diff   which values changed between the old and new wording (numbers, and number words such as
 *                     "seventh" → "fifth")
 *   impact            which of the factory's passages state an old value (they now need fixing), which already state
 *                     the new value (already compliant), and which sent answers rest on the affected documents
 *   draft             the affected passage with the old values swapped for the new ones, for a person to check
 *   fixes             the list of things to do
 */

import { tokens } from "./questionnaire.ts";

const CARD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const ORD = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const WORD = new RegExp(`\\b(${[...ORD, ...CARD].join("|")})\\b`, "gi");

/** Text with number words as digits and without thousands commas, for comparing values. */
export function norm(text: string): string {
  return text
    .replace(WORD, (w) => String(ORD.includes(w.toLowerCase()) ? ORD.indexOf(w.toLowerCase()) : CARD.indexOf(w.toLowerCase())))
    .replace(/(\d),(?=\d{3}\b)/g, "$1");
}

export const nums = (text: string): string[] => norm(text).match(/\d+(\.\d+)?/g) ?? [];
export const fmt = (n: string) => (/^\d{4,}$/.test(n) ? Number(n).toLocaleString("en-US") : n);
const wordRe = (n: string) => new RegExp(`\\b\\d{1,3}(,\\d{3})+\\b|\\b${n}\\b`, "g");

/** Does the text state this value (as digits, with or without commas, or as a number word)? */
export function has(text: string, n: string): boolean {
  return new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}([^\\d]|$)`).test(norm(text));
}

/** Swaps one value for another, keeping its form: 12,500 → 15,000, seventh → fifth, three → four. */
export function swap(text: string, from: string, to: string): string {
  const f = Number(from);
  const t = Number(to);
  let out = text.replace(wordRe(from), (m) => (m.replace(/,/g, "") === from ? fmt(to) : m));
  if (Number.isInteger(f) && Number.isInteger(t) && f < ORD.length && t < ORD.length) {
    out = out.replace(new RegExp(`\\b${ORD[f]}\\b`, "gi"), ORD[t]).replace(new RegExp(`\\b${CARD[f]}\\b`, "gi"), CARD[t]);
  }
  return out;
}

/** The content words right before and after a value wherever it appears (stemmed, stop words skipped). */
function around(text: string, n: string): Set<string> {
  const words = norm(text).toLowerCase().split(/[^a-z0-9.]+/).map((w) => w.replace(/\.$/, "")).filter(Boolean);
  const word = (w: string) => (/^\d/.test(w) ? null : (tokens(w)[0] ?? null));
  const out = new Set<string>();
  words.forEach((w, i) => {
    if (w !== n) return;
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      const t = word(words[j]);
      if (t) {
        out.add(t);
        break;
      }
    }
    for (let j = i + 1; j <= Math.min(words.length - 1, i + 3); j++) {
      const t = word(words[j]);
      if (t) {
        out.add(t);
        break;
      }
    }
  });
  return out;
}

export interface Change {
  from: string;
  to: string | null;
}

/** Values in the old wording that are not in the new one, paired in order with the new values. */
export function ruleDiff(before: string, after: string): Change[] {
  const a = nums(before);
  const b = nums(after);
  const gone = a.filter((n) => !b.includes(n));
  const added = b.filter((n) => !a.includes(n));
  return gone.map((from, i) => ({ from, to: added[i] ?? null }));
}

export interface PlanPassage {
  docId: string;
  title: string;
  text: string;
}

export interface Plan {
  changes: Change[];
  /** Documents that state an old value, with the redrafted passage. */
  docs: Array<{ docId: string; title: string; passage: string; draft: string | null }>;
  /** Documents that already state the new value. */
  alreadyMeets: Array<{ docId: string; title: string; passage: string }>;
  answers: Array<{ id: string; question: string; buyer: string; wrong: boolean }>;
  buyers: string[];
  fixes: string[];
}

export interface PlanInput {
  before: string;
  after: string;
  /** The search results for the rule's wording, best first (keyword + meaning search over this factory's documents). */
  found: PlanPassage[];
  answers: Array<{ questionId: string; answer: string; quote: string; docId: string | null }>;
  questionnaires: Array<{ buyer: string; questions: Array<{ id: string; text: string }> }>;
}

export function buildPlan({ before, after, found, answers, questionnaires }: PlanInput): Plan {
  const changes = ruleDiff(before, after);
  const olds = changes.map((c) => c.from);
  const news = changes.map((c) => c.to).filter((n): n is string => !!n);
  const unique = <T extends { docId: string }>(list: T[]) => [...new Map(list.map((p) => [p.docId, p])).values()];

  // A value counts only where it means the same thing as in the rule: the word next to it matches ("2 hours"
  // is not "2 January", "40 women" is not "40 seconds", "age of 18" matches "age of 18").
  const relevant = (sentence: string, n: string, rule: string) => {
    const want = around(rule, n);
    return [...around(sentence, n)].some((w) => want.has(w));
  };
  const parts = (text: string) => text.split(/((?<=[.!?।])\s+)/);
  const states = (text: string, n: string, rule: string) => parts(text).some((x) => relevant(x, n, rule));

  const hits = unique(found.filter((p) => olds.some((n) => states(p.text, n, before))));
  const docs = hits.map((p) => ({
    docId: p.docId,
    title: p.title,
    passage: p.text,
    draft: parts(p.text)
      .map((x) => changes.reduce((sentence, c) => (c.to && relevant(x, c.from, before) ? swap(sentence, c.from, c.to) : sentence), x))
      .join(""),
  }));
  const hitIds = new Set(docs.map((d) => d.docId));
  // Among the closest passages, those stating the new value already meet the rule.
  const alreadyMeets = unique(found.slice(0, 4).filter((p) => !hitIds.has(p.docId) && news.length > 0 && news.every((n) => states(p.text, n, after)))).map(({ docId, title, text }) => ({ docId, title, passage: text }));

  const question = new Map(questionnaires.flatMap((q) => q.questions.map((x) => [x.id, { text: x.text, buyer: q.buyer }] as const)));
  const affected = answers
    .filter((a) => a.docId && hitIds.has(a.docId) && question.has(a.questionId))
    .map((a) => ({ id: a.questionId, question: question.get(a.questionId)!.text, buyer: question.get(a.questionId)!.buyer, wrong: olds.some((n) => has(`${a.answer} ${a.quote}`, n)) }));
  const buyers = [...new Set(affected.map((a) => a.buyer))];

  const change = changes.map((c) => `${fmt(c.from)} → ${c.to ? fmt(c.to) : "?"}`).join(", ");
  const fixes = [
    ...docs.map((d) => `Update "${d.title}" (${change}) and upload the new version.`),
    ...affected.map((a) => (a.wrong ? `Send a corrected answer to ${a.buyer}: "${a.question}"` : `Check the answer sent to ${a.buyer}: "${a.question}"`)),
    ...(docs.length ? ["Check that practice matches the new rule: payroll, records and notices on the floor."] : []),
    ...(docs.length === 0 && alreadyMeets.length === 0 ? ["No document states this rule yet: add a policy that covers it."] : []),
  ];
  return { changes, docs, alreadyMeets, answers: affected, buyers, fixes };
}
