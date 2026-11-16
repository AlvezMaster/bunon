"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, Panel, RecentActivity, StatusBadge } from "@/components/dashboard/DashboardParts";
import { useBunonStore } from "@/lib/store";
import { listStyles, styleClearance, visibleOrders } from "@/lib/styles";
import { formatIsoDate } from "@/lib/certificate-registry";
import { t } from "@/lib/i18n";

const SOON_DAYS = 90;

export default function FactoryDashboard() {
  const router = useRouter();
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const setActiveSupplierStyleId = useBunonStore((s) => s.setActiveSupplierStyleId);

  const orders = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + SOON_DAYS * 864e5).toISOString().slice(0, 10);

  // Every certificate across all orders that is expired or expires within 90 days, expired first.
  const attention = orders
    .flatMap((o) =>
      o.tiers
        .filter((tier) => tier.status === "expired" || (tier.validThrough && tier.validThrough <= soon))
        .map((tier) => ({
          order: o.code,
          tier,
          expired: tier.status === "expired" || (!!tier.validThrough && tier.validThrough < today),
        }))
    )
    .sort((a, b) => Number(b.expired) - Number(a.expired));
  const held = orders.filter((o) => !styleClearance(o).cleared).length;

  // One short line of context under the title, instead of a row of number cards.
  const summary =
    orders.length === 0 ? (
      <>{t("Add your first order, then invite its buyer from the Buyers page.")}</>
    ) : attention.length === 0 ? (
      <>{t("Every certificate is in date")}.</>
    ) : (
      <>
        {attention.length} {t(attention.length === 1 ? "certificate needs renewing" : "certificates need renewing")}
        {held > 0 && (
          <>
            {" · "}
            {held} {t(held === 1 ? "order is on hold" : "orders are on hold")}
          </>
        )}
        .
      </>
    );

  // `fixTier` opens the upload panel for that certificate as soon as the order page loads.
  const openOrder = (code: string, fixTier?: string) => {
    setActiveSupplierStyleId(code);
    router.push(fixTier ? `/factory/order?fix=${encodeURIComponent(fixTier)}` : "/factory/order");
  };

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Factory dashboard" title={session?.organization ?? "Your factory"} note={summary}>
          <DemoDataBadge />
        </DashboardHeader>

        {attention.length > 0 && (
          <Panel title="Needs your attention">
            <ul className="divide-y divide-line">
              {attention.map(({ order, tier, expired }, i) => (
                <li key={`${order}-${tier.id}`} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {tier.facilityName} · {tier.certType}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {t("Order #")}
                      {order} · {t(expired ? "Expired" : "Expires")}{" "}
                      <span className="font-mono tabular-nums">{formatIsoDate(tier.validThrough)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge tone={expired ? "bad" : "review"}>{expired ? "Expired" : "Due soon"}</StatusBadge>
                    {/* One primary button per screen: the most urgent row; the rest stay quiet. */}
                    <button
                      type="button"
                      onClick={() => openOrder(order, tier.id)}
                      className={`${i === 0 ? "btn-primary-action" : "btn-tactile-hollow"} inline-flex min-h-[44px] items-center gap-2 px-4 text-sm`}
                    >
                      {t(expired ? "Fix" : "Renew")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel
            title="Your orders"
            action={
              <Link href="/factory/order?new=1" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand hover:underline">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("New order")}
              </Link>
            }
          >
            {orders.length === 0 && <p className="text-sm text-ink-muted">{t("No orders yet. Add your first order to start tracking its certificates.")}</p>}
            <ul className="divide-y divide-line">
              {orders.map((o) => {
                const c = styleClearance(o);
                return (
                  <li key={o.code}>
                    <button
                      type="button"
                      onClick={() => openOrder(o.code)}
                      className="flex w-full items-center justify-between gap-4 rounded-[3px] py-3 text-left hover:bg-surface-2"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          #{o.code} · {o.title}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {o.buyer} · {o.volume}
                        </span>
                      </span>
                      <StatusBadge tone={c.cleared ? "ok" : "bad"}>{c.cleared ? "Ready" : "On hold"}</StatusBadge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <RecentActivity empty="Nothing recorded yet." />
        </div>
      </main>
    </div>
  );
}
