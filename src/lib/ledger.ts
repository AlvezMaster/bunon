/**
 * Hash-chained, append-only audit ledger — pure functions shared by the server
 * (PostgreSQL / in-memory repositories) and the client (chain verification badge).
 *
 * Block hash = sha256( canonicalJson({ block, prevHash, time, type, actor, summary, styleCode, payloadHash, status }) )
 * Each block commits to the previous block's hash, so editing any historical row breaks
 * every later hash — the property the UI advertises as "immutable" / "parent-block hashing".
 */
import { canonicalJson, isCanonicalHash, normalizeHash, sha256Hex } from "./crypto.ts";

export const GENESIS_PREV_HASH = `0x${"0".repeat(64)}`;

export type LedgerStatus = "verified" | "flagged";

export interface LedgerBlockInput {
  /** Event type label, e.g. "DPP MINTING", "REGISTRY CHECK". Upper-case, ≤ 64 chars. */
  type: string;
  /** Who produced the event (user, agent, registry). ≤ 255 chars. */
  actor: string;
  /** Human-readable summary. ≤ 2000 chars. */
  summary: string;
  /** Style / order the event belongs to, when applicable. */
  styleCode?: string | null;
  /** Hash of the underlying evidence (document SHA-256, Merkle root …), when applicable. */
  payloadHash?: string | null;
  status: LedgerStatus;
}

export interface LedgerBlock extends LedgerBlockInput {
  block: number;
  /** Display id, e.g. BLK-1421 */
  id: string;
  /** ISO-8601 UTC timestamp assigned by the server. */
  time: string;
  prevHash: string;
  hash: string;
}

const MAX = { type: 64, actor: 255, summary: 2000, styleCode: 64 } as const;

export class LedgerValidationError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = "LedgerValidationError";
    this.field = field;
  }
}

/** Validates and normalises untrusted input for a new block. Throws LedgerValidationError. */
export function parseLedgerInput(raw: unknown): LedgerBlockInput {
  if (!raw || typeof raw !== "object") throw new LedgerValidationError("body", "Body must be a JSON object");
  const r = raw as Record<string, unknown>;

  const str = (field: keyof typeof MAX): string => {
    const v = r[field];
    if (typeof v !== "string" || !v.trim()) throw new LedgerValidationError(field, `${field} is required`);
    if (v.length > MAX[field]) throw new LedgerValidationError(field, `${field} exceeds ${MAX[field]} characters`);
    return v.trim();
  };

  const type = str("type").toUpperCase();
  const actor = str("actor");
  const summary = str("summary");

  let styleCode: string | null = null;
  if (r.styleCode !== undefined && r.styleCode !== null) {
    if (typeof r.styleCode !== "string") throw new LedgerValidationError("styleCode", "styleCode must be a string");
    styleCode = r.styleCode.trim().toUpperCase().slice(0, MAX.styleCode) || null;
  }

  let payloadHash: string | null = null;
  if (r.payloadHash !== undefined && r.payloadHash !== null && r.payloadHash !== "") {
    if (typeof r.payloadHash !== "string") throw new LedgerValidationError("payloadHash", "payloadHash must be a string");
    const normalized = normalizeHash(r.payloadHash);
    if (!isCanonicalHash(normalized)) {
      throw new LedgerValidationError("payloadHash", "payloadHash must be a 0x-prefixed SHA-256 hex string");
    }
    payloadHash = normalized;
  }

  const status = r.status;
  if (status !== "verified" && status !== "flagged") {
    throw new LedgerValidationError("status", 'status must be "verified" or "flagged"');
  }

  return { type, actor, summary, styleCode, payloadHash, status };
}

export async function computeBlockHash(block: Omit<LedgerBlock, "hash" | "id">): Promise<string> {
  return sha256Hex(
    canonicalJson({
      block: block.block,
      prevHash: normalizeHash(block.prevHash),
      time: block.time,
      type: block.type,
      actor: block.actor,
      summary: block.summary,
      styleCode: block.styleCode ?? null,
      payloadHash: block.payloadHash ?? null,
      status: block.status,
    })
  );
}

/** Builds the next block on top of `previous` (or genesis when null). */
export async function appendBlock(
  previous: Pick<LedgerBlock, "block" | "hash"> | null,
  input: LedgerBlockInput,
  time: string,
  firstBlockNumber = 1416
): Promise<LedgerBlock> {
  const block = previous ? previous.block + 1 : firstBlockNumber;
  const prevHash = previous ? normalizeHash(previous.hash) : GENESIS_PREV_HASH;
  const unsigned = { ...input, block, time, prevHash };
  const hash = await computeBlockHash(unsigned);
  return { ...unsigned, id: `BLK-${block}`, hash };
}

export interface ChainVerification {
  ok: boolean;
  checked: number;
  /** Block number where the chain first breaks, or null. */
  brokenAt: number | null;
  reason: string | null;
}

/** Verifies an ascending (oldest-first) list of blocks: hashes recompute and each prevHash links. */
export async function verifyChain(blocks: LedgerBlock[]): Promise<ChainVerification> {
  const ordered = [...blocks].sort((a, b) => a.block - b.block);
  let expectedPrev: string | null = null;
  for (const b of ordered) {
    if (expectedPrev !== null && normalizeHash(b.prevHash) !== expectedPrev) {
      return { ok: false, checked: ordered.length, brokenAt: b.block, reason: "prevHash does not match previous block" };
    }
    const recomputed = await computeBlockHash(b);
    if (recomputed !== normalizeHash(b.hash)) {
      return { ok: false, checked: ordered.length, brokenAt: b.block, reason: "stored hash does not match block contents" };
    }
    expectedPrev = recomputed;
  }
  return { ok: true, checked: ordered.length, brokenAt: null, reason: null };
}

/** `13:42 UTC` style label from an ISO timestamp, for compact table cells. */
export function formatBlockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}
