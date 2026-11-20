/**
 * API tokens that let an organisation's own AI agent use Bunon: a factory's agent through the factory MCP endpoint
 * (/api/mcp/factory), a buyer's agent through the read-only buyer MCP endpoint (/api/mcp/buyer).
 *
 * A token belongs to one organisation and is shown once when it is made; only its SHA-256 hash is stored, so a leaked
 * database does not leak working tokens. The factory can revoke a token at any time. Server-only.
 */
import { createHash, randomBytes } from "node:crypto";
import { KvAbort, kvRead, kvUpdate } from "./kv.ts";

export interface AgentToken {
  /** Short public id (shown in the app and in the ledger; not secret). */
  id: string;
  orgId: string;
  name: string;
  hash: string;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  /** Which MCP server the token is for. Missing on older tokens, which are all factory tokens. */
  role?: "factory" | "buyer";
}

/** The MCP server a token belongs to. */
export const tokenRole = (t: Pick<AgentToken, "role">): "factory" | "buyer" => t.role ?? "factory";

export const MAX_TOKENS_PER_FACTORY = 5;
const KEY = "agent:tokens";
const none = () => ({}) as Record<string, AgentToken>;
const hashOf = (token: string) => createHash("sha256").update(token).digest("hex");

/** Makes a token; the plain value is returned only here. */
export async function createAgentToken(orgId: string, name: string, createdBy: string, role: "factory" | "buyer" = "factory"): Promise<{ token: string; meta: Omit<AgentToken, "hash"> }> {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 60) || "AI agent";
  const token = `bnn_agent_${randomBytes(24).toString("base64url")}`;
  const meta: AgentToken = { id: randomBytes(4).toString("hex"), orgId, name: clean, hash: hashOf(token), createdAt: new Date().toISOString(), createdBy, lastUsedAt: null, ...(role === "buyer" ? { role } : {}) };
  await kvUpdate<Record<string, AgentToken>>(KEY, none, (all) => {
    if (Object.values(all).filter((t) => t.orgId === orgId).length >= MAX_TOKENS_PER_FACTORY) {
      throw new KvAbort(`You can have at most ${MAX_TOKENS_PER_FACTORY} agent tokens. Revoke one first.`);
    }
    all[meta.hash] = meta;
  });
  const { hash: _hash, ...shown } = meta;
  return { token, meta: shown };
}

/** This factory's tokens, newest first, without hashes. */
export async function listAgentTokens(orgId: string): Promise<Array<Omit<AgentToken, "hash">>> {
  const all = await kvRead<Record<string, AgentToken>>(KEY, none);
  return Object.values(all)
    .filter((t) => t.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ hash: _hash, ...t }) => t);
}

/** Revokes one of this factory's tokens; false if there is no such token for this factory. */
export async function revokeAgentToken(orgId: string, id: string): Promise<Omit<AgentToken, "hash"> | null> {
  let gone: AgentToken | null = null;
  await kvUpdate<Record<string, AgentToken>>(KEY, none, (all) => {
    const entry = Object.entries(all).find(([, t]) => t.id === id && t.orgId === orgId);
    if (entry) {
      gone = entry[1];
      delete all[entry[0]];
    }
  });
  if (!gone) return null;
  const { hash: _hash, ...t } = gone as AgentToken;
  return t;
}

/** The token record for a presented token, or null (wrong format, unknown or revoked). */
export async function resolveAgentToken(token: string | null | undefined): Promise<AgentToken | null> {
  if (!token || !/^bnn_agent_[A-Za-z0-9_-]{20,}$/.test(token)) return null;
  const all = await kvRead<Record<string, AgentToken>>(KEY, none);
  return all[hashOf(token)] ?? null;
}

/** Notes when a token was last used (at most once a minute, to keep writes low). */
export async function touchAgentToken(t: AgentToken): Promise<void> {
  if (t.lastUsedAt && Date.now() - Date.parse(t.lastUsedAt) < 60_000) return;
  await kvUpdate<Record<string, AgentToken>>(KEY, none, (all) => {
    if (all[t.hash]) all[t.hash].lastUsedAt = new Date().toISOString();
  });
}
