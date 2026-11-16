/**
 * A tiny key/value store for account data: PostgreSQL (`bunon_kv`, one JSONB value per key) when
 * reachable, otherwise server memory, the same rule as the ledger and the catalog.
 * Cloudflare D1 is used instead when BUNON_DATA_SOURCE=d1 (see d1.ts).
 * Updates lock the row (Postgres) or check a version number (D1), so two requests changing the same
 * key cannot overwrite each other. An update's `change` callback may run more than once on D1.
 */
import { getDataSourceKind, getPool, invalidateDataSource } from "./data-source.ts";
import { d1 } from "./d1.ts";

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

async function withStore<T>(pg: () => Promise<T>, memory: () => T, cloud?: () => Promise<T>): Promise<T> {
  const kind = await getDataSourceKind();
  // D1 errors are not hidden behind a memory fallback: data written to memory would be lost.
  if (kind === "d1" && cloud) return cloud();
  if (kind === "postgres") {
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
    () => structuredClone((mem().get(key) as T | undefined) ?? fallback()),
    async () => {
      const { rows } = await d1<{ value: string }>("SELECT value FROM bunon_kv WHERE key = ?", [key]);
      return rows[0] ? (JSON.parse(rows[0].value) as T) : fallback();
    }
  );
}

/** Reads several keys in one round trip (missing keys are left out). */
export function kvReadMany(keys: string[]): Promise<Record<string, unknown>> {
  return withStore(
    async () => {
      await ensureTable();
      const { rows } = await getPool().query<{ key: string; value: unknown }>("SELECT key, value FROM bunon_kv WHERE key = ANY($1)", [keys]);
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
    () => Object.fromEntries(keys.filter((k) => mem().has(k)).map((k) => [k, structuredClone(mem().get(k))])),
    async () => {
      const { rows } = await d1<{ key: string; value: string }>(`SELECT key, value FROM bunon_kv WHERE key IN (${keys.map(() => "?").join(",")})`, keys);
      return Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]));
    }
  );
}

/** D1 has no row locks: write only if the version is still the one we read, otherwise read again and retry. */
async function d1Update<T>(key: string, fallback: () => T, change: (value: T) => T | void): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const now = new Date().toISOString();
    const { rows } = await d1<{ value: string; version: number }>("SELECT value, version FROM bunon_kv WHERE key = ?", [key]);
    const current = rows[0] ? (JSON.parse(rows[0].value) as T) : fallback();
    const next = change(current) ?? current;
    const written = rows[0]
      ? await d1("UPDATE bunon_kv SET value = ?, version = version + 1, updated_at = ? WHERE key = ? AND version = ?", [JSON.stringify(next), now, key, rows[0].version])
      : await d1("INSERT INTO bunon_kv (key, value, version, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(key) DO NOTHING", [key, JSON.stringify(next), now]);
    if (written.changes === 1) return next;
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
  }
  throw new Error(`Too many simultaneous changes to "${key}". Try again.`);
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
    },
    () => d1Update(key, fallback, change)
  );
}
