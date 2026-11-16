"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, Panel, RecentActivity, StatCard, StatusBadge } from "@/components/dashboard/DashboardParts";
import { useBunonStore } from "@/lib/store";
import { factoryOf, listStyles, styleClearance, visibleOrders } from "@/lib/styles";
import { t } from "@/lib/i18n";

export default function BuyerDashboard() {
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);

  const orders = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  const suppliers = [...new Set(orders.map(factoryOf))].map((name) => {
    const own = orders.filter((o) => factoryOf(o) === name);
    return { name, orders: own.length, held: own.filter((o) => !styleClearance(o).cleared).length };
  });
  const held = suppliers.reduce((n, s) => n + s.held, 0);

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Buyer dashboard" title={session?.organization ?? "Your suppliers"}>
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/buyer/verify" className="btn-primary-action">
              {t("Verify a supplier")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </DashboardHeader>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Supplier factories" value={suppliers.length} />
          <StatCard label="Open orders" value={orders.length} />
          <StatCard label="Orders on hold" value={held} note="A supplier certificate has expired" tone={held ? "bad" : undefined} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel title="Your suppliers">
            <ul className="divide-y divide-line">
              {suppliers.map((s) => (
                <li key={s.name} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{s.name}</p>
                    <p className="text-sm text-ink-muted tabular-nums">
                      {s.orders} {t(s.orders === 1 ? "order" : "orders")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge tone={s.held ? "bad" : "ok"}>{s.held ? `${s.held} ${t("on hold")}` : t("All in date")}</StatusBadge>
                    <Link
                      href={`/buyer/verify?factory=${encodeURIComponent(s.name)}`}
                      className="btn-tactile-hollow inline-flex min-h-[44px] items-center px-4 text-sm font-semibold"
                    >
                      {t("Verify")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <RecentActivity types={["BUYER AUDIT VERIFICATION", "BUYER QUERY"]} empty="You haven't verified a supplier yet." />
        </div>
      </main>
    </div>
  );
}
