"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import PricingShell from "@/components/pricing/PricingShell";
import { t } from "@/lib/i18n";

/** Short answers; each matches how billing actually works (src/lib/plans.ts, src/lib/server/billing.ts). */
const FAQ: Array<[string, string]> = [
  ["How do we pay?", "With bKash, Nagad, Rocket, a card or internet banking, through SSLCommerz. Pay for 1, 3, 6 or 12 months at a time."],
  ["What happens after the free month?", "Starter continues at ৳3,500 a month. Pay any time during the free month; your paid time starts when the free month ends."],
  ["What if we don't pay on time?", "You keep full use for 7 more days. After that only sending answers pauses until you pay. You can still read and draft."],
  ["Can we change plans?", "Yes, at any time on your Billing page. Time you have already paid for carries over."],
  ["Do buyers pay?", "No. Buyers use Bunon free. Each factory pays for its own plan."],
  ["Is our data safe if we stop?", "Yes. Stopping never deletes your documents or answers. If you unlink a buyer, both sides can download the shared data for 30 days."],
];

/** Pricing, page 3: common questions, one answer open at a time. */
export default function PricingFaqPage() {
  return (
    <PricingShell title="Questions about plans" note="Short answers. Open the one you need.">
      <div className="flex max-w-3xl flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
        {FAQ.map(([q, a], i) => (
          <details key={q} name="pricing-faq" open={i === 0} className="group px-5">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-ink [&::-webkit-details-marker]:hidden">
              {t(q)}
              <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <p className="max-w-[62ch] pb-5 text-[15px] leading-relaxed text-ink-muted [text-wrap:pretty]">{t(a)}</p>
          </details>
        ))}
      </div>
      <p className="text-sm text-ink-muted">
        {t("Something else?")}{" "}
        <Link href="/pricing/enterprise" className="font-semibold text-brand hover:underline">
          {t("Write to us")}
        </Link>
      </p>
    </PricingShell>
  );
}
