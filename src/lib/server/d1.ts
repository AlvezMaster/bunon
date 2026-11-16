/**
 * Cloudflare D1 over its HTTP API, for when Bunon runs outside Cloudflare (e.g. on Vercel).
 *
 * Env (all three required):
 *   D1_ACCOUNT_ID   Cloudflare account id
 *   D1_DATABASE_ID  the D1 database's id (from `wrangler d1 create`)
 *   D1_API_TOKEN    an API token limited to "Account → D1 → Edit"
 *
 * Schema: db/d1-schema.sql. Cloudflare rate-limits this API, so each request keeps its queries few.
 */

export class D1Error extends Error {}

function config() {
  const account = process.env.D1_ACCOUNT_ID?.trim();
  const database = process.env.D1_DATABASE_ID?.trim();
  const token = process.env.D1_API_TOKEN?.trim();
  return account && database && token ? { account, database, token } : null;
}

export const d1Configured = () => config() !== null;

export interface D1Result<T> {
  rows: T[];
  changes: number;
}

/** Runs one SQL statement with positional `?` parameters. Retries once on rate limiting. */
export async function d1<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<D1Result<T>> {
  const c = config();
  if (!c) throw new D1Error("D1 is not configured (D1_ACCOUNT_ID, D1_DATABASE_ID, D1_API_TOKEN).");
  const url = `https://api.cloudflare.com/client/v4/accounts/${c.account}/d1/database/${c.database}/query`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 429 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      errors?: Array<{ message: string }>;
      result?: Array<{ results?: T[]; success?: boolean; meta?: { changes?: number } }>;
    } | null;
    if (!res.ok || !json?.success || !json.result?.[0]) {
      throw new D1Error(json?.errors?.[0]?.message ?? `D1 request failed (HTTP ${res.status}).`);
    }
    const r = json.result[0];
    return { rows: r.results ?? [], changes: r.meta?.changes ?? 0 };
  }
}
