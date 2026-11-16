/**
 * Role-based rules for who may append which ledger events (shared by the API and the UI).
 */
import type { UserRole } from "./server/session.ts";

export const BUYER_EVENT_TYPES = ["BUYER QUERY", "BUYER AUDIT VERIFICATION"] as const;

/** Buyers may only record buyer-side events; factory users may record everything else. */
export function canAppendEvent(role: UserRole, type: string): boolean {
  const isBuyerEvent = (BUYER_EVENT_TYPES as readonly string[]).includes(type.toUpperCase());
  return role === "buyer" ? isBuyerEvent : !isBuyerEvent;
}
