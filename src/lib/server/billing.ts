/**
 * Subscriptions, payments and Enterprise quote requests (server-only). Rules live in ../plans.ts.
 *
 * Payments go through SSLCommerz (sslcommerz.ts). A payment is only marked paid after SSLCommerz's own validation
 * API confirms it, and only if the transaction id, amount and currency match what Bunon asked for; doing it twice
 * changes nothing. Plan changes and payments are recorded in the factory's ledger (amounts, never card details).
 */
import { randomBytes } from "node:crypto";
import { KvAbort, kvRead, kvUpdate } from "./kv.ts";
import { appendLedgerBlock } from "./ledger-repo.ts";
import { recordBlockParties } from "./ledger-parties.ts";
import { extendPaidUntil, newSubscription, PLANS, priceFor, formatBdt, type PlanId, type Subscription } from "../plans.ts";

const SUBS = "billing:subscriptions";
const PAYMENTS = "billing:payments";
const QUOTES = "billing:quotes";

export interface Payment {
  /** Our transaction id, sent to SSLCommerz as tran_id. */
  tranId: string;
  orgId: string;
  plan: PlanId;
  months: number;
  amountBdt: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  createdAt: string;
  paidAt: string | null;
  /** From SSLCommerz after validation: how it was paid (e.g. "BKASH-BKash", "VISA-Dutch Bangla") and its references. */
  method: string | null;
  bankTranId: string | null;
  valId: string | null;
}

export interface QuoteRequest {
  id: string;
  orgId: string | null;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  factories: number;
  workers: number;
  needs: string;
  createdAt: string;
}

const subsNone = () => ({}) as Record<string, Subscription>;
const payNone = () => ({}) as Record<string, Payment>;

async function log(orgId: string, actor: string, type: string, summary: string) {
  const { block } = await appendLedgerBlock({ type, actor, summary, styleCode: null, payloadHash: null, status: "verified" });
  await recordBlockParties(block.block, [orgId]);
}

/** This factory's subscription. Accounts made before billing existed (the demo ones) keep full use. */
export async function getSubscription(orgId: string): Promise<Subscription> {
  const all = await kvRead<Record<string, Subscription>>(SUBS, subsNone);
  return all[orgId] ?? { orgId, plan: "pro", trialEndsAt: null, paidUntil: null, cancelAtPeriodEnd: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(), legacy: true };
}

/** At sign-up: Starter starts its free month; Pro waits for payment; Enterprise waits for a quote. */
export async function startSubscription(orgId: string, plan: PlanId, actor: string): Promise<Subscription> {
  const sub = newSubscription(orgId, plan);
  await kvUpdate<Record<string, Subscription>>(SUBS, subsNone, (all) => {
    all[orgId] = sub;
  });
  await log(orgId, actor, "PLAN STARTED", plan === "starter" ? "Starter plan started with a free month." : `${PLANS[plan].name} plan chosen.`);
  return sub;
}

/** Switch between plans. Paid or trial time carries over; the new price applies from the next payment. */
export async function changePlan(orgId: string, plan: PlanId, actor: string): Promise<Subscription> {
  const before = await getSubscription(orgId);
  if (before.plan === plan && !before.legacy) return before;
  let next!: Subscription;
  await kvUpdate<Record<string, Subscription>>(SUBS, subsNone, (all) => {
    const cur = all[orgId] ?? before;
    next = { ...cur, plan, legacy: undefined, quoteAgreed: plan === "enterprise" ? cur.quoteAgreed : undefined, updatedAt: new Date().toISOString() };
    // Leaving Starter ends its free month: the paid plan starts from the next payment (7 days' grace).
    if (cur.plan === "starter" && plan !== "starter" && next.trialEndsAt && Date.parse(next.trialEndsAt) > Date.now()) next.trialEndsAt = new Date().toISOString();
    all[orgId] = next;
  });
  await log(orgId, actor, "PLAN CHANGED", `Plan changed from ${PLANS[before.plan].name} to ${PLANS[plan].name}.`);
  return next;
}

