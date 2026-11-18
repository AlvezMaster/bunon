"use client";

import React from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import PricingShell from "@/components/pricing/PricingShell";
import { useBunonStore } from "@/lib/store";
import { PLANS, formatBdt, type PlanId } from "@/lib/plans";
import { t } from "@/lib/i18n";

type Cell = boolean | string;
const IDS: PlanId[] = ["starter", "pro", "enterprise"];
const price = (id: PlanId) => (PLANS[id].priceBdt === null ? "Custom" : `${formatBdt(PLANS[id].priceBdt as number)} / month`);
const limit = (n: number | null) => (n === null ? "Unlimited" : String(n));

/** Every row is something the app does today; limits come from src/lib/plans.ts. */
const ROWS: Array<{ label: string; cells: [Cell, Cell, Cell] }> = [
  { label: "Price", cells: [price("starter"), price("pro"), price("enterprise")] },
  { label: "Free first month", cells: [true, false, false] },
  { label: "Linked buyers", cells: [limit(PLANS.starter.limits.buyers), limit(PLANS.pro.limits.buyers), "Unlimited"] },
  { label: "Documents", cells: [limit(PLANS.starter.limits.documents), "Unlimited (fair use)", "Unlimited (fair use)"] },
  { label: "AI drafts with their source", cells: [true, true, true] },
  { label: "Answer reuse across buyers", cells: [true, true, true] },
  { label: "Bangla and English", cells: [true, true, true] },
  { label: "Tamper-evident activity log", cells: [true, true, true] },
  { label: "Your own AI agents (MCP)", cells: [false, true, true] },
  { label: "AI on your own computers", cells: [false, false, true] },
  { label: "Training for your team", cells: [false, false, true] },
  { label: "Support", cells: ["Email", "Priority", "Agreed terms"] },
];

function Value({ v }: { v: Cell }) {
  if (v === true) return <Check className="mx-auto h-5 w-5 text-success" strokeWidth={2.5} aria-label={t("Included")} />;
  if (v === false) return <Minus className="mx-auto h-5 w-5 text-ink-faint" aria-label={t("Not included")} />;
  return <span className="[font-variant-numeric:tabular-nums]">{t(v)}</span>;
}

/** Pricing, page 2: the plans side by side, feature by feature. */
export default function PricingComparePage() {
  const session = useBunonStore((s) => s.session);
  const href = (id: PlanId) => (id === "enterprise" ? "/pricing/enterprise" : session?.role === "factory" ? `/factory/billing?plan=${id}` : `/signup/factory?plan=${id}`);

  return (
    <PricingShell title="Compare the plans" note="Everything in one table. Every feature here works in Bunon today.">
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
          <caption className="sr-only">{t("Plans compared feature by feature")}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-[34%] px-5 py-4 text-sm font-medium text-ink-muted">
                {t("Feature")}
              </th>
              {IDS.map((id) => (
                <th key={id} scope="col" className={`px-5 py-4 text-center font-display text-xl font-semibold text-ink ${id === "pro" ? "bg-brand-soft/60" : ""}`}>
                  {t(PLANS[id].name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="px-5 py-3.5 font-medium text-ink">
                  {t(r.label)}
                </th>
                {r.cells.map((c, i) => (
                  <td key={IDS[i]} className={`px-5 py-3.5 text-center text-ink-muted ${IDS[i] === "pro" ? "bg-brand-soft/60" : ""}`}>
                    <Value v={c} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="px-5 py-5" />
              {IDS.map((id) => (
                <td key={id} className={`px-5 py-5 text-center ${id === "pro" ? "bg-brand-soft/60" : ""}`}>
                  <Link
                    href={href(id)}
                    className={
                      id === "pro"
                        ? "btn-primary-action min-h-[44px] w-full justify-center"
                        : "btn-tactile-hollow inline-flex min-h-[44px] w-full items-center justify-center px-3 text-sm font-medium"
                    }
                  >
                    {id === "starter" ? t("Start free") : id === "pro" ? t("Choose Pro") : t("Ask for a quote")}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </PricingShell>
  );
}
