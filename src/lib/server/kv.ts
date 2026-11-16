/**
 * A tiny key/value store for account data: PostgreSQL (`bunon_kv`, one JSONB value per key) when
 * reachable, otherwise server memory, the same rule as the ledger and the catalog.
 * Updates lock the row, so two requests changing the same key cannot overwrite each other.
 */
import { getDataSourceKind, getPool, invalidateDataSource } from "./data-source.ts";

/** Thrown from inside an update to stop it on purpose (e.g. a name is taken); never triggers the memory fallback. */
export class KvAbort extends Error {}

const g = globalThis as { __bunonKv?: Map<string, unknown> };
const mem = () => (g.__bunonKv ??= new Map());

let tableReady = false;
async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await getPool().query(
    "CREATE TABLE IF NOT EXISTS bunon_kv (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())"
  );
  tableReady = true;
}

async function withStore<T>(pg: () => Promise<T>, memory: () => T): Promise<T> {
  if ((await getDataSourceKind()) === "postgres") {
    try {
      return await pg();
    } catch (error) {
      if (error instanceof KvAbort) throw error;
      console.warn("[bunon/kv] Postgres unavailable, using memory:", (error as Error).message);
      invalidateDataSource();
    }
  }
  return memory();
}

export function kvRead<T>(key: string, fallback: () => T): Promise<T> {
  return withStore(
    async () => {
      await ensureTable();
      const { rows } = await getPool().query<{ value: T }>("SELECT value FROM bunon_kv WHERE key = $1", [key]);
      return rows[0] ? rows[0].value : fallback();
    },
    () => structuredClone((mem().get(key) as T | undefined) ?? fallback())
  );
}

/** Reads the value, lets `change` edit it (or return a new one), saves and returns it. */
export function kvUpdate<T>(key: string, fallback: () => T, change: (value: T) => T | void): Promise<T> {
  return withStore(
    async () => {
      await ensureTable();
      const client = await getPool().connect();
      try {
        await client.query("BEGIN");
        await client.query("INSERT INTO bunon_kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", [key, JSON.stringify(fallback())]);
        const { rows } = await client.query<{ value: T }>("SELECT value FROM bunon_kv WHERE key = $1 FOR UPDATE", [key]);
        const current = rows[0].value;
        const next = change(current) ?? current;
        await client.query("UPDATE bunon_kv SET value = $2, updated_at = now() WHERE key = $1", [key, JSON.stringify(next)]);
        await client.query("COMMIT");
        return next;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    () => {
      const current = (mem().get(key) as T | undefined) ?? fallback();
      const next = change(current) ?? current;
      mem().set(key, next);
      return structuredClone(next);
    }
  );
}
