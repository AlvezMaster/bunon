/**
 * SSLCommerz, Bangladesh's payment gateway: cards, bKash, Nagad, Rocket and internet banking in one checkout.
 * Server-only. API v4: create a session, send the customer to its GatewayPageURL, then confirm every payment
 * with the Order Validation API (never trust what the browser or a notification says on its own).
 *
 * Env (set in .env.local / Vercel; never committed):
 *   SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD   from developer.sslcommerz.com (sandbox) or your live store
 *   SSLCOMMERZ_LIVE=true                             only for a live store; otherwise the sandbox is used
 */

function config() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();
  if (!storeId || !storePassword) return null;
  const live = process.env.SSLCOMMERZ_LIVE?.trim().toLowerCase() === "true";
  return { storeId, storePassword, live, host: live ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com" };
}

export const gatewayStatus = () => {
  const c = config();
  return c ? { ready: true, mode: c.live ? ("live" as const) : ("sandbox" as const) } : { ready: false, mode: null };
};

export interface SessionInput {
  tranId: string;
  amountBdt: number;
  productName: string;
  orgId: string;
  customer: { name: string; email: string; phone: string; address: string; city: string };
  urls: { success: string; fail: string; cancel: string; ipn: string };
}

/** Starts a checkout; returns the SSLCommerz page to send the customer to. */
export async function createSession(input: SessionInput): Promise<string> {
  const c = config();
  if (!c) throw new Error("The payment gateway is not set up yet.");
  const form = new URLSearchParams({
    store_id: c.storeId,
    store_passwd: c.storePassword,
    total_amount: input.amountBdt.toFixed(2),
    currency: "BDT",
    tran_id: input.tranId,
    success_url: input.urls.success,
    fail_url: input.urls.fail,
    cancel_url: input.urls.cancel,
    ipn_url: input.urls.ipn,
    cus_name: input.customer.name.slice(0, 50),
    cus_email: input.customer.email.slice(0, 50),
    cus_phone: input.customer.phone.slice(0, 20) || "01700000000",
    cus_add1: input.customer.address.slice(0, 50) || "Bangladesh",
    cus_city: input.customer.city.slice(0, 50) || "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    num_of_item: "1",
    product_name: input.productName.slice(0, 255),
    product_category: "Software subscription",
    product_profile: "non-physical-goods",
    value_a: input.orgId,
  });
  const res = await fetch(`${c.host}/gwprocess/v4/api.php`, { method: "POST", body: form, signal: AbortSignal.timeout(20_000), cache: "no-store" });
  const json = (await res.json().catch(() => null)) as { status?: string; GatewayPageURL?: string; failedreason?: string } | null;
  if (!res.ok || json?.status !== "SUCCESS" || !json.GatewayPageURL) throw new Error(json?.failedreason || `The payment gateway refused the request (HTTP ${res.status}).`);
  return json.GatewayPageURL;
}

export interface Validation {
  valid: boolean;
  tranId: string;
  amount: number;
  currency: string;
  method: string | null;
  bankTranId: string | null;
  valId: string;
}

/** Asks SSLCommerz whether this payment really went through (Order Validation API). */
export async function validatePayment(valId: string): Promise<Validation> {
  const c = config();
  if (!c) throw new Error("The payment gateway is not set up yet.");
  const url = new URL(`${c.host}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({ val_id: valId, store_id: c.storeId, store_passwd: c.storePassword, v: "1", format: "json" }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
  const j = (await res.json().catch(() => ({}))) as Record<string, string | undefined>;
  return {
    valid: res.ok && (j.status === "VALID" || j.status === "VALIDATED"),
    tranId: j.tran_id ?? "",
    amount: Number(j.amount ?? NaN),
    currency: j.currency_type ?? j.currency ?? "",
    method: j.card_type ?? null,
    bankTranId: j.bank_tran_id ?? null,
    valId,
  };
}
