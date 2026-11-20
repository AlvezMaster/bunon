"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Info, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { DashboardHeader, StatusBadge, type Tone } from "@/components/dashboard/DashboardParts";
import { useDay } from "@/components/questions/shared";
import { formatBdt, type Plan, type PlanId, type Subscription, type SubscriptionStatus } from "@/lib/plans";
import { t } from "@/lib/i18n";

interface Payment {
  tranId: string;
  plan: PlanId;
  months: number;
  amountBdt: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  createdAt: string;
  paidAt: string | null;
  method: string | null;
}
interface Usage {
  used: number;
  limit: number | null;
}
interface BillingData {
  plans: Record<PlanId, Plan>;
  payMonths: number[];
  subscription: Subscription & { status: SubscriptionStatus; canSend: { ok: boolean; reason?: string }; serviceEndsAt: string | null };
  usage: { buyers: Usage; documents: Usage; agentTokens: Usage };
  payments: Payment[];
  gateway: { ready: boolean; mode: "sandbox" | "live" | "test" | null };
}

const STATUS: Record<SubscriptionStatus, { label: string; tone: Tone }> = {
  trialing: { label: "Free month", tone: "ok" },
  active: { label: "Active", tone: "ok" },
  awaiting_payment: { label: "Waiting for payment", tone: "review" },
  past_due: { label: "Payment due", tone: "bad" },
  quote_requested: { label: "Quote requested", tone: "review" },
};
const PAY_STATUS: Record<Payment["status"], { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "ok" },
  pending: { label: "Not finished", tone: "review" },
  failed: { label: "Failed", tone: "bad" },
  cancelled: { label: "Cancelled", tone: "review" },
};
const NOTICE: Record<string, { text: string; tone: "ok" | "bad" | "info" }> = {
  paid: { text: "Payment received. Thank you: your plan is active.", tone: "ok" },
  paid_test: { text: "Test payment done: your plan is active. No money was taken.", tone: "ok" },
  failed: { text: "The payment did not go through. Nothing was charged; you can try again.", tone: "bad" },
  cancelled: { text: "You cancelled the payment. Nothing was charged.", tone: "info" },
  pending: { text: "We could not confirm the payment yet. If money left your account, it will show here within a few minutes.", tone: "info" },
};

