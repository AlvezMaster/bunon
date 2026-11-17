/**
 * Answer memory for one factory: which of its unanswered questions can reuse an answer it already approved for
 * another buyer (matching rules in ../answer-reuse.ts). Server-only.
 *
 * Only the factory's own approved answers are used, and only while the quoted sentence is still in its documents.
 * Meaning vectors for question texts are cached in the key/value store, so a page load rarely calls the model.
 */
import { kvRead, kvUpdate } from "./kv.ts";
import { embed, embeddingModel } from "./embeddings.ts";
import { dequantize, quantize } from "../rag.ts";
import { sha256Hex } from "../crypto.ts";
import { bestReuse, topicLabel, type PastQuestion, type ReuseMatch } from "../answer-reuse.ts";
import { quoteIsInDocument } from "../questionnaire.ts";
import type { FactoryDocument } from "../fixtures/factory-documents.ts";
import type { ApprovedAnswer } from "./catalog-repo.ts";

export interface ReuseSuggestion {
  fromQuestionId: string;
  fromQuestion: string;
  fromBuyer: string;
  answer: string;
  quote: string;
  docId: string | null;
  docTitle: string | null;
  approvedAt: string;
  how: ReuseMatch["how"];
  /** Shared topic, e.g. "Building safety" ("" when the question is word for word the same). */
  topic: string;
}

interface QuestionnaireView {
  id: string;
  buyer: string;
  factoryOrgId: string | null;
  linkState: "open" | "paused" | "closed";
  questions: Array<{ id: string; text: string }>;
}

const CACHE = "answer-memory:vectors";
const CACHE_MAX = 3000;
const empty = () => ({}) as Record<string, string>;

/** Meaning vectors for the texts (cached); an empty map when no embedding model is available. */
async function vectorsFor(texts: string[]): Promise<Map<string, Int8Array>> {
  const out = new Map<string, Int8Array>();
  const model = await embeddingModel();
  if (!model || !texts.length) return out;
  const keys = await Promise.all(texts.map(async (t) => `${model}|${await sha256Hex(t)}`));
  const cache = { ...(await kvRead<Record<string, string>>(CACHE, empty)) };
  const missing = texts.filter((_, i) => !cache[keys[i]]);
  if (missing.length) {
    const made = await embed("documents", missing);
    if (made) {
      const fresh: Record<string, string> = {};
      missing.forEach((t) => (fresh[keys[texts.indexOf(t)]] = quantize(made.vectors[missing.indexOf(t)])));
      await kvUpdate<Record<string, string>>(CACHE, empty, (all) => {
        Object.assign(all, fresh);
        const names = Object.keys(all);
        for (const k of names.slice(0, Math.max(0, names.length - CACHE_MAX))) delete all[k];
      });
      Object.assign(cache, fresh);
    }
  }
  texts.forEach((t, i) => {
    if (cache[keys[i]]) out.set(t, dequantize(cache[keys[i]]));
  });
  return out;
}

/** question id → an earlier approved answer of this factory that answers it. */
export async function reuseSuggestions(input: {
  factoryOrgId: string;
  questionnaires: QuestionnaireView[];
  answers: Record<string, ApprovedAnswer>;
  docs: FactoryDocument[];
}): Promise<Record<string, ReuseSuggestion>> {
  const mine = input.questionnaires.filter((q) => q.factoryOrgId === input.factoryOrgId);
  const pastById = new Map<string, { q: QuestionnaireView; text: string; a: ApprovedAnswer }>();
  for (const q of mine) {
    for (const x of q.questions) {
      const a = input.answers[x.id];
      // The evidence must still be on file: a reused answer may not quote a deleted or changed document.
      if (a && (!a.docId || !a.quote || quoteIsInDocument(a.quote, a.docId, input.docs))) pastById.set(x.id, { q, text: x.text, a });
    }
  }
  const targets = mine.filter((q) => q.linkState === "open").flatMap((q) => q.questions.filter((x) => !input.answers[x.id]).map((x) => ({ q, x })));
  if (!pastById.size || !targets.length) return {};

  const vectors = await vectorsFor([...new Set([...[...pastById.values()].map((p) => p.text), ...targets.map((t) => t.x.text)])]).catch((error) => {
    console.warn("[bunon/answer-memory] matching on words only:", (error as Error).message);
    return new Map<string, Int8Array>();
  });
  const past: PastQuestion[] = [...pastById.entries()].map(([id, p]) => ({
    questionId: id,
    questionnaireId: p.q.id,
    text: p.text,
    approvedAt: p.a.approvedAt,
    vector: vectors.get(p.text) ?? null,
  }));

  const out: Record<string, ReuseSuggestion> = {};
  for (const { q, x } of targets) {
    const m = bestReuse({ questionId: x.id, questionnaireId: q.id, text: x.text, vector: vectors.get(x.text) ?? null }, past);
    const from = m && pastById.get(m.questionId);
    if (!m || !from) continue;
    out[x.id] = {
      fromQuestionId: m.questionId,
      fromQuestion: from.text,
      fromBuyer: from.q.buyer,
      answer: from.a.answer,
      quote: from.a.quote,
      docId: from.a.docId,
      docTitle: from.a.docTitle ?? input.docs.find((d) => d.id === from.a.docId)?.title ?? null,
      approvedAt: from.a.approvedAt,
      how: m.how,
      topic: topicLabel(m.topic),
    };
  }
  return out;
}
