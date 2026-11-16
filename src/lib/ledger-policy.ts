/**
 * Which ledger events a browser may ask the server to record (shared by the API and the UI).
 * Everything else (certificate checks, answers, links, deletions) is written by the server itself.
 */
import type { UserRole } from "./server/session.ts";

export const BUYER_EVENT_TYPES = ["BUYER QUERY", "BUYER AUDIT VERIFICATION"] as const;
export const FACTORY_EVENT_TYPES = ["ORDER BOM INGESTION", "SUPPLIER CHASE"] as const;

export function canAppendEvent(role: UserRole, type: string): boolean {
  const list: readonly string[] = role === "buyer" ? BUYER_EVENT_TYPES : FACTORY_EVENT_TYPES;
  return list.includes(type.toUpperCase());
}