function Meter({ label, u }: { label: string; u: Usage }) {
  const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <p className="flex justify-between text-sm">
        <span className="font-medium text-ink">{t(label)}</span>
        <span className="text-ink-muted [font-variant-numeric:tabular-nums]">
          {u.used} / {u.limit === null ? t("no limit") : u.limit}
        </span>
      </p>
      <div className="h-2 rounded-full bg-surface-2" role="presentation">
        {u.limit !== null && u.limit > 0 && <div className={`h-2 rounded-full ${pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-brand"}`} style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}

/** Factory: its plan, what it uses, paying through SSLCommerz, changing plan, and its payments. */
export default function FactoryBillingPage() {
  const day = useDay();
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [payPlan, setPayPlan] = useState<PlanId>("starter");
  const [months, setMonths] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing");
    const json = (await res.json()) as BillingData & { error?: string };
    if (!res.ok) return setError(json.error ?? t("Could not load billing."));
    setData(json);
    setPayPlan((p) => (json.subscription.plan === "enterprise" ? p : json.subscription.plan));
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    setNotice(qs.get("payment"));
    setWelcome(qs.get("welcome") === "1");
    const wanted = qs.get("plan");
    void load().then(() => {
      if (wanted === "starter" || wanted === "pro") setPayPlan(wanted);
    });
  }, [load]);

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError("");
    try {
      const res = await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (json.url) {
        window.location.assign(json.url);
        return;
      }
      await load();
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const sub = data?.subscription;
  const plan = sub && data ? data.plans[sub.plan] : null;
  const status = sub ? STATUS[sub.status] : null;
  const price = data?.plans[payPlan].priceBdt ?? null;
  const n = NOTICE[notice ?? ""];

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Billing" title="Your plan" note={t("Pay in taka with bKash, Nagad, Rocket, cards or internet banking. Buyers never pay.")} />

        {n && (
          <p role="status" className={`rounded-lg border p-3 text-sm ${n.tone === "ok" ? "border-success/40 bg-success-soft text-success" : n.tone === "bad" ? "border-danger/30 bg-danger-soft text-danger" : "border-line bg-surface-2/70 text-ink-muted"}`}>
            {t(n.text)}
          </p>
        )}
        {welcome && sub && sub.plan !== "starter" && (
          <p role="status" className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-ink">
            {sub.plan === "enterprise" ? t("Welcome to Bunon. We will email you a quote; meanwhile you can set up your factory.") : t("Welcome to Bunon. Pay for your first month below to start Pro. You can use everything for 7 days meanwhile.")}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}

        {sub && plan && status && data && (
          <>
            <section className="glass-card flex flex-col gap-5 p-5 sm:p-6" aria-labelledby="plan-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 id="plan-title" className="font-display text-2xl font-semibold text-ink">
                    {t(plan.name)} {sub.legacy && <span className="font-sans text-sm font-medium text-ink-faint">· {t("demo account, no payment needed")}</span>}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    {plan.priceBdt === null ? t("Custom price") : `${formatBdt(plan.priceBdt)} / ${t("month")}`}
                    {sub.status === "trialing" && sub.trialEndsAt && ` · ${t("free until")} ${day(sub.trialEndsAt)}`}
                    {sub.status === "active" && sub.paidUntil && ` · ${t("paid until")} ${day(sub.paidUntil)}`}
                    {sub.cancelAtPeriodEnd && ` · ${t("stops then")}`}
                  </p>
                </div>
                <StatusBadge tone={status.tone}>{t(status.label)}</StatusBadge>
              </div>
              {!sub.canSend.ok ? (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {t(sub.canSend.reason ?? "")}
                </p>
              ) : (
                !sub.legacy &&
                sub.serviceEndsAt &&
                sub.status !== "active" &&
                sub.status !== "trialing" && (
                  <p className="text-sm text-ink-muted">
                    {t("Full use continues until")} {day(sub.serviceEndsAt)}. {t("After that, sending answers pauses until you pay.")}
                  </p>
                )
              )}
              <div className="grid gap-4 sm:grid-cols-3">
                <Meter label="Linked buyers" u={data.usage.buyers} />
                <Meter label="Documents" u={data.usage.documents} />
                <Meter label="AI agent tokens" u={data.usage.agentTokens} />
              </div>
            </section>

            <section className="glass-card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="pay-title">
              <h2 id="pay-title" className="font-display text-xl font-semibold text-ink">
                {t("Pay for your plan")}
              </h2>
              {sub.plan === "enterprise" ? (
                <p className="text-sm text-ink-muted">
                  {t("Enterprise is priced per factory: we send you a quote and an invoice.")}{" "}
                  <Link href="/pricing/enterprise" className="font-medium text-ink underline underline-offset-4">
                    {t("Ask for a quote")}
                  </Link>
                </p>
              ) : (
                <>
                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="mb-2 text-sm font-medium text-ink">{t("Plan")}</legend>
                    {(["starter", "pro"] as PlanId[]).map((id) => (
                      <label key={id} className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm ${payPlan === id ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-muted"}`}>
                        <input type="radio" name="pay-plan" value={id} checked={payPlan === id} onChange={() => setPayPlan(id)} className="accent-[var(--color-brand)]" />
                        {t(data.plans[id].name)} · {formatBdt(data.plans[id].priceBdt ?? 0)}
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="mb-2 text-sm font-medium text-ink">{t("Months")}</legend>
                    {data.payMonths.map((m) => (
                      <label key={m} className={`inline-flex min-h-[44px] min-w-[56px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm ${months === m ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-muted"}`}>
                        <input type="radio" name="pay-months" value={m} checked={months === m} onChange={() => setMonths(m)} className="sr-only" />
                        {m}
                      </label>
                    ))}
                  </fieldset>
                  {payPlan !== sub.plan && <p className="text-sm text-ink-muted">{t("Paying for this plan switches you to it. Time you have already paid for carries over.")}</p>}
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" disabled={!data.gateway.ready || busy === "pay" || price === null} onClick={() => void act("pay", { action: "checkout", plan: payPlan, months })} className="btn-primary-action min-h-[48px]">
                      {busy === "pay" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                      {t("Pay")} {price !== null ? formatBdt(price * months) : ""}
                    </button>
                    <span className="text-sm text-ink-faint">{t("bKash · Nagad · Rocket · cards · internet banking, through SSLCommerz")}</span>
                  </div>
                  {!data.gateway.ready && <p className="text-sm text-warning">{t("Online payment is not switched on yet. Please try again later.")}</p>}
                  {data.gateway.mode === "sandbox" && <p className="text-xs text-ink-faint">{t("Test mode: payments use SSLCommerz's sandbox and no real money moves.")}</p>}
                  {data.gateway.mode === "test" && <p className="text-xs text-ink-faint">{t("Test checkout: it shows how paying works and takes no money.")}</p>}
                </>
              )}
            </section>

            <section className="glass-card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="change-title">
              <h2 id="change-title" className="font-display text-xl font-semibold text-ink">
                {t("Change plan")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {(["starter", "pro"] as PlanId[])
                  .filter((id) => id !== sub.plan || sub.legacy)
                  .map((id) => (
                    <button key={id} type="button" disabled={busy === id} onClick={() => void act(id, { action: "change_plan", plan: id })} className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
                      {t("Switch to")} {t(data.plans[id].name)}
                    </button>
                  ))}
                <Link href="/pricing/enterprise" className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
                  {t("Enterprise quote")}
                </Link>
                {!sub.legacy && sub.plan !== "enterprise" && (
                  <button type="button" disabled={busy === "cancel"} onClick={() => void act("cancel", { action: "cancel", cancel: !sub.cancelAtPeriodEnd })} className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-ink-muted hover:text-danger">
                    {sub.cancelAtPeriodEnd ? t("Keep my plan") : t("Stop at the end of the paid time")}
                  </button>
                )}
              </div>
              <Link href="/pricing" className="inline-flex min-h-11 items-center text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink">
                {t("Compare plans")}
              </Link>
            </section>

            <section className="glass-card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="history-title">
              <h2 id="history-title" className="font-display text-xl font-semibold text-ink">
                {t("Payments")}
              </h2>
              {data.payments.length === 0 ? (
                <p className="text-sm text-ink-faint">{t("No payments yet.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-ink-faint">
                      <tr>
                        <th className="py-2 pr-4 font-medium">{t("Date")}</th>
                        <th className="py-2 pr-4 font-medium">{t("Plan")}</th>
                        <th className="py-2 pr-4 text-right font-medium">{t("Amount")}</th>
                        <th className="py-2 pr-4 font-medium">{t("Status")}</th>
                        <th className="py-2 font-medium">{t("Reference")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.payments.map((p) => (
                        <tr key={p.tranId}>
                          <td className="py-2 pr-4 text-ink-muted">{day(p.paidAt ?? p.createdAt)}</td>
                          <td className="py-2 pr-4 text-ink">
                            {t(data.plans[p.plan].name)} · {p.months} {t(p.months > 1 ? "months" : "month")}
                          </td>
                          <td className="py-2 pr-4 text-right text-ink [font-variant-numeric:tabular-nums]">{formatBdt(p.amountBdt)}</td>
                          <td className="py-2 pr-4">
                            <StatusBadge tone={PAY_STATUS[p.status].tone}>{t(PAY_STATUS[p.status].label)}</StatusBadge>
                          </td>
                          <td className="py-2 font-mono text-xs text-ink-muted">
                            {p.tranId}
                            {p.method ? ` · ${p.method}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
