import type { TierId } from "./styles.ts";

/** Plain names for ledger event types (the stored type stays unchanged). */
const EVENT_LABEL: Record<string, string> = {
  "BUYER QUERY": "Buyer request",
  "BUYER AUDIT VERIFICATION": "Buyer check",
  "CONFLICT DETECTED": "Problem found",
  "SUPPLIER CHASE": "Renewal requested",
  "REGISTRY CHECK": "Registry checked",
  "PROVENANCE ROOT SEALED": "Supplier chain recorded",
  "CERT INGESTION": "Certificate checked",
  "ORDER BOM INGESTION": "New order",
  "ANSWER APPROVED": "Answer approved",
};

export function eventLabel(type: string): string {
  return EVENT_LABEL[type] ?? type.charAt(0) + type.slice(1).toLowerCase();
}

/** Plain names for the five supplier tiers. */
export const TIER_LABEL: Record<TierId, string> = {
  "t4-cotton": "Cotton",
  "t3-yarn": "Yarn",
  "t2-dyeing": "Dyeing",
  "t1-trims": "Trims",
  "t0-factory": "Garment factory",
};
