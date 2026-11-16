/**
 * Buyer questionnaire: questions, evidence retrieval, and the checks that keep AI drafts honest.
 * Pure functions only (safe in the browser, the server and tests).
 *
 * The model never decides on its own: every draft must quote a sentence that exists word for word in
 * the cited document, and a person approves every answer before it is sealed in the ledger.
 */
import { FACTORY_DOCUMENTS, type FactoryDocument } from "./fixtures/factory-documents.ts";

export type QuestionCategory = "document_fact" | "calculation" | "policy_exists" | "needs_person";
export type AnswerKind = "yes" | "no" | "value" | "unknown";
export type DraftStatus = "draft" | "needs_person" | "unverified";

export interface BuyerQuestion {
  id: string;
  text: string;
  /** Labels used only by the accuracy test (scripts/eval-questionnaire.ts). */
  expected: { category: QuestionCategory; answer?: AnswerKind; docId?: string };
}

/** A sample questionnaire from the fictional buyer, written for this demo in the style of common social-audit topics. */
export const BUYER_QUESTIONNAIRE = {
  buyer: "Nordlys Apparel AB (fictional EU brand)",
  title: "Supplier compliance questionnaire 2026",
  questions: [
    { id: "q01", text: "Does the factory hold a valid fire licence?", expected: { category: "document_fact", answer: "yes", docId: "fire-licence" } },
    { id: "q02", text: "When was the last fire evacuation drill held?", expected: { category: "document_fact", answer: "value", docId: "fire-licence" } },
    { id: "q03", text: "Are all workers paid at least the legal minimum wage?", expected: { category: "document_fact", answer: "yes", docId: "wage-policy" } },
    { id: "q04", text: "What is the maximum number of working hours per week, including overtime?", expected: { category: "document_fact", answer: "value", docId: "working-hours" } },
    { id: "q05", text: "Is overtime voluntary?", expected: { category: "document_fact", answer: "yes", docId: "working-hours" } },
    { id: "q06", text: "Does the factory employ anyone under the age of 18?", expected: { category: "document_fact", answer: "no", docId: "child-labour" } },
    { id: "q07", text: "Is there a procedure to verify workers' age at recruitment?", expected: { category: "policy_exists", answer: "yes", docId: "child-labour" } },
    { id: "q08", text: "Can workers raise grievances anonymously?", expected: { category: "policy_exists", answer: "yes", docId: "grievance" } },
    { id: "q09", text: "What percentage of the workforce is female?", expected: { category: "calculation" } },
    { id: "q10", text: "Has an independent building safety assessment been completed?", expected: { category: "document_fact", answer: "yes", docId: "building-safety" } },
    { id: "q11", text: "Are wages paid on time every month?", expected: { category: "document_fact", answer: "yes", docId: "wage-policy" } },
    { id: "q12", text: "Describe your plans to reduce water use over the next three years.", expected: { category: "needs_person" } },
    { id: "q13", text: "Has the factory had any labour disputes in the past 12 months?", expected: { category: "needs_person" } },
  ] satisfies BuyerQuestion[],
};

/** One questionnaire a buyer sent to one factory. */
export interface QuestionnaireRequest {
  id: string;
  buyer: string;
  factory: string;
  title: string;
  sentOn: string;
  dueOn: string;
  questions: BuyerQuestion[];
}

const NODIWEAR = "Nodiwear Apparel Ltd. (fictional factory)";

/** Every questionnaire in the demo. A factory sees the ones sent to it; a buyer sees the ones it sent. */
export const QUESTIONNAIRES: QuestionnaireRequest[] = [
  {
    id: "nordlys-2026",
    buyer: BUYER_QUESTIONNAIRE.buyer,
    factory: NODIWEAR,
    title: BUYER_QUESTIONNAIRE.title,
    sentOn: "2026-11-02",
    dueOn: "2026-11-30",
    questions: BUYER_QUESTIONNAIRE.questions,
  },
  {
    id: "vela-2026",
    buyer: "Vela Outfitters GmbH (fictional EU brand)",
    factory: NODIWEAR,
    title: "Worker safety check",
    sentOn: "2026-11-09",
    dueOn: "2026-12-15",
    questions: [
      { id: "v01", text: "How many workers does the factory employ?", expected: { category: "document_fact", answer: "value", docId: "headcount" } },
      { id: "v02", text: "Is there a written grievance procedure for workers?", expected: { category: "policy_exists", answer: "yes", docId: "grievance" } },
      { id: "v03", text: "Has an independent engineer assessed the building?", expected: { category: "document_fact", answer: "yes", docId: "building-safety" } },
      { id: "v04", text: "Is any of the yarn you use certified to GOTS?", expected: { category: "document_fact", answer: "yes", docId: "gots-yarn-2024" } },
    ],
  },
];

