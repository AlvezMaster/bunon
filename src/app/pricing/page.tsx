"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PricingShell from "@/components/pricing/PricingShell";
import { useBunonStore } from "@/lib/store";
import { PLANS, formatBdt, type PlanId } from "@/lib/plans";
import { t } from "@/lib/i18n";

/** The three things that tell the plans apart; the full list is on /pricing/compare. */
const KEY_POINTS: Record<PlanId, string[]> = {
  starter: ["1 month free", "Up to 3 buyers", "Up to 20 documents"],
  pro: ["Unlimited buyers", "Up to 50 documents", "Your own AI agents (MCP)"],
  enterprise: ["Priced for your needs", "AI on your own computers", "Training for your team"],
};

/** Pricing, page 1: the three plans and one button each. */
export default function PricingPlansPage() {
  const session = useBunonStore((s) => s.session);
  const isFactory = session?.role === "factory";
  const href = (id: PlanId) => (id === "enterprise" ? "/pricing/enterprise" : isFactory ? `/factory/billing?plan=${id}` : `/signup?plan=${id}`);

  return (
    <PricingShell title="Simple plans for every factory" note="Buyers are always free. Prices are in taka, per month.">
      <section className="grid gap-6 md:grid-cols-3" aria-label={t("Plans")}>
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const featured = id === "pro";
          return (
            <article
              key={id}
              className={`relative flex flex-col gap-6 rounded-2xl border bg-surface p-7 shadow-[0_1px_2px_rgba(20,23,26,0.06),0_16px_40px_-24px_rgba(30,58,95,0.35)] ${
                featured ? "border-brand ring-1 ring-brand" : "border-line"
              }`}
            >
              {featured && (
                <p className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-white">{t("Recommended")}</p>
              )}
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-semibold text-ink">{t(p.name)}</h2>
                <p className="text-sm text-ink-muted">{t(p.tagline)}</p>
              </div>
              <div>
                <p className="font-display text-5xl font-semibold tracking-[-0.03em] text-ink [font-variant-numeric:tabular-nums]">
                  {p.priceBdt === null ? t("Custom") : formatBdt(p.priceBdt)}
                  {p.priceBdt !== null && <span className="ml-1 font-sans text-base font-medium tracking-normal text-ink-muted">/{t("month")}</span>}
                </p>
                <p className="mt-1 text-sm text-ink-faint">{id === "starter" ? t("after your free first month") : id === "pro" ? t("pay monthly or ahead") : t("we send you a quote")}</p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 text-[15px] text-ink">
                {KEY_POINTS[id].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link
                href={href(id)}
                className={
                  featured
                    ? "btn-primary-action min-h-[48px] justify-center"
                    : "btn-tactile-hollow inline-flex min-h-[48px] items-center justify-center gap-2 px-4 text-sm font-medium"
                }
              >
                {id === "starter" ? t("Start your free month") : id === "pro" ? t("Choose Pro") : t("Ask for a quote")}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="flex flex-col items-start gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{t("Pay with bKash, Nagad, Rocket, cards or internet banking.")}</p>
        <Link href="/pricing/compare" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand hover:underline">
          {t("Compare every feature")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </PricingShell>
  );
}
