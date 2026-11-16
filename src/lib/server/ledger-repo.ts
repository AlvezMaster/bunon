/**
 * Append-only ledger repository with three backends (PostgreSQL / Cloudflare D1 / in-memory) behind one interface.
 *
 * Invariants enforced here, not trusted from clients:
 *   - block numbers are assigned by the server (max + 1), never supplied
 *   - prevHash/hash/time are computed by the server
 *   - appends are serialised (table lock in Postgres, unique block numbers + retry in D1, promise chain in memory)
 *   - nothing is ever updated or deleted
 */
import { appendBlock, verifyChain, type ChainVerification, type LedgerBlock, type LedgerBlockInput } from "../ledger.ts";
import { SEED_LEDGER } from "../seed/ledger-seed.ts";
import { getDataSourceKind, getPool, invalidateDataSource, type DataSourceKind } from "./data-source.ts";
import { d1, D1Error } from "./d1.ts";

export interface LedgerListResult {
  blocks: LedgerBlock[]; // newest first
  source: DataSourceKind;
  verification: ChainVerification;
}

export interface LedgerAppendResult {
  block: LedgerBlock;
  source: DataSourceKind;
}

// ----------------------------------------------------------------------------- memory backend
const memoryChain: LedgerBlock[] = [...SEED_LEDGER].sort((a, b) => a.block - b.block);
let memoryWriteQueue: Promise<unknown> = Promise.resolve();

function memoryList(limit: number): LedgerBlock[] {
  return [...memoryChain].sort((a, b) => b.block - a.block).slice(0, limit);
}

function memoryAppend(input: LedgerBlockInput, time: string): Promise<LedgerBlock> {
  const run = memoryWriteQueue.then(async () => {
    const prev = memoryChain.length ? memoryChain[memoryChain.length - 1] : null;
    const block = await appendBlock(prev, input, time);
    memoryChain.push(block);
    return block;
  });
  memoryWriteQueue = run.catch(() => undefined);
  return run;
}

/** Test hook: restore the seeded chain. */
export function __resetMemoryLedger(): void {
  memoryChain.splice(0, memoryChain.length, ...[...SEED_LEDGER].sort((a, b) => a.block - b.block));
}

// ----------------------------------------------------------------------------- postgres backend
interface LedgerRow {
  block: number;
  id: string;
  time: Date | string;
  type: string;
  actor: string;
  summary: string;
  style_code: string | null;
  payload_hash: string | null;
  prev_hash: string;
  hash: string;
  status: "verified" | "flagged";
}

function rowToBlock(r: LedgerRow): LedgerBlock {
  return {
    block: Number(r.block),
    id: r.id,
    time: r.time instanceof Date ? r.time.toISOString() : new Date(r.time).toISOString(),
    type: r.type,
    actor: r.actor,
    summary: r.summary,
    styleCode: r.style_code,
    payloadHash: r.payload_hash,
    prevHash: r.prev_hash,
    hash: r.hash,
    status: r.status,
  };
}

async function pgList(limit: number): Promise<LedgerBlock[]> {
  const { rows } = await getPool().query<LedgerRow>(
    "SELECT block, id, time, type, actor, summary, style_code, payload_hash, prev_hash, hash, status FROM bunon_audit_ledger ORDER BY block DESC LIMIT $1",
    [limit]
  );
  return rows.map(rowToBlock);
}

