"use client";

import type { ChainVerification, LedgerBlock, LedgerStatus } from "./ledger.ts";

export interface LedgerEventDraft {
  type: string;
  summary: string;
  styleCode?: string | null;
  payloadHash?: string | null;
  status: LedgerStatus;
}

export type LedgerPostResult =
  | { ok: true; block: LedgerBlock; source: string }
  | { ok: false; status: number; error: string };

/** Appends one event. The server assigns block number, time, parent hash, hash and actor. */
export async function postLedgerEvent(event: LedgerEventDraft): Promise<LedgerPostResult> {
  try {
    const res = await fetch("/api/audit-ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const fallback = res.status === 401 ? "Sign in to record this event in the ledger." : `Ledger error (HTTP ${res.status}).`;
      return { ok: false, status: res.status, error: typeof json.error === "string" ? json.error : fallback };
    }
    return { ok: true, block: json.block as LedgerBlock, source: String(json.source) };
  } catch {
    return { ok: false, status: 0, error: "Network error: the ledger could not be reached." };
  }
}

export interface LedgerSnapshot {
  blocks: LedgerBlock[];
  source: "postgres" | "memory";
  verification: ChainVerification;
}

export async function fetchLedger(limit = 100): Promise<LedgerSnapshot> {
  const res = await fetch(`/api/audit-ledger?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Ledger unavailable (HTTP ${res.status})`);
  const json = await res.json();
  return { blocks: json.blocks, source: json.source, verification: json.verification };
}
