/**
 * Text embeddings for meaning search. Server-only.
 *   online (AI_PROVIDER=workers-ai): Qwen3-Embedding 0.6B on Cloudflare Workers AI (multilingual)
 *   locally: an Ollama embedding model (OLLAMA_EMBED_MODEL, default qwen3-embedding:0.6b) if installed
 * Returns null when neither is available; search then runs on keywords alone.
 */
import { getOllamaBaseUrl, getOllamaStatus } from "./ollama.ts";
import { workersAiModel } from "./workers-ai.ts";

const QUERY_INSTRUCTION = "Given a buyer's compliance question, retrieve passages from factory documents that answer it";

function cloud() {
  if (!workersAiModel()) return null;
  const account = (process.env.WORKERS_AI_ACCOUNT_ID ?? process.env.D1_ACCOUNT_ID)?.trim();
  const token = (process.env.WORKERS_AI_TOKEN ?? process.env.D1_API_TOKEN)?.trim();
  const model = process.env.WORKERS_AI_EMBED_MODEL?.trim() || "@cf/qwen/qwen3-embedding-0.6b";
  return account && token ? { account, token, model } : null;
}

/** The embedding model in use, or null (vectors are only compared when made by the same model). */
export async function embeddingModel(): Promise<string | null> {
  const c = cloud();
  if (c) return c.model;
  const wanted = process.env.OLLAMA_EMBED_MODEL?.trim() || "qwen3-embedding:0.6b";
  const status = await getOllamaStatus();
  return status.models.some((m) => m === wanted || m.startsWith(`${wanted}:`) || m.split(":")[0] === wanted.split(":")[0]) ? wanted : null;
}

async function cloudEmbed(kind: "documents" | "queries", texts: string[]): Promise<number[][]> {
  const c = cloud();
  if (!c) throw new Error("Workers AI is not configured.");
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 32) {
    const batch = texts.slice(i, i + 32);
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.account}/ai/run/${c.model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
      body: JSON.stringify(kind === "queries" ? { queries: batch, instruction: QUERY_INSTRUCTION } : { documents: batch }),
    });
    const json = (await res.json().catch(() => null)) as { success?: boolean; result?: { data?: number[][] }; errors?: Array<{ message?: string }> } | null;
    if (!res.ok || !json?.success || !json.result?.data) throw new Error(json?.errors?.[0]?.message ?? `Embedding failed (HTTP ${res.status})`);
    out.push(...json.result.data);
  }
  return out;
}

async function localEmbed(model: string, kind: "documents" | "queries", texts: string[]): Promise<number[][]> {
  const input = kind === "queries" ? texts.map((t) => `Instruct: ${QUERY_INSTRUCTION}\nQuery: ${t}`) : texts;
  const res = await fetch(`${getOllamaBaseUrl()}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({ model, input, keep_alive: "30m" }),
  });
  if (!res.ok) throw new Error(`Ollama /api/embed returned HTTP ${res.status}`);
  return ((await res.json()) as { embeddings: number[][] }).embeddings;
}

/** Embeds texts; null when no embedding model is available or the call fails. */
export async function embed(kind: "documents" | "queries", texts: string[]): Promise<{ model: string; vectors: number[][] } | null> {
  if (!texts.length) return null;
  const model = await embeddingModel();
  if (!model) return null;
  try {
    const vectors = cloud() ? await cloudEmbed(kind, texts) : await localEmbed(model, kind, texts);
    return vectors.length === texts.length ? { model, vectors } : null;
  } catch (error) {
    console.warn("[bunon/embeddings] falling back to keyword search:", (error as Error).message);
    return null;
  }
}
