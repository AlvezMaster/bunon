"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Check, RefreshCw, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useBunonStore } from "@/lib/store";
import { PLANS, formatBdt, type PlanId } from "@/lib/plans";
import { t } from "@/lib/i18n";

const FAQ: Array<[string, string]> = [
  ["How do we pay?", "Through SSLCommerz: bKash, Nagad, Rocket, Visa, Mastercard, Amex or internet banking. Pay for 1, 3, 6 or 12 months at a time."],
  ["What happens after the free month?", "Starter continues at ৳3,500 a month. If you don't pay, you keep 7 more days of full use; after that, sending answers pauses until you pay. Your data stays safe and drafting still works."],
  ["Can we change plans?", "Yes, at any time on the Billing page. Time you have already paid for carries over."],
  ["Do buyers pay?", "No. Buyers use Bunon free; each factory pays for its own plan."],
];

/** Public pricing: three plans for factories, and an Enterprise quote request. */
export default function PricingPage() {
  const session = useBunonStore((s) => s.session);
  const isFactory = session?.role === "factory";
  const [q, setQ] = useState({ company: "", contactName: "", email: "", phone: "", factories: "1", workers: "", needs: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState("");

  const ctaFor = (id: PlanId) => (id === "enterprise" ? "#quote" : isFactory ? `/factory/billing?plan=${id}` : `/signup?plan=${id}`);

  const sendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setFormError("");
    try {
      const res = await fetch("/api/billing/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
      const json = (await res.json()) as { error?: string; errors?: Record<string, string> };
      if (!res.ok) {
        setErrors(json.errors ?? {});
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setState("sent");
    } catch (err) {
      setFormError(t(err instanceof Error ? err.message : "Sending failed."));
      setState("idle");
    }
  };

  const field = (k: keyof typeof q, label: string, type = "text", extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{t(label)}</span>
      <input
        type={type}
        value={q[k]}
        onChange={(e) => {
          setQ((x) => ({ ...x, [k]: e.target.value }));
          setErrors((x) => ({ ...x, [k]: "" }));
        }}
        aria-invalid={!!errors[k]}
        className="min-h-[48px] w-full rounded-lg border border-field bg-surface/70 px-3 text-base text-ink outline-none focus:border-brand"
        {...extra}
      />
      {errors[k] && <span className="text-sm text-danger">{t(errors[k])}</span>}
    </label>
  );

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="Pricing"
          title="One plan per factory. Buyers are always free."
          note={t("Prices in Bangladeshi taka, per month. Pay with bKash, Nagad, Rocket, cards or internet banking.")}
        />

        <section className="grid gap-6 md:grid-cols-3" aria-label={t("Plans")}>
          {(Object.keys(PLANS) as PlanId[]).map((id) => {
            const p = PLANS[id];
            const featured = id === "pro";
            return (
              <article key={id} className={`glass-card flex flex-col gap-6 p-6 sm:p-8 ${featured ? "ring-2 ring-brand/60" : ""}`}>
                <div className="space-y-2">
                  <h2 className="flex items-center justify-between gap-2 font-display text-2xl font-semibold text-ink">
                    {t(p.name)}
                    {featured && <span className="rounded-full bg-brand-soft px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-brand">{t("Unlimited buyers")}</span>}
                  </h2>
                  <p className="text-sm text-ink-muted">{t(p.tagline)}</p>
                </div>
                <div className="space-y-1">
                  {p.priceBdt === null ? (
                    <p className="font-display text-4xl font-semibold tracking-tight text-ink">{t("Custom")}</p>
                  ) : (
                    <p className="font-display text-4xl font-semibold tracking-tight text-ink [font-variant-numeric:tabular-nums]">
                      {formatBdt(p.priceBdt)}
                      <span className="ml-1 font-sans text-base font-medium text-ink-muted">/{t("month")}</span>
                    </p>
                  )}
                  <p className="text-sm text-ink-faint">{id === "starter" ? t("after your free first month") : id === "pro" ? t("billed monthly, or pay ahead") : t("priced for your factories and needs")}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-2.5 text-sm text-ink-muted">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ctaFor(id)}
                  className={featured ? "btn-primary-action min-h-[48px] justify-center" : "btn-tactile-hollow inline-flex min-h-[48px] items-center justify-center gap-2 px-4 text-sm font-medium"}
                >
                  {id === "starter" ? t("Start your free month") : id === "pro" ? t("Choose Pro") : t("Ask for a quote")}
                </Link>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-display text-2xl font-semibold text-ink md:col-span-2">
            {t("Questions")}
          </h2>
          {FAQ.map(([question, answer]) => (
            <div key={question} className="glass-card space-y-2 p-5 sm:p-6">
              <h3 className="font-semibold text-ink">{t(question)}</h3>
              <p className="max-w-[65ch] text-sm text-ink-muted">{t(answer)}</p>
            </div>
          ))}
        </section>

        <section id="quote" className="glass-card scroll-mt-24 space-y-6 p-6 sm:p-8" aria-labelledby="quote-title">
          <div className="space-y-1">
            <h2 id="quote-title" className="flex items-center gap-2 font-display text-2xl font-semibold text-ink">
              <Building2 className="h-6 w-6 text-brand" aria-hidden="true" />
              {t("Enterprise: ask for a quote")}
            </h2>
            <p className="max-w-[65ch] text-sm text-ink-muted">{t("Tell us about your factories. We price Enterprise for what you need and reply by email within two working days.")}</p>
          </div>
          {state === "sent" ? (
            <p role="status" className="rounded-lg border border-success/40 bg-success-soft p-4 text-sm font-medium text-success">
              {t("Thank you. We have your request and will reply by email.")}
            </p>
          ) : (
            <form onSubmit={sendQuote} className="grid gap-4 sm:grid-cols-2" noValidate>
              {field("company", "Company or group name")}
              {field("contactName", "Your name")}
              {field("email", "Work email", "email", { autoComplete: "email" })}
              {field("phone", "Phone (optional)", "tel", { autoComplete: "tel" })}
              {field("factories", "Number of factories", "number", { min: 1, inputMode: "numeric" })}
              {field("workers", "Workers in total (optional)", "number", { min: 0, inputMode: "numeric" })}
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-ink">{t("What do you need? (optional)")}</span>
                <textarea
                  value={q.needs}
                  onChange={(e) => setQ((x) => ({ ...x, needs: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none focus:border-brand"
                />
              </label>
              {formError && (
                <p role="alert" className="text-sm text-danger sm:col-span-2">
                  {formError}
                </p>
              )}
              <button type="submit" disabled={state === "sending"} className="btn-primary-action min-h-[48px] sm:col-span-2 sm:justify-self-start">
                {state === "sending" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                {t("Send request")}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