/** "Nordlys Apparel AB (fictional EU brand)" → "Nordlys Apparel AB" */
export function orgName(org: string): string {
  return org.replace(/\s*\(.*\)\s*$/, "").trim();
}

/** True when two organisation labels name the same company (the "(fictional …)" note is ignored). */
export function sameOrg(a: string | undefined, b: string): boolean {
  return !!a && orgName(a).toLowerCase() === orgName(b).toLowerCase();
}

export interface EvidencePassage {
  /** "<docId>#<paragraph index>" */
  id: string;
  docId: string;
  text: string;
  score: number;
}

const STOP = new Set(
  "a an and are as at be by can do does for from has have how in is it its of on or the there this to was were what when which who will with your you any all every each".split(" ")
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ঀ-৿ ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w));
}

export function splitParagraphs(doc: FactoryDocument): Array<{ id: string; text: string }> {
  return doc.text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text, i) => ({ id: `${doc.id}#${i}`, text }));
}

/** Small keyword retrieval: idf-weighted term overlap, plus a bonus for words in the document title. */
export function retrieveEvidence(question: string, docs: FactoryDocument[] = FACTORY_DOCUMENTS, k = 4): EvidencePassage[] {
  const passages = docs.flatMap((d) => splitParagraphs(d).map((p) => ({ ...p, docId: d.id, title: d.title })));
  const df = new Map<string, number>();
  for (const p of passages) for (const w of new Set(tokens(p.text))) df.set(w, (df.get(w) ?? 0) + 1);
  const q = new Set(tokens(question));
  const idf = (w: string) => Math.log(1 + passages.length / (1 + (df.get(w) ?? 0)));
  return passages
    .map((p) => {
      const words = new Set(tokens(p.text));
      const title = new Set(tokens(p.title));
      let score = 0;
      for (const w of q) {
        if (words.has(w)) score += idf(w);
        if (title.has(w)) score += 0.5 * idf(w);
      }
      return { id: p.id, docId: p.docId, text: p.text, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const norm = (s: string) => s.toLowerCase().replace(/[“”"']/g, "").replace(/\s+/g, " ").trim().replace(/[.;,]+$/, "");

/** True when the quote appears word for word (ignoring case, spacing and quote marks) in the document. */
export function quoteIsInDocument(quote: string, docId: string, docs: FactoryDocument[] = FACTORY_DOCUMENTS): boolean {
  const doc = docs.find((d) => d.id === docId);
  const q = norm(quote);
  return !!doc && q.length >= 12 && norm(doc.text).includes(q);
}

// ---------------------------------------------------------------------------------------------
// Decision model: a multinomial Naive Bayes classifier that sorts a question into one of the four
// categories. Trained on the labelled examples below (written for this demo, kept separate from the
// questionnaire above so the accuracy test is not measured on training data). It is instant,
// deterministic and explainable, and acts as a second opinion on the language model.
// ---------------------------------------------------------------------------------------------
const TRAINING: Array<[string, QuestionCategory]> = [
  ["Is the business registration certificate valid?", "document_fact"],
  ["When does the environmental clearance certificate expire?", "document_fact"],
  ["Are emergency exits kept unlocked during working hours?", "document_fact"],
  ["Do workers receive written employment contracts?", "document_fact"],
  ["Is drinking water available on every floor?", "document_fact"],
  ["What is the date of the most recent electrical inspection?", "document_fact"],
  ["Are workers paid for annual leave?", "document_fact"],
  ["Is maternity leave paid according to the law?", "document_fact"],
  ["Does the factory use any forced or bonded labour?", "document_fact"],
  ["Is the boiler certificate up to date?", "document_fact"],
  ["When was the last chemical safety training held?", "document_fact"],
  ["When does the trade licence expire?", "document_fact"],
  ["What is the maximum overtime allowed per day?", "document_fact"],
  ["What is the legal minimum wage paid to entry-grade workers?", "document_fact"],
  ["Does the factory provide a day off every week?", "document_fact"],
  ["Does the factory employ migrant workers?", "document_fact"],
  ["Has a fire safety audit been carried out?", "document_fact"],
  ["Has the structural assessment been completed?", "document_fact"],
  ["Are payslips given to every worker?", "document_fact"],
  ["Is overtime paid at a higher rate?", "document_fact"],
  ["Are fire drills held regularly?", "document_fact"],
  ["Are workers under 18 employed in hazardous work?", "document_fact"],
  ["Do workers have to pay recruitment fees?", "document_fact"],
  ["Is personal protective equipment provided free of charge?", "document_fact"],
  ["Can workers join a union or elected committee?", "policy_exists"],
  ["Can workers report problems without giving their name?", "policy_exists"],
  ["Is there a procedure for checking documents at hiring?", "policy_exists"],
  ["Is there a policy that protects whistleblowers?", "policy_exists"],
  ["Do you have rules for how disciplinary action is taken?", "policy_exists"],
  ["How many women work in the factory as a share of all workers?", "calculation"],
  ["What is the average number of overtime hours per month?", "calculation"],
  ["What is the staff turnover rate?", "calculation"],
  ["Describe any improvements you made after your last audit.", "needs_person"],
  ["Have you received any complaints from the local community?", "needs_person"],
  ["What are your goals for renewable energy?", "needs_person"],
  ["Is there a written health and safety policy?", "policy_exists"],
  ["Do you have a procedure for handling harassment complaints?", "policy_exists"],
  ["Is there a process for workers to report unsafe conditions?", "policy_exists"],
  ["Does the factory have an anti-discrimination policy?", "policy_exists"],
  ["Is there a written procedure for chemical storage?", "policy_exists"],
  ["Do you have a policy on freedom of association?", "policy_exists"],
  ["Is there a mechanism for workers to appeal disciplinary action?", "policy_exists"],
  ["Do you have a responsible recruitment policy for agency workers?", "policy_exists"],
  ["What share of workers are on permanent contracts?", "calculation"],
  ["What is the average monthly overtime per worker?", "calculation"],
  ["What percentage of supervisors are women?", "calculation"],
  ["What is the ratio of toilets to workers?", "calculation"],
  ["How many workers left the factory last year as a percentage of total staff?", "calculation"],
  ["What was the total energy use per garment produced?", "calculation"],
  ["Calculate the average wage of sewing operators.", "calculation"],
  ["What proportion of the workforce is under 25?", "calculation"],
  ["Describe how you plan to improve worker wellbeing next year.", "needs_person"],
  ["Explain your strategy for reducing carbon emissions.", "needs_person"],
  ["Have there been any strikes or protests at the factory recently?", "needs_person"],
  ["What challenges do you face in meeting buyer requirements?", "needs_person"],
  ["Has any government inspector issued a warning in the last year?", "needs_person"],
  ["Tell us about community projects the factory supports.", "needs_person"],
  ["Were there any workplace accidents in the past six months?", "needs_person"],
  ["What would you need from us to improve working conditions?", "needs_person"],
];

const CATEGORIES: QuestionCategory[] = ["document_fact", "calculation", "policy_exists", "needs_person"];

function trainNaiveBayes(examples: Array<[string, QuestionCategory]>) {
  const counts = new Map<QuestionCategory, Map<string, number>>();
  const totals = new Map<QuestionCategory, number>();
  const docs = new Map<QuestionCategory, number>();
  const vocab = new Set<string>();
  for (const c of CATEGORIES) {
    counts.set(c, new Map());
    totals.set(c, 0);
    docs.set(c, 0);
  }
  for (const [text, c] of examples) {
    docs.set(c, (docs.get(c) ?? 0) + 1);
    // The opening word ("describe", "what", "is", "do") carries a lot of signal, so it is kept as a feature.
    const feats = [...tokens(text), `^${text.trim().split(/\s+/)[0]?.toLowerCase() ?? ""}`];
    for (const w of feats) {
      vocab.add(w);
      counts.get(c)!.set(w, (counts.get(c)!.get(w) ?? 0) + 1);
      totals.set(c, (totals.get(c) ?? 0) + 1);
    }
  }
  return { counts, totals, docs, vocab, n: examples.length };
}

const MODEL = trainNaiveBayes(TRAINING);

export interface Decision {
  category: QuestionCategory;
  /** Posterior probability of the chosen category (0–1). */
  probability: number;
}

/** Naive Bayes decision: which kind of question is this? */
export function decideCategory(question: string): Decision {
  const feats = [...tokens(question), `^${question.trim().split(/\s+/)[0]?.toLowerCase() ?? ""}`];
  const V = MODEL.vocab.size;
  const logp = CATEGORIES.map((c) => {
    let lp = Math.log((MODEL.docs.get(c)! + 1) / (MODEL.n + CATEGORIES.length));
    for (const w of feats) lp += Math.log(((MODEL.counts.get(c)!.get(w) ?? 0) + 1) / (MODEL.totals.get(c)! + V));
    return lp;
  });
  const max = Math.max(...logp);
  const exp = logp.map((v) => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  const best = exp.indexOf(Math.max(...exp));
  return { category: CATEGORIES[best], probability: exp[best] / sum };
}

const answerable = (c: QuestionCategory) => c === "document_fact" || c === "policy_exists";
const NEGATION = /\b(not|never|no one|nobody|none|cannot|without)\b|n't\b/i;
const VALUE_QUESTION = /^\s*(when|what|which|how|who|where)\b/i;

export interface ModelDraft {
  category: QuestionCategory;
  answer: AnswerKind;
  value: string;
  quote: string;
  source_id: string;
  confidence: number;
}

export interface QuestionDraft {
  questionId: string;
  category: QuestionCategory;
  answer: AnswerKind;
  value: string;
  quote: string;
  docId: string | null;
  confidence: number;
  status: DraftStatus;
  /** Plain reason shown to the clerk when the draft needs a person. */
  reason: string;
  engine: string;
  durationMs: number;
  evidence: EvidencePassage[];
  /** The decision model's independent view of the question. */
  decision: Decision;
}

/** Applies the honesty rules to whatever the language model returned. */
export function finalizeDraft(
  questionId: string,
  questionText: string,
  raw: ModelDraft,
  evidence: EvidencePassage[],
  engine: string,
  durationMs: number,
  decision: Decision,
  docs: FactoryDocument[] = FACTORY_DOCUMENTS
): QuestionDraft {
  // Models sometimes wrap the id as it appears in the prompt ("[fire-licence#1]"); keep only the document id.
  const docId = (raw.source_id || "").replace(/[[\]\s"']/g, "").split("#")[0] || null;
  const base = {
    questionId,
    category: raw.category,
    answer: raw.answer,
    value: (raw.value || "").trim(),
    quote: (raw.quote || "").trim(),
    docId,
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
    engine,
    durationMs,
    evidence,
    decision,
  };
  // Two independent views disagree on whether documents can answer this: let a person decide.
  if (answerable(raw.category) !== answerable(decision.category) && decision.probability >= 0.6) {
    return {
      ...base,
      status: "needs_person",
      reason: "The AI model and the decision model disagree about whether documents can answer this, so a person should decide.",
    };
  }
  if (raw.category === "needs_person") {
    return { ...base, answer: "unknown", status: "needs_person", reason: "This question needs a person's judgement or information that is not on file." };
  }
  if (raw.category === "calculation") {
    return { ...base, answer: "unknown", status: "needs_person", reason: "This needs a calculation. Work it out from the figures in the evidence, then approve it." };
  }
  if (raw.answer === "unknown" || !base.quote || !docId) {
    return { ...base, answer: "unknown", status: "needs_person", reason: "No document on file answers this clearly." };
  }
  if (!quoteIsInDocument(base.quote, docId, docs)) {
    return { ...base, status: "unverified", reason: "The quoted sentence was not found in the cited document, so this draft cannot be trusted." };
  }
  // Shape rule: "When…?", "What…?", "How…?" ask for a value, so a bare Yes or No cannot be the answer.
  if ((raw.answer === "yes" || raw.answer === "no") && VALUE_QUESTION.test(questionText)) {
    return { ...base, status: "needs_person", reason: "The question asks for a value, but the draft only says Yes or No. Write the value from the quote." };
  }
  // Polarity rule: a "Yes" backed by a negative sentence ("does not employ anyone under 18") is a classic
  // small-model slip. The quote is real, so only this check catches it.
  if (raw.answer === "yes" && NEGATION.test(base.quote)) {
    return {
      ...base,
      status: "needs_person",
      reason: "The draft says Yes, but the quoted sentence is negative. Read the quote and write the answer yourself.",
    };
  }
  return { ...base, status: "draft", reason: "" };
}

/** Draft used when the local model is unavailable: sort by rules, attach the best evidence, leave the answer to a person. */
export function ruleDraft(question: BuyerQuestion | { id: string; text: string }, durationMs = 0): QuestionDraft {
  const evidence = retrieveEvidence(question.text);
  const decision = decideCategory(question.text);
  const category = decision.category;
  return {
    questionId: question.id,
    category,
    answer: "unknown",
    value: "",
    quote: "",
    docId: evidence[0]?.docId ?? null,
    confidence: 0,
    status: "needs_person",
    reason: evidence.length
      ? "The local AI model is not running. The most relevant document is attached; please answer and approve."
      : "The local AI model is not running and no document on file matches this question.",
    engine: "rules",
    durationMs,
    evidence,
    decision,
  };
}
