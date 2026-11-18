import { NextResponse, type NextRequest } from "next/server";
import { getPayment, matchesPayment, settlePaid } from "@/lib/server/billing";
import { validatePayment } from "@/lib/server/sslcommerz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSLCommerz's server-to-server payment notification (IPN). It counts even if the customer closed the browser
 * before returning. Never trusted on its own: the payment is checked with the Order Validation API first.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const valId = String(form?.get("val_id") ?? "");
  const status = String(form?.get("status") ?? "");
  if (!valId || !/^VALID(ATED)?$/.test(status)) return new NextResponse("IGNORED", { status: 200 });
  try {
    const v = await validatePayment(valId);
    const payment = v.valid ? await getPayment(v.tranId) : null;
    if (!payment || !matchesPayment(payment, v)) return new NextResponse("MISMATCH", { status: 200 });
    await settlePaid(payment.tranId, { method: v.method, bankTranId: v.bankTranId, valId });
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[bunon/billing] IPN validation failed:", (error as Error).message);
    // A non-200 makes SSLCommerz try again later.
    return new NextResponse("RETRY", { status: 503 });
  }
}
