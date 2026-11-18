import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { acceptInvite, applyLinkStep, createInvite, getFactoryProfile, invitesForFactory, revokeInvite } from "@/lib/server/accounts-repo";
import { logLinkEvent, runLinkJobs } from "@/lib/server/lifecycle";
import { agreeUnlink, cancelUnlink, inviteState, partnerOf, requestUnlink, type Link } from "@/lib/links";
import { getSubscription } from "@/lib/server/billing";
import { PLANS } from "@/lib/plans";
import { findInvite, linksForOrg } from "@/lib/server/accounts-repo";
import { isLive } from "@/lib/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/links: this company's links (with the partner's name and profile) and, for factories, its invites. */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  await runLinkJobs();
  const scope = await scopeFor(guard.session);
  const links = await Promise.all(
    scope.links
      .filter((l) => l.status !== "purged")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(async (l) => {
        const partner = partnerOf(l, scope.orgId);
        return {
          id: l.id,
          status: l.status,
          createdAt: l.createdAt,
          via: l.via,
          partner: { id: partner, name: scope.orgNameOf(partner) },
          // Buyers see the factory's self-declared profile; factories don't need one for buyers.
          profile: scope.role === "buyer" ? await getFactoryProfile(partner) : null,
          unlink: l.unlink ? { byMe: l.unlink.requestedBy === scope.orgId, requestedAt: l.unlink.requestedAt, effectiveAt: l.unlink.effectiveAt } : null,
          unlinkedAt: l.unlinkedAt ?? null,
          exportUntil: l.exportUntil ?? null,
        };
      })
  );
  const invites =
    scope.role === "factory"
      ? (await invitesForFactory(scope.orgId))
          .map((i) => ({ id: i.id, note: i.note, createdAt: i.createdAt, expiresAt: i.expiresAt, state: inviteState(i), usedBy: i.usedByOrgId ? scope.orgNameOf(i.usedByOrgId) : null }))
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 20)
      : [];
  return NextResponse.json({ me: { orgId: scope.orgId, role: scope.role, name: scope.orgNameOf(scope.orgId) }, links, invites });
}

type Body =
  | { action: "invite"; note?: string }
  | { action: "revoke"; inviteId: string }
  | { action: "accept"; token: string }
  | { action: "unlink" | "cancel" | "agree"; linkId: string };

/** POST /api/links: invite, revoke, accept an invite, or unlink / cancel / agree. */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  // Links and invites are a person's decision, never an AI agent's.
  if (isAgentSession(guard.session)) return NextResponse.json({ error: "Only a person can do this in Bunon." }, { status: 403 });
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const scope = await scopeFor(guard.session);
  const me = scope.orgNameOf(scope.orgId);
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

  if (body.action === "invite") {
    if (scope.role !== "factory") return fail("Only factories send invites.", 403);
    if ((await invitesForFactory(scope.orgId)).filter((i) => inviteState(i) === "open").length >= 20) return fail("You have 20 open invites. Cancel some first.", 429);
    const buyerLimit = PLANS[(await getSubscription(scope.orgId)).plan].limits.buyers;
    if (buyerLimit !== null && scope.links.filter((l) => isLive(l)).length >= buyerLimit) return fail(`Your plan allows up to ${buyerLimit} linked buyers. Upgrade to Pro on the Billing page for more.`, 402);
    const { token, invite } = await createInvite(scope.orgId, guard.session.name, typeof body.note === "string" ? body.note : "");
    return NextResponse.json({ url: `${req.nextUrl.origin}/invite/${token}`, expiresAt: invite.expiresAt });
  }

  if (body.action === "revoke") {
    if (scope.role !== "factory") return fail("Only factories manage invites.", 403);
    return (await revokeInvite(scope.orgId, String(body.inviteId))) ? NextResponse.json({ ok: true }) : fail("That invite can't be cancelled.");
  }

  if (body.action === "accept") {
    if (scope.role !== "buyer") return fail("Only buyer accounts can accept an invite. Sign in as a buyer.", 403);
    const inv = await findInvite(String(body.token ?? ""));
    if (inv) {
      // The factory's plan decides how many buyers it can have.
      const limit = PLANS[(await getSubscription(inv.factoryOrgId)).plan].limits.buyers;
      const theirs = (await linksForOrg(inv.factoryOrgId)).filter((l) => isLive(l));
      if (limit !== null && theirs.length >= limit && !theirs.some((l) => l.buyerOrgId === scope.orgId)) {
        return fail("This factory's plan can't add more buyers right now. Ask the factory to upgrade.", 402);
      }
    }
    const result = await acceptInvite(String(body.token ?? ""), scope.orgId);
    if (!result.ok) return fail(result.error, 410);
    if (result.created) await logLinkEvent("LINK CREATED", result.link, me);
    return NextResponse.json({ ok: true, created: result.created, factory: scope.orgNameOf(result.link.factoryOrgId) });
  }

  if (body.action === "unlink" || body.action === "cancel" || body.action === "agree") {
    const link: Link | undefined = scope.links.find((l) => l.id === body.linkId);
    if (!link) return fail("Unknown link.", 404);
    const step = body.action === "unlink" ? requestUnlink : body.action === "cancel" ? cancelUnlink : agreeUnlink;
    const result = await applyLinkStep(link.id, (current) => step(current, scope.orgId));
    if (!result.ok) return fail(result.error, 409);
    await logLinkEvent(body.action === "unlink" ? "UNLINK REQUESTED" : body.action === "cancel" ? "UNLINK CANCELLED" : "UNLINKED", result.link, me);
    return NextResponse.json({ ok: true, status: result.link.status });
  }

  return fail("Unknown action.");
}
