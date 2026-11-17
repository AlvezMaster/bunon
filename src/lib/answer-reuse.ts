/**
 * Answer memory: finds an answer the factory already sent to one buyer that also answers another buyer's question,
 * so a factory answers each question once, not once per brand.
 *
 * The question graph: every question links to compliance topics (fire safety, wages, …). A new question may reuse an
 * earlier approved answer only when all of these hold:
 *   1. both questions link to the same topic (or are word-for-word the same question),
 *   2. both ask the same kind of question (yes/no, or a value such as a date or number),
 *   3. neither one is phrased as the negative of the other, and their numbers and time periods agree,
 *   4. the wording is close: by shared words, or by meaning (embeddings) with some shared words as well.
 * Nothing is sent automatically: a person reads every reused answer and presses Send. Pure functions, no I/O.
 */
import { cosine } from "./rag.ts";
import { BANGLA_VALUE_QUESTION } from "./bangla-glossary.ts";

export interface Topic {
  id: string;
  label: string;
  /** Word beginnings that put a question on this topic (English and Bangla). */
  roots: string[];
}

export const TOPICS: Topic[] = [
  { id: "fire", label: "Fire safety", roots: ["fire", "evacuat", "extinguish", "drill", "sprinkler", "alarm", "অগ্নি", "আগুন", "ফায়ার"] },
  { id: "building", label: "Building safety", roots: ["building", "structur", "engineer", "electric", "boiler", "ভবন", "কাঠামো"] },
  { id: "wages", label: "Wages", roots: ["wage", "salar", "pay", "paid", "bonus", "payslip", "মজুরি", "বেতন"] },
  { id: "hours", label: "Working hours", roots: ["hour", "overtime", "shift", "rest", "holiday", "leave", "কর্মঘণ্টা", "ঘণ্টা", "ওভারটাইম", "ছুটি"] },
  { id: "child", label: "Child labour", roots: ["child", "age", "underage", "minor", "juvenile", "young", "18", "শিশু", "বয়স", "১৮"] },
  { id: "grievance", label: "Grievances", roots: ["grievanc", "complain", "anonym", "whistle", "অভিযোগ"] },
  { id: "workforce", label: "Workforce", roots: ["headcount", "workforce", "female", "women", "gender", "employ", "নারী", "শ্রমিক"] },
  { id: "certificates", label: "Certificates", roots: ["certif", "gots", "oeko", "organic", "সনদ"] },
  { id: "association", label: "Freedom of association", roots: ["union", "associat", "collective", "committee", "ইউনিয়ন"] },
  { id: "conduct", label: "Harassment and discrimination", roots: ["harass", "discriminat", "abuse", "violence", "হয়রানি", "বৈষম্য"] },
  { id: "forced", label: "Forced labour", roots: ["forced", "bonded", "passport", "deposit", "voluntar", "জোরপূর্বক"] },
  { id: "health", label: "Health and safety", roots: ["ppe", "aid", "chemical", "injur", "accident", "medical", "স্বাস্থ্য"] },
  { id: "environment", label: "Environment", roots: ["water", "energy", "waste", "emission", "carbon", "effluent", "পানি", "বর্জ্য"] },
];

/** Minimum share of words in common (Dice) for a match on wording alone. */
export const WORDS_MIN = 0.6;
/** Minimum meaning similarity (cosine), plus WORDS_FLOOR shared words, for a match on meaning. */
export const MEANING_MIN = 0.86;
export const WORDS_FLOOR = 0.35;

const STOP = new Set(
  (
    "a an and are as at be by can could do does did for from has have had how in is it its of on or the there this that these those to " +
    "was were what when which who will would with your you our we any all every each factory factories facility company please provide describe currently"
  ).split(" ")
);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9ঀ-৿]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Words cut to five letters as a rough stem ("assessed", "assessment" → "asses"); Bangla words stay whole. */
export function stems(text: string): string[] {
  return [...new Set(words(text).map((w) => (/^[a-z]/.test(w) ? w.slice(0, 5) : w)))];
}

