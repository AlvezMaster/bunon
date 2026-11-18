import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { KvAbort } from "@/lib/server/kv";
import { getFactoryProfile } from "@/lib/server/accounts-repo";
import { listDocuments } from "@/lib/server/documents-repo";
import { listAgentTokens } from "@/lib/server/agent-tokens";
import { changePlan, createPayment, getSubscription, paymentsFor, setCancelAtPeriodEnd } from "@/lib/server/billing";
import { createSession, gatewayStatus } from "@/lib/server/sslcommerz";
import { canSendAnswers, isPlanId, PAY_MONTHS, PLANS, serviceEndsAt, statusOf } from "@/lib/plans";
import { isLive } from "@/lib/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/billing   the factory's plan, status, usage against its limits, payments, and whether payments work
 * POST /api/billing   { action: "checkout", plan, months } → { url } of the SSLCommerz checkout
 *                     { action: "change_plan", plan } · { action: "cancel", cancel: boolean }
 * Factory people only: an AI agent never sees or changes billing.
 */
async function guard(req: NextRequest) {
  const g = await requireSession(req, ["factory"]);
  if (!g.ok) return { error: g.response };
  if (isAgentSession(g.session)) return { error: NextResponse.json({ error: "Only a person can manage billing." }, { status: 403 }) };
  return { session: g.session, scope: await scopeFor(g.session) };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.error) return g.error;
  const orgId = g.scope.orgId;
  const [sub, docs, tokens, payments] = await Promise.all([getSubscription(orgId), listDocuments(orgId), listAgentTokens(orgId), paymentsFor(orgId)]);
  const plan = PLANS[sub.plan];
  const end = serviceEndsAt(sub);
  return NextResponse.json({
    plans: PLANS,
    payMonths: PAY_MONTHS,
    subscription: { ...sub, status: statusOf(sub), canSend: canSendAnswers(sub), serviceEndsAt: end === null ? null : new Date(end).toISOString() },
    usage: {
      buyers: { used: g.scope.links.filter((l) => isLive(l)).length, limit: plan.limits.buyers },
      documents: { used: docs.filter((d) => !d.demo).length, limit: plan.limits.documents },
      agentTokens: { used: tokens.length, limit: plan.limits.agentTokens },
    },
    payments,
    gateway: gatewayStatus(),
  });
}

export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.error) return g.error;
  const body = (await req.json().catch(() => null)) as { action?: string; plan?: string; months?: number; cancel?: boolean } | null;
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
  const orgId = g.scope.orgId;
  const actor = g.session.name;
  try {
    if (body?.action === "change_plan") {
      if (!isPlanId(body.plan)) return fail("Choose Starter, Pro or Enterprise.");
      if (body.plan === "starter") {
        // Starter's limits must fit what the factory already uses.
        const [docs, tokens] = await Promise.all([listDocuments(orgId), listAgentTokens(orgId)]);
        const buyers = g.scope.links.filter((l) => isLive(l)).length;
        const lim = PLANS.starter.limits;
        if ((lim.buyers !== null && buyers > lim.buyers) || (lim.documents !== null && docs.length > lim.documents) || tokens.length > lim.agentTokens) {
          return fail(`Starter allows ${lim.buyers} buyers, ${lim.documents} documents and no AI agents. Remove some first, or stay on your plan.`, 409);
        }
      }
      return NextResponse.json({ subscription: await changePlan(orgId, body.plan, actor) });
    }
    if (body?.action === "cancel") {
      return NextResponse.json({ subscription: await setCancelAtPeriodEnd(orgId, body.cancel !== false, actor) });
    }
    if (body?.action === "checkout") {
      if (!gatewayStatus().ready) return fail("Online payment is not switched on yet. Please try again later.", 503);
      const plan = isPlanId(body.plan) ? body.plan : (await getSubscription(orgId)).plan;
      if (plan === "enterprise") return fail("Enterprise is priced per factory. Ask for a quote.");
      const months = Number(body.months);
      if (!(PAY_MONTHS as readonly number[]).includes(months)) return fail("Choose 1, 3, 6 or 12 months.");
      const payment = await createPayment(orgId, plan, months);
      const profile = await getFactoryProfile(orgId);
      const origin = req.nextUrl.origin;
      const ret = (r: string) => `${origin}/api/billing/sslcommerz?r=${r}`;
      const url = await createSession({
        tranId: payment.tranId,
        amountBdt: payment.amountBdt,
        productName: `Bunon ${PLANS[plan].name} plan, ${months} month${months > 1 ? "s" : ""}`,
        orgId,
        customer: { name: g.session.name, email: g.session.email, phone: "", address: profile?.address ?? "", city: profile?.district ?? "" },
        urls: { success: ret("success"), fail: ret("fail"), cancel: ret("cancel"), ipn: `${origin}/api/billing/ipn` },
      });
      return NextResponse.json({ url, tranId: payment.tranId });
    }
  } catch (error) {
    if (error instanceof KvAbort) return fail(error.message, 409);
    console.error("[bunon/billing]", error);
    return fail(error instanceof Error ? error.message : "Billing is unavailable right now.", 502);
  }
  return fail("Unknown action.");
}
