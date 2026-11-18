import { NextResponse, type NextRequest } from "next/server";
import { isSecureRequest, requireSession } from "@/lib/server/auth";
import { isAgentSession, sessionCookieOptions, signSession, verifyPassword, type SessionPayload } from "@/lib/server/session";
import { findStoredUser, orgIndex, signOutEverywhere, updateStoredUser } from "@/lib/server/accounts-repo";
import { getSubscription } from "@/lib/server/billing";
import { KvAbort } from "@/lib/server/kv";
import { PLANS, statusOf } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in person's own account.
 *
 *   GET                                             name, email, company, and for factories the plan
 *   POST { action: "rename", fullName }
 *   POST { action: "passphrase", current, next }    also signs out every other device
 *   POST { action: "signout_everywhere" }           ends every session; this device gets a fresh one
 *
 * The shared demo accounts can be read but not changed, so everyone can always sign in to them.
 * An AI agent can never use this route.
 */
async function guard(req: NextRequest) {
  const g = await requireSession(req);
  if (!g.ok) return { error: g.response };
  if (isAgentSession(g.session)) return { error: NextResponse.json({ error: "An AI agent can't change an account." }, { status: 403 }) };
  const stored = await findStoredUser(g.session.email);
  return { session: g.session, stored: stored && stored.id === g.session.sub ? stored : null };
}

/** Puts a new session cookie on the response, for this device. */
function withSession(res: NextResponse, req: NextRequest, s: SessionPayload, name = s.name) {
  const token = signSession({ sub: s.sub, email: s.email, role: s.role, name, org: s.org, oid: s.oid });
  const { name: cookie, ...options } = sessionCookieOptions(isSecureRequest(req));
  res.cookies.set(cookie, token, options);
  return res;
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { session, stored } = g;
  const org = session.oid ? (await orgIndex()).byId.get(session.oid) : undefined;
  let plan: { id: string; name: string; status: string } | null = null;
  if (session.role === "factory" && session.oid) {
    const sub = await getSubscription(session.oid);
    plan = { id: sub.plan, name: PLANS[sub.plan].name, status: statusOf(sub) };
  }
  return NextResponse.json({
    fullName: stored?.full_name ?? session.name,
    email: session.email,
    role: session.role,
    company: org?.name ?? session.org,
    country: org?.country ?? null,
    owner: stored ? stored.org_role === "owner" : null,
    editable: stored !== null,
    plan,
    sessionEndsAt: new Date(session.exp * 1000).toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { session, stored } = g;
  const body = (await req.json().catch(() => null)) as { action?: string; fullName?: unknown; current?: unknown; next?: unknown } | null;
  const fail = (error: string, status = 400, field?: string) => NextResponse.json({ error, field }, { status });
  if (!stored) return fail("This is a shared demo account, so it can't be changed. Make your own account to try this.", 403);

  try {
    if (body?.action === "rename") {
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
      if (fullName.length < 2 || fullName.length > 80) return fail("Enter your name.", 400, "fullName");
      const user = await updateStoredUser(stored.id, { fullName });
      return withSession(NextResponse.json({ ok: true, fullName: user.full_name }), req, session, user.full_name);
    }
    if (body?.action === "passphrase") {
      const current = typeof body.current === "string" ? body.current : "";
      const next = typeof body.next === "string" ? body.next : "";
      if (!(await verifyPassword(current, stored.password_hash)).ok) return fail("Your current passphrase is not right.", 400, "current");
      if (next.length < 10) return fail("Use at least 10 characters.", 400, "next");
      if (next.length > 200) return fail("That passphrase is too long.", 400, "next");
      if (next === current) return fail("Choose a passphrase you have not used here.", 400, "next");
      await updateStoredUser(stored.id, { password: next });
      await signOutEverywhere(stored.id);
      return withSession(NextResponse.json({ ok: true }), req, session, stored.full_name);
    }
    if (body?.action === "signout_everywhere") {
      await signOutEverywhere(stored.id);
      return withSession(NextResponse.json({ ok: true }), req, session, stored.full_name);
    }
  } catch (error) {
    if (error instanceof KvAbort) return fail("We could not find your account. Sign in again.", 409);
    throw error;
  }
  return fail("Unknown action.");
}
