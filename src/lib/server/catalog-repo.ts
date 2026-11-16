/**
 * Shared order state: certificate renewals and factory-created orders.
 *
 * This used to live only in each browser's localStorage, so a factory's fix never reached a buyer
 * on another device. It now lives on the server (PostgreSQL when reachable, otherwise server memory,
 * the same rule as the ledger) and every signed-in user loads it from /api/catalog.
 */
import type { RenewalMap, StyleData, TierId, TierRenewal } from "../styles.ts";
import { getDataSourceKind, getPool, invalidateDataSource } from "./data-source.ts";

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

const empty = (): CatalogState => ({ renewals: {}, customStyles: {}, answers: {}, asked: {} });

// Memory store survives dev hot reloads by living on globalThis.
const g = globalThis as { __bunonCatalog?: CatalogState };
const memory = (): CatalogState => {
  g.__bunonCatalog ??= empty();
  g.__bunonCatalog.answers ??= {};
  g.__bunonCatalog.asked ??= {};
  return g.__bunonCatalog;
};

let tableReady = false;
async function pgEnsureTable(): Promise<void> {
  if (tableReady) return;
  await getPool().query(
    `CREATE TABLE IF NOT EXISTS bunon_catalog_state (
       key TEXT PRIMARY KEY,
       value JSONB NOT NULL,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  );
  tableReady = true;
}

async function pgRead(): Promise<CatalogState> {
  await pgEnsureTable();
  const { rows } = await getPool().query<{ key: string; value: unknown }>(
    "SELECT key, value FROM bunon_catalog_state WHERE key IN ('renewals', 'customStyles', 'answers', 'asked')"
  );
  const state = empty();
  for (const r of rows) {
    if (r.key === "renewals") state.renewals = r.value as RenewalMap;
    if (r.key === "customStyles") state.customStyles = r.value as Record<string, StyleData>;
    if (r.key === "answers") state.answers = r.value as Record<string, ApprovedAnswer>;
    if (r.key === "asked") state.asked = r.value as Record<string, AskedQuestion[]>;
  }
  return state;
}

async function pgWrite(key: keyof CatalogState, value: unknown): Promise<void> {
  await pgEnsureTable();
  await getPool().query(
    `INSERT INTO bunon_catalog_state (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}

/** Runs against Postgres when available; on a Postgres error falls back to memory for this call. */
async function withStore<T>(pg: () => Promise<T>, mem: () => T): Promise<T> {
  if ((await getDataSourceKind()) === "postgres") {
    try {
      return await pg();
    } catch (error) {
      console.warn("[bunon/catalog] Postgres unavailable, using memory:", (error as Error).message);
      invalidateDataSource();
    }
  }
  return mem();
}

export function getCatalogState(): Promise<CatalogState> {
  return withStore(pgRead, () => structuredClone(memory()));
}

export async function saveRenewal(styleCode: string, tierId: TierId, renewal: TierRenewal): Promise<void> {
  const apply = (s: CatalogState) => {
    s.renewals[styleCode] = { ...(s.renewals[styleCode] ?? {}), [tierId]: renewal };
    return s.renewals;
  };
  await withStore(async () => pgWrite("renewals", apply(await pgRead())), () => void apply(memory()));
}

export async function resetStyle(styleCode: string): Promise<void> {
  const apply = (s: CatalogState) => {
    delete s.renewals[styleCode];
    return s.renewals;
  };
  await withStore(async () => pgWrite("renewals", apply(await pgRead())), () => void apply(memory()));
}

export async function saveCustomStyle(style: StyleData): Promise<void> {
  const apply = (s: CatalogState) => {
    s.customStyles[style.code] = style;
    return s.customStyles;
  };
  await withStore(async () => pgWrite("customStyles", apply(await pgRead())), () => void apply(memory()));
}

export async function saveAnswer(answer: ApprovedAnswer): Promise<void> {
  const apply = (s: CatalogState) => {
    s.answers[answer.questionId] = answer;
    return s.answers;
  };
  await withStore(async () => pgWrite("answers", apply(await pgRead())), () => void apply(memory()));
}

export async function saveAskedQuestion(questionnaireId: string, question: AskedQuestion): Promise<void> {
  const apply = (s: CatalogState) => {
    s.asked[questionnaireId] = [...(s.asked[questionnaireId] ?? []), question];
    return s.asked;
  };
  await withStore(async () => pgWrite("asked", apply(await pgRead())), () => void apply(memory()));
}

/** Deletes shared answers and buyer-added questions (used when a link's export window ends). */
export async function deleteSharedAnswers(questionIds: string[], questionnaireIds: string[]): Promise<void> {
  const drop = (s: CatalogState) => {
    for (const id of questionIds) delete s.answers[id];
    for (const id of questionnaireIds) delete s.asked[id];
  };
  await withStore(
    async () => {
      const s = await pgRead();
      drop(s);
      await pgWrite("answers", s.answers);
      await pgWrite("asked", s.asked);
    },
    () => void drop(memory())
  );
}
