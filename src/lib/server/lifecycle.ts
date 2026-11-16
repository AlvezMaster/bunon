/**
 * Link events: writes them to the ledger, finishes 12-hour holds, and deletes shared data when a
 * 30-day export window ends. Safe to run often (every page load of the links API, and a daily cron).
 */
import { kvRead, kvUpdate } from "./kv.ts";
import { LINKS_KEY, orgIndex, seedLinks } from "./accounts-repo.ts";
import { appendLedgerBlock } from "./ledger-repo.ts";
import { recordBlockParties } from "./ledger-parties.ts";
import { deleteSharedAnswers, getCatalogState } from "./catalog-repo.ts";
import { isReadable, settle, type Link } from "../links.ts";
import { QUESTIONNAIRES } from "../questionnaire.ts";
import { canonicalJson, sha256Hex } from "../crypto.ts";

export type LinkEvent = "LINK CREATED" | "UNLINK REQUESTED" | "UNLINK CANCELLED" | "UNLINKED" | "SHARED DATA DELETED";

const SUMMARY: Record<LinkEvent, string> = {
  "LINK CREATED": "A factory and a buyer were linked through an invite.",
  "UNLINK REQUESTED": "One side asked to unlink. It takes effect in 12 hours unless cancelled.",
  "UNLINK CANCELLED": "The pending unlink was cancelled.",
  UNLINKED: "The factory and the buyer are no longer linked. Both can download the shared data for 30 days.",
  "SHARED DATA DELETED": "The 30-day export window ended and the shared answers were deleted. This entry keeps only the proof.",
};

/** Seals a link event in the ledger: company ids and a fingerprint only, no content. */
export async function logLinkEvent(type: LinkEvent, link: Link, actor: string): Promise<void> {
  const { block } = await appendLedgerBlock({
    type,
    actor,
    summary: `${SUMMARY[type]} (link ${link.id})`,
    styleCode: null,
    payloadHash: await sha256Hex(canonicalJson({ id: link.id, status: link.status, factory: link.factoryOrgId, buyer: link.buyerOrgId })),
    status: "verified",
  });
  await recordBlockParties(block.block, [link.factoryOrgId, link.buyerOrgId]);
}

/** Saves time-based changes and acts on them. Returns how many links changed. */
export async function runLinkJobs(now = Date.now()): Promise<number> {
  const changed: Array<{ before: Link; after: Link }> = [];
  await kvUpdate<Record<string, Link>>(LINKS_KEY, seedLinks, (all) => {
    changed.length = 0; // this callback can run again if another request wrote first
    for (const [id, link] of Object.entries(all)) {
      const after = settle(link, now);
      if (after.status !== link.status) {
        changed.push({ before: link, after });
        all[id] = after;
      }
    }
  });
  if (!changed.length) return 0;
  const idx = await orgIndex();
  const state = await getCatalogState();
  for (const { before, after } of changed) {
    if (before.status === "unlink_pending") await logLinkEvent("UNLINKED", after, "Bunon (12-hour hold ended)");
    const newer = Object.values(await kvRead<Record<string, Link>>(LINKS_KEY, seedLinks)).some(
      (l) => l.id !== after.id && l.factoryOrgId === after.factoryOrgId && l.buyerOrgId === after.buyerOrgId && isReadable(settle(l, now))
    );
    if (after.status === "purged" && !newer) {
      const pair = QUESTIONNAIRES.filter((q) => idx.idByName(q.factory) === after.factoryOrgId && idx.idByName(q.buyer) === after.buyerOrgId);
      const questionIds = pair.flatMap((q) => [...q.questions.map((x) => x.id), ...(state.asked[q.id] ?? []).map((x) => x.id)]);
      await deleteSharedAnswers(questionIds, pair.map((q) => q.id));
      await logLinkEvent("SHARED DATA DELETED", after, "Bunon (scheduled deletion)");
    }
  }
  return changed.length;
}
