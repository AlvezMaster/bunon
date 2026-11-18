import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { getPayment, settlePaid, settleUnpaid } from "@/lib/server/billing";
import { gatewayStatus } from "@/lib/server/sslcommerz";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bunon's test checkout, used only while SSLCommerz is not set up. It shows the steps of paying and takes
 * no money: a test payment is recorded as a test everywhere (payment history and activity log).
 *
 *   GET  ?tran=…                                     the order to show
 *   POST { tran, outcome: "paid" | "cancelled", method }
 */
async function guard(req: NextRequest, tran: string) {
  const g = await requireSession(req, ["factory"]);
  if (!g.ok) return { error: g.response };
  if (isAgentSession(g.session)) return { error: NextResponse.json({ error: "Only a person can pay." }, { status: 403 }) };
  if (gatewayStatus().mode !== "test") return { error: NextResponse.json({ error: "The test checkout is off." }, { status: 404 }) };
  const scope = await scopeFor(g.session);
  const payment = await getPayment(tran);
  if (!payment || !payment.test || payment.orgId !== scope.orgId) return { error: NextResponse.json({ error: "No such payment." }, { status: 404 }) };
  return { payment, company: scope.orgNameOf(scope.orgId) };
}

export async function GET(req: NextRequest) {
  const g = await guard(req, req.nextUrl.searchParams.get("tran") ?? "");
  if (g.error) return g.error;
  const p = g.payment;
  return NextResponse.json({ tranId: p.tranId, plan: PLANS[p.plan].name, months: p.months, amountBdt: p.amountBdt, status: p.status, company: g.company });
}

const METHODS = new Set(["bKash", "Nagad", "Rocket", "Card", "Internet banking"]);

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { tran?: string; outcome?: string; method?: string } | null;
  const g = await guard(req, String(body?.tran ?? ""));
  if (g.error) return g.error;
  if (body?.outcome === "cancelled") {
    await settleUnpaid(g.payment.tranId, "cancelled");
    return NextResponse.json({ next: `/factory/billing?payment=cancelled&ref=${encodeURIComponent(g.payment.tranId)}` });
  }
  if (body?.outcome !== "paid" || !METHODS.has(String(body.method))) return NextResponse.json({ error: "Choose how to pay." }, { status: 400 });
  await settlePaid(g.payment.tranId, { method: `TEST · ${body.method}`, bankTranId: null, valId: "TEST" });
  return NextResponse.json({ next: `/factory/billing?payment=paid_test&ref=${encodeURIComponent(g.payment.tranId)}` });
}
