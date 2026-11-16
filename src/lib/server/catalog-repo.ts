/**
 * Shared order state: certificate renewals, factory-created orders, sent answers and buyer-added questions.
 *
 * It lives on the server in the key/value store (kv.ts: PostgreSQL, Cloudflare D1 or memory), so a
 * factory's change reaches its buyers on any device. API routes filter it per company (access.ts).
 */
import type { RenewalMap, StyleData, TierId, TierRenewal } from "../styles.ts";
import { kvReadMany, kvUpdate } from "./kv.ts";

/** A questionnaire answer a factory person approved; also sealed in the ledger. */
export interface ApprovedAnswer {
  questionId: string;
  answer: string;
  quote: string;
  docId: string | null;
  approvedBy: string;
  approvedAt: string;
  ledgerBlock: number | null;
  aiDrafted: boolean;
}

/** A question a buyer added to a questionnaire after sending it. */
export interface AskedQuestion {
  id: string;
  text: string;
  /** Shared by the same question in every factory's copy. */
  ref?: string;
  askedBy: string;
  askedAt: string;
}

export interface CatalogState {
  renewals: RenewalMap;
  customStyles: Record<string, StyleData>;
  answers: Record<string, ApprovedAnswer>;
  /** questionnaire id → questions the buyer added */
  asked: Record<string, AskedQuestion[]>;
}

const KEYS = { renewals: "catalog:renewals", customStyles: "catalog:customStyles", answers: "catalog:answers", asked: "catalog:asked" } as const;
const obj = <T>() => () => ({}) as T;

export async function getCatalogState(): Promise<CatalogState> {
  const v = await kvReadMany(Object.values(KEYS));
  return {
    renewals: (v[KEYS.renewals] as RenewalMap) ?? {},
    customStyles: (v[KEYS.customStyles] as Record<string, StyleData>) ?? {},
    answers: (v[KEYS.answers] as Record<string, ApprovedAnswer>) ?? {},
    asked: (v[KEYS.asked] as Record<string, AskedQuestion[]>) ?? {},
  };
}

export async function saveRenewal(styleCode: string, tierId: TierId, renewal: TierRenewal): Promise<void> {
  await kvUpdate<RenewalMap>(KEYS.renewals, obj<RenewalMap>(), (all) => {
    all[styleCode] = { ...(all[styleCode] ?? {}), [tierId]: renewal };
  });
}

export async function resetStyle(styleCode: string): Promise<void> {
  await kvUpdate<RenewalMap>(KEYS.renewals, obj<RenewalMap>(), (all) => {
    delete all[styleCode];
  });
}

export async function saveCustomStyle(style: StyleData): Promise<void> {
  await kvUpdate<Record<string, StyleData>>(KEYS.customStyles, obj<Record<string, StyleData>>(), (all) => {
    all[style.code] = style;
  });
}

export async function saveAnswer(answer: ApprovedAnswer): Promise<void> {
  await kvUpdate<Record<string, ApprovedAnswer>>(KEYS.answers, obj<Record<string, ApprovedAnswer>>(), (all) => {
    all[answer.questionId] = answer;
  });
}

export async function saveAskedQuestion(questionnaireId: string, question: AskedQuestion): Promise<void> {
  await kvUpdate<Record<string, AskedQuestion[]>>(KEYS.asked, obj<Record<string, AskedQuestion[]>>(), (all) => {
    const list = all[questionnaireId] ?? [];
    // Retried updates on D1 must not add the same question twice.
    if (!list.some((q) => q.id === question.id)) all[questionnaireId] = [...list, question];
  });
}

/** Deletes shared answers and buyer-added questions (used when a link's export window ends). */
export async function deleteSharedAnswers(questionIds: string[], questionnaireIds: string[]): Promise<void> {
  await kvUpdate<Record<string, ApprovedAnswer>>(KEYS.answers, obj<Record<string, ApprovedAnswer>>(), (all) => {
    for (const id of questionIds) delete all[id];
  });
  await kvUpdate<Record<string, AskedQuestion[]>>(KEYS.asked, obj<Record<string, AskedQuestion[]>>(), (all) => {
    for (const id of questionnaireIds) delete all[id];
  });
}
