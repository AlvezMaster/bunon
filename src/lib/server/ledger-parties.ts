/**
 * Which companies a ledger block concerns. Kept beside the ledger (not inside the hashed block) so the
 * chain stays unchanged; the ledger API uses it to hide other companies' entries.
 */
import { kvRead, kvUpdate } from "./kv.ts";

const KEY = "ledger:parties";

export async function recordBlockParties(block: number, orgIds: Array<string | undefined>): Promise<void> {
  const ids = orgIds.filter((x): x is string => !!x);
  if (!ids.length) return;
  await kvUpdate<Record<string, string[]>>(KEY, () => ({}), (all) => {
    all[String(block)] = ids;
  });
}

export function getBlockParties(): Promise<Record<string, string[]>> {
  return kvRead<Record<string, string[]>>(KEY, () => ({}));
}
