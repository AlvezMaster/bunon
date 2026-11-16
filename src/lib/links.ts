/**
 * Factory ↔ buyer links: the rules, kept pure so they can be tested and used on both sides.
 *
 * A link joins one factory organisation to one buyer organisation.
 *   active ──(either side asks to leave)──▶ unlink_pending ──(12 h pass, or the other side agrees)──▶ unlinked
 *   unlink_pending ──(the side that asked cancels)──▶ active
 *   unlinked ──(30-day export window ends)──▶ purged (shared data deleted)
 */

export type LinkStatus = "active" | "unlink_pending" | "unlinked" | "purged";

export const UNLINK_HOLD_MS = 12 * 60 * 60 * 1000;
export const EXPORT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface Link {
  id: string;
  factoryOrgId: string;
  buyerOrgId: string;
  createdAt: string;
  via: "seed" | "invite";
  status: LinkStatus;
  /** Set while an unlink is pending. */
  unlink?: { requestedBy: string; requestedAt: string; effectiveAt: string };
  unlinkedAt?: string;
  /** Last moment either side can still download the shared data. */
  exportUntil?: string;
  purgedAt?: string;
}

export type LinkResult = { ok: true; link: Link } | { ok: false; error: string };

const iso = (ms: number) => new Date(ms).toISOString();

/** Which side of the link an organisation is on, if any. */
export function sideOf(link: Link, orgId: string): "factory" | "buyer" | null {
  if (link.factoryOrgId === orgId) return "factory";
  if (link.buyerOrgId === orgId) return "buyer";
  return null;
}

export function partnerOf(link: Link, orgId: string): string {
  return link.factoryOrgId === orgId ? link.buyerOrgId : link.factoryOrgId;
}

function finishUnlink(link: Link, atMs: number): Link {
  const { unlink: _done, ...rest } = link;
  void _done;
  return { ...rest, status: "unlinked", unlinkedAt: iso(atMs), exportUntil: iso(atMs + EXPORT_WINDOW_MS) };
}

/** Applies the time-based steps (hold ends, export window ends). Does not delete anything by itself. */
export function settle(link: Link, now = Date.now()): Link {
  let l = link;
  if (l.status === "unlink_pending" && l.unlink && Date.parse(l.unlink.effectiveAt) <= now) {
    l = finishUnlink(l, Date.parse(l.unlink.effectiveAt));
  }
  if (l.status === "unlinked" && l.exportUntil && Date.parse(l.exportUntil) <= now) {
    l = { ...l, status: "purged", purgedAt: l.exportUntil };
  }
  return l;
}

/** Either side may start leaving on its own. Nothing changes for 12 hours, so it can be undone. */
export function requestUnlink(link: Link, orgId: string, now = Date.now()): LinkResult {
  const l = settle(link, now);
  if (!sideOf(l, orgId)) return { ok: false, error: "You are not part of this link." };
  if (l.status !== "active") return { ok: false, error: "This link is not active." };
  return {
    ok: true,
    link: { ...l, status: "unlink_pending", unlink: { requestedBy: orgId, requestedAt: iso(now), effectiveAt: iso(now + UNLINK_HOLD_MS) } },
  };
}

/** Only the side that asked to leave can take it back, and only during the 12-hour hold. */
export function cancelUnlink(link: Link, orgId: string, now = Date.now()): LinkResult {
  const l = settle(link, now);
  if (l.status !== "unlink_pending" || !l.unlink) return { ok: false, error: "There is no pending unlink to cancel." };
  if (l.unlink.requestedBy !== orgId) return { ok: false, error: "Only the side that asked to unlink can cancel it." };
  const { unlink: _gone, ...rest } = l;
  void _gone;
  return { ok: true, link: { ...rest, status: "active" } };
}

/** The other side agrees, so there is no reason to wait: the unlink happens now. */
export function agreeUnlink(link: Link, orgId: string, now = Date.now()): LinkResult {
  const l = settle(link, now);
  if (l.status !== "unlink_pending" || !l.unlink) return { ok: false, error: "There is no pending unlink to agree to." };
  if (!sideOf(l, orgId)) return { ok: false, error: "You are not part of this link." };
  if (l.unlink.requestedBy === orgId) return { ok: false, error: "The other side has to agree." };
  return { ok: true, link: finishUnlink(l, now) };
}

/** Linked for day-to-day work: new orders and answers allowed. */
export const isLive = (l: Link) => l.status === "active" || l.status === "unlink_pending";
/** Shared history can still be read and downloaded. */
export const isReadable = (l: Link) => isLive(l) || l.status === "unlinked";
/** New questionnaires and questions are paused while an unlink is pending. */
export const acceptsNewQuestions = (l: Link) => l.status === "active";

export type InviteState = "open" | "used" | "revoked" | "expired";

export interface Invite {
  id: string;
  factoryOrgId: string;
  tokenHash: string;
  note: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedByOrgId?: string;
  revokedAt?: string;
}

export function inviteState(inv: Invite, now = Date.now()): InviteState {
  if (inv.revokedAt) return "revoked";
  if (inv.usedAt) return "used";
  if (Date.parse(inv.expiresAt) <= now) return "expired";
  return "open";
}
