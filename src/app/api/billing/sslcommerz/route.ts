import { NextResponse, type NextRequest } from "next/server";
import { getPayment, matchesPayment, settlePaid, settleUnpaid } from "@/lib/server/billing";
import { validatePayment } from "@/lib/server/sslcommerz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where SSLCommerz sends the customer's browser after checkout (a form POST): ?r=success | fail | cancel.
 * A "success" only counts after the Order Validation API confirms it and the tran id, amount and currency match.
 */
export async function POST(req: NextRequest) {
  const r = req.nextUrl.searchParams.get("r");
  const form = await req.formData().catch(() => null);
  const tranId = String(form?.get("tran_id") ?? "");
  const back = (state: string) => NextResponse.redirect(new URL(`/factory/billing?payment=${state}${tranId ? `&ref=${encodeURIComponent(tranId)}` : ""}`, req.nextUrl.origin), 303);

  if (r === "success") {
    const valId = String(form?.get("val_id") ?? "");
    if (!valId) return back("failed");
    try {
      const v = await validatePayment(valId);
      const payment = v.valid ? await getPayment(v.tranId) : null;
      if (!payment || !matchesPayment(payment, v)) return back("failed");
      await settlePaid(payment.tranId, { method: v.method, bankTranId: v.bankTranId, valId });
      return back("paid");
    } catch (error) {
      console.error("[bunon/billing] validation failed:", (error as Error).message);
      return back("pending");
    }
  }
  if (tranId && (r === "fail" || r === "cancel")) await settleUnpaid(tranId, r === "fail" ? "failed" : "cancelled");
  return back(r === "cancel" ? "cancelled" : "failed");
}