/** The topics a question links to in the question graph. */
export function topicsOf(text: string): string[] {
  const ws = words(text);
  return TOPICS.filter((t) => t.roots.some((r) => ws.some((w) => w.startsWith(r)))).map((t) => t.id);
}

export const topicLabel = (id: string) => TOPICS.find((t) => t.id === id)?.label ?? "";

export type QuestionForm = "yes_no" | "value";

/** Yes/no questions start with a helping verb ("Is…", "Does…"); Bangla ones use the particle "কি" without a question word. */
export function formOf(text: string): QuestionForm {
  if (/[ঀ-৿]/.test(text)) return BANGLA_VALUE_QUESTION.test(text) ? "value" : "yes_no";
  return /^\s*(is|are|does|do|did|has|have|had|can|could|was|were|will|would|should|must|may)\b/i.test(text) ? "yes_no" : "value";
}

const NEGATIVE = /\b(not|never|no|none|nobody|without|cannot)\b|n[’']t\b|না\b|নেই/i;

/** Share of (stemmed) words the two questions have in common, from 0 to 1 (Dice coefficient). */
export function wordOverlap(a: string, b: string): number {
  const A = stems(a);
  const B = new Set(stems(b));
  if (!A.length || !B.size) return 0;
  const shared = A.filter((w) => B.has(w)).length;
  return (2 * shared) / (A.length + B.size);
}

const same = (a: string, b: string) => words(a).join(" ") === words(b).join(" ");

/** Numbers and time periods in a question ("18", "every month"): two questions that differ in these ask different things. */
function qualifiers(text: string): string {
  return stems(text)
    .map((s) => s.replace(/^(dail|day).*/, "day").replace(/^week.*/, "week").replace(/^month.*/, "month").replace(/^(year|annu).*/, "year").replace(/^quart.*/, "quarter"))
    .filter((s) => /^(\d+|[০-৯]+|day|week|month|year|quarter)$/.test(s))
    .sort()
    .join(" ");
}

export interface PastQuestion {
  questionId: string;
  questionnaireId: string;
  text: string;
  approvedAt: string;
  vector?: Int8Array | null;
}

export interface NewQuestion {
  questionId: string;
  questionnaireId: string;
  text: string;
  vector?: Int8Array | null;
}

export interface ReuseMatch {
  /** The earlier question whose approved answer can be reused. */
  questionId: string;
  score: number;
  how: "same" | "words" | "meaning";
  /** The shared topic id ("" when the questions are word-for-word the same and on no listed topic). */
  topic: string;
}

/** Why `past` can or cannot answer `next`; null when it can't. */
export function matchQuestion(next: NewQuestion, past: PastQuestion): ReuseMatch | null {
  if (past.questionnaireId === next.questionnaireId || past.questionId === next.questionId) return null;
  const topics = topicsOf(past.text);
  const shared = topicsOf(next.text).filter((t) => topics.includes(t));
  if (same(next.text, past.text)) return { questionId: past.questionId, score: 1, how: "same", topic: shared[0] ?? topics[0] ?? "" };
  if (!shared.length) return null;
  if (formOf(next.text) !== formOf(past.text)) return null;
  if (NEGATIVE.test(next.text) !== NEGATIVE.test(past.text)) return null;
  if (qualifiers(next.text) !== qualifiers(past.text)) return null;
  const w = wordOverlap(next.text, past.text);
  if (w >= WORDS_MIN) return { questionId: past.questionId, score: w, how: "words", topic: shared[0] };
  const m = next.vector && past.vector ? cosine(next.vector, past.vector) : 0;
  if (m >= MEANING_MIN && w >= WORDS_FLOOR) return { questionId: past.questionId, score: m, how: "meaning", topic: shared[0] };
  return null;
}

/** The best earlier answer for a new question: highest score, then the most recently approved. */
export function bestReuse(next: NewQuestion, past: PastQuestion[]): ReuseMatch | null {
  let best: { m: ReuseMatch; at: string } | null = null;
  for (const p of past) {
    const m = matchQuestion(next, p);
    if (!m) continue;
    if (!best || m.score > best.m.score || (m.score === best.m.score && p.approvedAt > best.at)) best = { m, at: p.approvedAt };
  }
  return best?.m ?? null;
}
