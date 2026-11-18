"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CreditCard, FlaskConical, Landmark, Lock, RefreshCw, Smartphone } from "lucide-react";
import BunonLogo from "@/components/BunonLogo";
import { formatBdt } from "@/lib/plans";
import { t } from "@/lib/i18n";

interface Order {
  tranId: string;
  plan: string;
  months: number;
  amountBdt: number;
  status: string;
  company: string;
}

const METHODS = [
  { id: "bKash", Icon: Smartphone, kind: "Mobile wallet" },
  { id: "Nagad", Icon: Smartphone, kind: "Mobile wallet" },
  { id: "Rocket", Icon: Smartphone, kind: "Mobile wallet" },
  { id: "Card", Icon: CreditCard, kind: "Visa, Mastercard, Amex" },
  { id: "Internet banking", Icon: Landmark, kind: "Your bank's website" },
] as const;

const STEPS = ["Connecting to the payment service…", "Waiting for confirmation…", "Payment confirmed"];

/**
 * Bunon's test checkout: the steps of paying a plan, with no money taken. Used only while SSLCommerz is not set up;
 * it never asks for a card number, PIN or wallet number.
 */
export default function TestCheckoutPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const tran = new URLSearchParams(window.location.search).get("tran") ?? "";
    void (async () => {
      const res = await fetch(`/api/billing/test-checkout?tran=${encodeURIComponent(tran)}`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as Order & { error?: string };
      if (!res.ok) return setError(t(json.error ?? "Could not load the payment."));
      setOrder(json);
    })();
  }, []);

  const finish = async (outcome: "paid" | "cancelled") => {
    if (!order) return;
    if (outcome === "paid") {
      // Show the steps a real payment goes through, then record the test payment.
      for (let i = 0; i < STEPS.length - 1; i++) {
        setStep(i);
        await new Promise((r) => setTimeout(r, 1100));
      }
    }
    const res = await fetch("/api/billing/test-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tran: order.tranId, outcome, method }) });
    const json = (await res.json().catch(() => ({}))) as { next?: string; error?: string };
    if (!res.ok || !json.next) {
      setStep(-1);
      return setError(t(json.error ?? "Something went wrong."));
    }
    if (outcome === "paid") {
      setStep(STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 1300));
    }
    window.location.assign(json.next);
  };

  const paying = step >= 0;
  const done = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-canvas">
      <div role="note" className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2.5 text-center text-sm font-semibold text-warning">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("Test checkout · No money is taken. This shows how paying for a plan works.")}
      </div>
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <BunonLogo className="h-6 w-6" />
            Bunon
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("Test mode")}
          </span>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        {!order && !error && <div className="glass-card h-80 animate-pulse motion-reduce:animate-none" aria-hidden="true" />}

        {order && (
          <section className="glass-card flex flex-col gap-6 p-6 sm:p-8" aria-labelledby="pay-title">
            <div className="space-y-1">
              <p className="text-sm text-ink-muted">{order.company}</p>
              <h1 id="pay-title" className="font-display text-2xl font-semibold text-ink">
                {t(order.plan)} · {order.months} {t(order.months > 1 ? "months" : "month")}
              </h1>
              <p className="font-display text-5xl font-semibold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{formatBdt(order.amountBdt)}</p>
              <p className="font-mono text-xs text-ink-faint">{order.tranId}</p>
            </div>

            {order.status !== "pending" ? (
              <p className="text-sm text-ink-muted">{t("This payment is already finished.")}</p>
            ) : paying ? (
              <div className="flex flex-col items-center gap-4 py-6" aria-live="polite">
                <span className={`grid h-16 w-16 place-items-center rounded-full ${done ? "bg-success text-white" : "bg-brand/10 text-brand"}`}>
                  {done ? <Check className="h-8 w-8" aria-hidden="true" /> : <RefreshCw className="h-7 w-7 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                </span>
                <p className="text-base font-semibold text-ink">{t(STEPS[step])}</p>
                <p className="text-sm text-ink-muted">
                  {method} · {t("test, no money taken")}
                </p>
              </div>
            ) : (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-semibold text-ink">{t("Choose how to pay")}</legend>
                  {METHODS.map(({ id, Icon, kind }) => (
                    <label
                      key={id}
                      className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border px-4 transition-colors duration-150 ${method === id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/50"}`}
                    >
                      <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="h-4 w-4 accent-[var(--color-brand)]" />
                      <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-ink">{id}</span>
                        <span className="block text-xs text-ink-muted">{t(kind)}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                {method && <p className="text-sm text-ink-muted">{t("In a real payment you confirm it in your wallet app or on your bank's page. Here nothing is charged.")}</p>}
                <div className="flex flex-col gap-3">
                  <button type="button" disabled={!method} onClick={() => void finish("paid")} className="btn-primary-action min-h-[52px] text-base">
                    {t("Pay")} {formatBdt(order.amountBdt)} ({t("test")})
                  </button>
                  <button type="button" onClick={() => void finish("cancelled")} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-sm font-medium text-ink-muted hover:text-ink">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t("Cancel and go back")}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
        <Link href="/factory/billing" className="self-center text-sm text-ink-faint hover:text-ink">
          {t("Back to billing")}
        </Link>
      </main>
    </div>
  );
}
