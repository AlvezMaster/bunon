/**
 * Vector database for meaning search: pgvector on Supabase.
 *
 * Each passage's embedding is kept in the table bunon_passages, and meaning search asks Postgres for the nearest
 * passages by cosine distance (`embedding <=> query`, function bunon_match_passages), within one factory's
 * documents and one embedding model. D1 stays the main store; this is the search index. Passages are copied in as
 * they are searched (once per server instance), so documents stored earlier are filled in on their own.
 *
 * Talks to Supabase over HTTPS (its REST API) with the project's secret key, server-side only. The table has row
 * level security on and no policies, so only this key can read or write it. Set up once with
 * scripts/supabase-vector.sql. Off unless SUPABASE_URL and SUPABASE_SECRET_KEY are set; any error or a slow answer
 * falls back to Bunon's in-app vector search, so search never breaks because of this.
 */
import { dequantize, type Passage } from "../rag.ts";

const synced = new Set<string>();

const conf = () => {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  return url && key ? { url, key } : null;
};
export const vectorStoreOn = () => conf() !== null;

async function rest(path: string, init: RequestInit & { prefer?: string } = {}): Promise<Response> {
  const c = conf()!;
  const res = await fetch(`${c.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: c.key, "Content-Type": "application/json", ...(init.prefer ? { Prefer: init.prefer } : {}) },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

const literal = (v: ArrayLike<number>) => `[${Array.from(v, (x) => Number(x.toFixed(5))).join(",")}]`;
const floats = (p: Passage) => Array.from(dequantize(p.vec as string), (x) => x / 127);

/** Copies passages with embeddings into the table (each once per server instance). */
async function sync(orgId: string, model: string, passages: Passage[]): Promise<void> {
  const todo = passages.filter((p) => p.vec && !synced.has(`${model}|${p.id}`));
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50);
    const rows = batch.map((p) => ({ id: p.id, model, org_id: orgId, doc_id: p.docId, title: p.title, text: p.text, embedding: literal(floats(p)), updated_at: new Date().toISOString() }));
    await rest("bunon_passages?on_conflict=id,model", { method: "POST", body: JSON.stringify(rows), prefer: "resolution=merge-duplicates,return=minimal" });
    for (const p of batch) synced.add(`${model}|${p.id}`);
  }
}

/**
 * Meaning search in the vector database: this factory's passages nearest to the query, best first.
 * Returns null when the store is off or fails (the caller then searches in the app).
 */
export async function vectorSearch(orgId: string, model: string, query: number[], passages: Passage[], k = 20): Promise<Array<{ id: string; score: number }> | null> {
  if (!vectorStoreOn()) return null;
  try {
    await sync(orgId, model, passages);
    const res = await rest("rpc/bunon_match_passages", { method: "POST", body: JSON.stringify({ query_embedding: literal(query), p_org: orgId, p_model: model, match_count: k }) });
    const rows = (await res.json()) as Array<{ id: string; score: number }>;
    // Only passages that still exist (a deleted document's rows are ignored).
    const live = new Set(passages.map((p) => p.id));
    return rows.filter((r) => live.has(r.id) && r.score >= 0.25).map((r) => ({ id: r.id, score: Number(r.score) }));
  } catch (error) {
    console.warn("[bunon/vector-store] falling back to in-app vector search:", (error as Error).message);
    return null;
  }
}

/** Removes a deleted document's passages from the vector database (best effort). */
export async function deleteVectors(docId: string): Promise<void> {
  if (!vectorStoreOn()) return;
  try {
    await rest(`bunon_passages?doc_id=eq.${encodeURIComponent(docId)}`, { method: "DELETE", prefer: "return=minimal" });
    for (const key of [...synced]) if (key.split("|")[1]?.startsWith(`${docId}#`)) synced.delete(key);
  } catch (error) {
    console.warn("[bunon/vector-store] could not delete vectors:", (error as Error).message);
  }
}