async function pgAppend(input: LedgerBlockInput, time: string): Promise<LedgerBlock> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE bunon_audit_ledger IN EXCLUSIVE MODE");
    const { rows } = await client.query<LedgerRow>(
      "SELECT block, id, time, type, actor, summary, style_code, payload_hash, prev_hash, hash, status FROM bunon_audit_ledger ORDER BY block DESC LIMIT 1"
    );
    const prev = rows[0] ? rowToBlock(rows[0]) : null;
    const block = await appendBlock(prev, input, time);
    await client.query(
      `INSERT INTO bunon_audit_ledger (block, id, time, type, actor, summary, style_code, payload_hash, prev_hash, hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [block.block, block.id, block.time, block.type, block.actor, block.summary, block.styleCode ?? null, block.payloadHash ?? null, block.prevHash, block.hash, block.status]
    );
    await client.query("COMMIT");
    return block;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

// ----------------------------------------------------------------------------- Cloudflare D1 backend

const COLS = "block, id, time, type, actor, summary, style_code, payload_hash, prev_hash, hash, status";
const insertSql = (verb: string) => `${verb} INTO bunon_audit_ledger (${COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const insertParams = (b: LedgerBlock) => [b.block, b.id, b.time, b.type, b.actor, b.summary, b.styleCode ?? null, b.payloadHash ?? null, b.prevHash, b.hash, b.status];

let d1Seeded = false;
/** A new D1 database starts with the same demo blocks as the memory ledger. */
async function d1EnsureSeed(): Promise<void> {
  if (d1Seeded) return;
  const { rows } = await d1<{ n: number }>("SELECT COUNT(*) AS n FROM bunon_audit_ledger");
  if (Number(rows[0]?.n ?? 0) === 0) {
    for (const b of [...SEED_LEDGER].sort((x, y) => x.block - y.block)) await d1(insertSql("INSERT OR IGNORE"), insertParams(b));
  }
  d1Seeded = true;
}

async function d1List(limit: number): Promise<LedgerBlock[]> {
  await d1EnsureSeed();
  const { rows } = await d1<LedgerRow>(`SELECT ${COLS} FROM bunon_audit_ledger ORDER BY block DESC LIMIT ?`, [limit]);
  return rows.map(rowToBlock);
}

/** Reads the last block and adds the next one; if another writer took that number first, reads again. */
async function d1Append(input: LedgerBlockInput, time: string): Promise<LedgerBlock> {
  await d1EnsureSeed();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { rows } = await d1<LedgerRow>(`SELECT ${COLS} FROM bunon_audit_ledger ORDER BY block DESC LIMIT 1`);
    const block = await appendBlock(rows[0] ? rowToBlock(rows[0]) : null, input, time);
    try {
      await d1(insertSql("INSERT"), insertParams(block));
      return block;
    } catch (err) {
      if (!(err instanceof D1Error) || !/UNIQUE|constraint/i.test(err.message)) throw err;
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
    }
  }
  throw new Error("The ledger is busy. Try again.");
}

// ----------------------------------------------------------------------------- public API
export async function listLedger(limit = 100): Promise<LedgerListResult> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 500);
  let source = await getDataSourceKind();
  let blocks: LedgerBlock[];
  if (source === "d1") {
    blocks = await d1List(safeLimit);
  } else if (source === "postgres") {
    try {
      blocks = await pgList(safeLimit);
    } catch (err) {
      console.warn("[bunon/ledger] postgres read failed, falling back to memory:", err instanceof Error ? err.message : err);
      invalidateDataSource();
      source = "memory";
      blocks = memoryList(safeLimit);
    }
  } else {
    blocks = memoryList(safeLimit);
  }
  // Verify the chain over everything we have (ascending). For a partial window this still proves
  // internal consistency of the returned blocks; the genesis link is only checked when present.
  const verification = await verifyChain(blocks);
  return { blocks, source, verification };
}

export async function appendLedgerBlock(input: LedgerBlockInput, now = new Date()): Promise<LedgerAppendResult> {
  const time = now.toISOString();
  let source = await getDataSourceKind();
  if (source === "d1") return { block: await d1Append(input, time), source };
  if (source === "postgres") {
    try {
      return { block: await pgAppend(input, time), source };
    } catch (err) {
      console.warn("[bunon/ledger] postgres append failed, falling back to memory:", err instanceof Error ? err.message : err);
      invalidateDataSource();
      source = "memory";
    }
  }
  return { block: await memoryAppend(input, time), source };
}
