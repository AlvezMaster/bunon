/**
 * All questionnaires: the demo ones (src/lib/questionnaire.ts) plus those buyers create in the app.
 * Each factory gets its own copy (a "request"); copies of one questionnaire share a groupId.
 */
import { kvRead, kvUpdate } from "./kv.ts";
import { QUESTIONNAIRES, type QuestionnaireRequest } from "../questionnaire.ts";

export interface StoredQuestionnaire extends QuestionnaireRequest {
  buyerOrgId: string;
  factoryOrgId: string;
  createdBy: string;
}

export type AnyQuestionnaire = QuestionnaireRequest & { buyerOrgId?: string; factoryOrgId?: string };

const KEY = "questionnaires:custom";
const none = () => ({}) as Record<string, StoredQuestionnaire>;

export async function allQuestionnaires(): Promise<AnyQuestionnaire[]> {
  return [...QUESTIONNAIRES, ...Object.values(await kvRead<Record<string, StoredQuestionnaire>>(KEY, none))];
}

export async function saveQuestionnaires(list: StoredQuestionnaire[]): Promise<void> {
  await kvUpdate<Record<string, StoredQuestionnaire>>(KEY, none, (all) => {
    for (const q of list) all[q.id] = q;
  });
}

export async function deleteQuestionnaires(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await kvUpdate<Record<string, StoredQuestionnaire>>(KEY, none, (all) => {
    for (const id of ids) delete all[id];
  });
}