export async function setCancelAtPeriodEnd(orgId: string, cancel: boolean, actor: string): Promise<Subscription> {
  let next!: Subscription;
  await kvUpdate<Record<string, Subscription>>(SUBS, subsNone, (all) => {
    const cur = all[orgId];
    if (!cur) throw new KvAbort("Choose a plan first.");
    next = all[orgId] = { ...cur, cancelAtPeriodEnd: cancel, updatedAt: new Date().toISOString() };
  });
  await log(orgId, actor, cancel ? "PLAN CANCELLED" : "PLAN RESUMED", cancel ? "The plan will stop at the end of its paid time." : "The plan will continue.");
  return next;
}

/** A pending payment for `months` of `plan`; its tran_id goes to SSLCommerz. */
export async function createPayment(orgId: string, plan: PlanId, months: number): Promise<Payment> {
  const amount = priceFor(plan, months);
  if (amount === null) throw new KvAbort("Enterprise is priced per factory. Ask for a quote.");
  const p: Payment = {
    tranId: `BNN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    orgId,
    plan,
    months,
    amountBdt: amount,
    status: "pending",
    createdAt: new Date().toISOString(),
    paidAt: null,
    method: null,
    bankTranId: null,
    valId: null,
  };
  await kvUpdate<Record<string, Payment>>(PAYMENTS, payNone, (all) => {
    all[p.tranId] = p;
  });
  return p;
}

export async function getPayment(tranId: string): Promise<Payment | null> {
  return (await kvRead<Record<string, Payment>>(PAYMENTS, payNone))[tranId] ?? null;
}

export async function paymentsFor(orgId: string): Promise<Payment[]> {
  const all = await kvRead<Record<string, Payment>>(PAYMENTS, payNone);
  return Object.values(all)
    .filter((p) => p.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Is a validated SSLCommerz result for exactly this payment? (tran id, amount and currency must all match.) */
export function matchesPayment(p: Payment, v: { tranId: string; amount: number; currency: string }): boolean {
  return v.tranId === p.tranId && v.currency === "BDT" && Math.abs(v.amount - p.amountBdt) < 0.01;
}

/** Marks a payment paid (once) and extends the factory's paid time. Returns false if it was already settled. */
export async function settlePaid(tranId: string, ref: { method: string | null; bankTranId: string | null; valId: string }): Promise<boolean> {
  let payment: Payment | null = null;
  await kvUpdate<Record<string, Payment>>(PAYMENTS, payNone, (all) => {
    const p = all[tranId];
    if (!p || p.status === "paid") return;
    payment = all[tranId] = { ...p, status: "paid", paidAt: new Date().toISOString(), method: ref.method, bankTranId: ref.bankTranId, valId: ref.valId };
  });
  if (!payment) return false;
  const p = payment as Payment;
  await kvUpdate<Record<string, Subscription>>(SUBS, subsNone, (all) => {
    const cur = all[p.orgId] ?? newSubscription(p.orgId, p.plan);
    all[p.orgId] = { ...cur, plan: p.plan, legacy: undefined, paidUntil: extendPaidUntil(cur, p.months), cancelAtPeriodEnd: false, updatedAt: new Date().toISOString() };
  });
  await log(p.orgId, "SSLCommerz", "SUBSCRIPTION PAID", `${PLANS[p.plan].name} plan paid for ${p.months} month${p.months > 1 ? "s" : ""} (${formatBdt(p.amountBdt)}), reference ${p.tranId}.`);
  return true;
}

/** A failed or cancelled checkout; only a pending payment changes. */
export async function settleUnpaid(tranId: string, status: "failed" | "cancelled"): Promise<void> {
  await kvUpdate<Record<string, Payment>>(PAYMENTS, payNone, (all) => {
    if (all[tranId]?.status === "pending") all[tranId] = { ...all[tranId], status };
  });
}

export async function saveQuoteRequest(q: Omit<QuoteRequest, "id" | "createdAt">): Promise<QuoteRequest> {
  const full: QuoteRequest = { ...q, id: randomBytes(4).toString("hex"), createdAt: new Date().toISOString() };
  await kvUpdate<Record<string, QuoteRequest>>(QUOTES, () => ({}), (all) => {
    all[full.id] = full;
  });
  return full;
}
