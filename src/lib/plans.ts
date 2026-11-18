/**
 * Bunon's plans for factories (buyers use Bunon free). Prices are in Bangladeshi taka, per month.
 * Pure data and rules, shared by the pricing page, the billing page and the server.
 */

export type PlanId = "starter" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in BDT; null = priced per customer (Enterprise). */
  priceBdt: number | null;
  /** Free days at the start (Starter only). */
  trialDays: number;
  tagline: string;
  /** null = no plan limit (the platform's own limits still apply). */
  limits: { buyers: number | null; documents: number | null; agentTokens: number };
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceBdt: 3500,
    trialDays: 30,
    tagline: "For a factory getting started",
    limits: { buyers: 3, documents: 50, agentTokens: 0 },
    features: ["1 month free, no payment needed to start", "Up to 3 linked buyers", "Up to 50 documents", "AI drafts with their source, and answer reuse", "Bangla and English", "Tamper-evident activity log"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceBdt: 7500,
    trialDays: 0,
    tagline: "For factories with many buyers",
    limits: { buyers: null, documents: null, agentTokens: 5 },
    features: ["Everything in Starter", "Unlimited linked buyers", "Unlimited documents", "Connect your own AI agents (MCP)", "Priority support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceBdt: null,
    trialDays: 0,
    tagline: "For groups and large factories",
    limits: { buyers: null, documents: null, agentTokens: 5 },
    features: ["Everything in Pro", "Price based on your needs", "AI that runs on your own computers", "Onboarding and training for your team", "Agreed support terms"],
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
export const isPlanId = (v: unknown): v is PlanId => typeof v === "string" && v in PLANS;

/** Months a factory can pay for at once. */
export const PAY_MONTHS = [1, 3, 6, 12] as const;
/** Days a factory keeps full use after its trial or paid time ends, before sending answers pauses. */
export const GRACE_DAYS = 7;

export type SubscriptionStatus =
  /** Starter's free month. */
  | "trialing"
  /** Paid and in date. */
  | "active"
  /** Chose a paid plan, nothing paid yet. */
  | "awaiting_payment"
  /** Trial or paid time is over. */
  | "past_due"
  /** Enterprise: asked for a quote, not agreed yet. */
  | "quote_requested";

export interface Subscription {
  orgId: string;
  plan: PlanId;
  /** When the free trial ends (Starter), or null. */
  trialEndsAt: string | null;
  /** Paid up to this moment, or null. */
  paidUntil: string | null;
  /** The plan stays until its paid time ends, then stops (no renewal reminders). */
  cancelAtPeriodEnd: boolean;
  /** Enterprise only: a person at Bunon agreed the quote (set by Bunon, not by the factory). */
  quoteAgreed?: boolean;
  createdAt: string;
  updatedAt: string;
  /** Accounts from before billing existed (demo accounts): full use, no payment asked. */
  legacy?: boolean;
}

const DAY = 864e5;

/** Where a subscription stands right now. */
export function statusOf(s: Subscription, now = Date.now()): SubscriptionStatus {
  if (s.legacy) return "active";
  if (s.paidUntil && Date.parse(s.paidUntil) > now) return "active";
  if (s.trialEndsAt && Date.parse(s.trialEndsAt) > now) return "trialing";
  if (s.plan === "enterprise" && !s.quoteAgreed && !s.paidUntil) return "quote_requested";
  if (!s.paidUntil && !s.trialEndsAt) return "awaiting_payment";
  return "past_due";
}

/** The moment full use ends: trial or paid time plus the grace days (null = no end). */
export function serviceEndsAt(s: Subscription): number | null {
  if (s.legacy) return null;
  const base = Math.max(s.paidUntil ? Date.parse(s.paidUntil) : 0, s.trialEndsAt ? Date.parse(s.trialEndsAt) : 0, s.paidUntil || s.trialEndsAt ? 0 : Date.parse(s.createdAt));
  return base + GRACE_DAYS * DAY;
}

/** May this factory send answers to buyers now? Drafting and reading never stop. */
export function canSendAnswers(s: Subscription, now = Date.now()): { ok: boolean; reason?: string } {
  const end = serviceEndsAt(s);
  if (end === null || now < end) return { ok: true };
  const why =
    statusOf(s, now) === "quote_requested"
      ? "Your Enterprise quote is not agreed yet."
      : s.trialEndsAt && !s.paidUntil
        ? "Your free month has ended."
        : "Your plan is unpaid.";
  return { ok: false, reason: `${why} Pay on the Billing page to keep sending answers. Your data is safe and drafting still works.` };
}

/** The new paid-until moment after paying for `months`: added to whatever time is still left. */
export function extendPaidUntil(s: Subscription, months: number, now = Date.now()): string {
  const from = Math.max(now, s.paidUntil ? Date.parse(s.paidUntil) : 0, s.trialEndsAt ? Date.parse(s.trialEndsAt) : 0);
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/** A new subscription at sign-up. */
export function newSubscription(orgId: string, plan: PlanId, now = Date.now()): Subscription {
  const at = new Date(now).toISOString();
  return {
    orgId,
    plan,
    trialEndsAt: PLANS[plan].trialDays ? new Date(now + PLANS[plan].trialDays * DAY).toISOString() : null,
    paidUntil: null,
    cancelAtPeriodEnd: false,
    createdAt: at,
    updatedAt: at,
  };
}

/** Amount for paying `months` of a plan, in BDT; null if the plan has no list price. */
export function priceFor(plan: PlanId, months: number): number | null {
  const p = PLANS[plan].priceBdt;
  return p === null ? null : p * months;
}

export const formatBdt = (n: number) => `৳${n.toLocaleString("en-IN")}`;
