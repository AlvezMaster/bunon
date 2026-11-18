/**
 * Answers a factory's AI agent prepared through the MCP connector, waiting for a person to check and send them.
 * Nothing here reaches a buyer: only the factory sees these, and sending stays a human action in the web app.
 */
import { kvRead, kvUpdate } from "./kv.ts";

export interface PreparedAnswer {
  questionId: string;
  answer: string;
  quote: string;
  docId: string | null;
  docTitle: string | null;
  /** Who prepared it, e.g. "AI agent · Compliance bot". */
  preparedBy: string;
  preparedAt: string;
}

const KEY = "agent:prepared";
const none = () => ({}) as Record<string, PreparedAnswer>;

export const getPrepared = () => kvRead<Record<string, PreparedAnswer>>(KEY, none);

export async function savePrepared(p: PreparedAnswer): Promise<void> {
  await kvUpdate<Record<string, PreparedAnswer>>(KEY, none, (all) => {
    all[p.questionId] = p;
  });
}

export async function clearPrepared(questionIds: string[]): Promise<void> {
  if (!questionIds.length) return;
  await kvUpdate<Record<string, PreparedAnswer>>(KEY, none, (all) => {
    for (const id of questionIds) delete all[id];
  });
}
