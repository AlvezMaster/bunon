/**
 * Data-source selection: PostgreSQL when reachable, otherwise an in-memory store seeded with the
 * same demo data. The choice is probed with a short timeout and cached briefly, so a laptop
 * without PostgreSQL (or a venue with a flaky LAN) still runs every flow — and the UI can show
 * honestly which backend is live via /api/health.
 *
 * Env:
 *   DATABASE_URL        postgresql://user:pass@host:5432/db  (default local bunon_db)
 *   BUNON_DATA_SOURCE   auto | postgres | memory              (default auto)
 */
import { Pool } from "pg";

export type DataSourceKind = "postgres" | "memory";

export interface DataSourceStatus {
  kind: DataSourceKind;
  configured: DataSourceKind | "auto";
  postgres: { reachable: boolean; latencyMs: number | null; error: string | null; host: string | null };
  checkedAt: string;
}

const PROBE_TTL_MS = 20_000;
let pool: Pool | null = null;
let lastProbe: { at: number; status: DataSourceStatus } | null = null;

function connectionString(): string {
  return process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bunon_db";
}

function hostFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return null;
  }
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString(),
      max: 8,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 1_500,
    });
    // A lost idle connection must never crash the server process.
    pool.on("error", (err) => console.warn("[bunon/db] idle client error:", err.message));
  }
  return pool;
}

function configuredKind(): DataSourceKind | "auto" {
  const v = (process.env.BUNON_DATA_SOURCE || "auto").toLowerCase();
  return v === "postgres" || v === "memory" ? v : "auto";
}

async function probePostgres(): Promise<DataSourceStatus["postgres"]> {
  const started = Date.now();
  const host = hostFromUrl(connectionString());
  try {
    const client = await getPool().connect();
    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }
    return { reachable: true, latencyMs: Date.now() - started, error: null, host };
  } catch (err) {
    const message = err instanceof AggregateError ? err.errors.map((e) => (e as Error).message).join("; ") : err instanceof Error ? err.message : String(err);
    return { reachable: false, latencyMs: null, error: message, host };
  }
}

export async function getDataSourceStatus(force = false): Promise<DataSourceStatus> {
  const now = Date.now();
  if (!force && lastProbe && now - lastProbe.at < PROBE_TTL_MS) return lastProbe.status;

  const configured = configuredKind();
  let postgres: DataSourceStatus["postgres"] = { reachable: false, latencyMs: null, error: "not probed (memory forced)", host: hostFromUrl(connectionString()) };
  if (configured !== "memory") postgres = await probePostgres();

  const kind: DataSourceKind = configured === "memory" ? "memory" : configured === "postgres" ? "postgres" : postgres.reachable ? "postgres" : "memory";
  const status: DataSourceStatus = { kind, configured, postgres, checkedAt: new Date(now).toISOString() };
  lastProbe = { at: now, status };
  return status;
}

export async function getDataSourceKind(): Promise<DataSourceKind> {
  return (await getDataSourceStatus()).kind;
}

/** Force the next call to re-probe (used after a Postgres error so we fall back quickly). */
export function invalidateDataSource(): void {
  lastProbe = null;
}
