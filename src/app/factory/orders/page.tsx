"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, StatusBadge } from "@/components/dashboard/DashboardParts";
import { useBunonStore } from "@/lib/store";
import { listStyles, styleClearance, visibleOrders } from "@/lib/styles";
import { t } from "@/lib/i18n";

/** Every order the signed-in factory makes; click one to open it. */
export default function FactoryOrdersPage() {
  const router = useRouter();
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const sessionChecked = useBunonStore((s) => s.sessionChecked);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const setActiveSupplierStyleId = useBunonStore((s) => s.setActiveSupplierStyleId);
  const orders = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  // Orders on hold first, so the ones that need work are at the top.
  const sorted = [...orders].sort((a, b) => Number(styleClearance(a).cleared) - Number(styleClearance(b).cleared));

  const open = (code: string) => {
    setActiveSupplierStyleId(code);
    router.push("/factory/order");
  };

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Orders" title="Your orders">
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/factory/order?new=1" className="btn-primary-action">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("New order")}
            </Link>
          </div>
        </DashboardHeader>

        {!sessionChecked ? (
          <p className="text-ink-muted">{t("Loading…")}</p>
        ) : sorted.length === 0 ? (
          <p className="rounded-[4px] border border-dashed border-line-strong p-8 text-center text-ink-muted">
            {t("No orders yet. Add your first order to start checking its suppliers.")}
          </p>
        ) : (
          <ul className="glass-card divide-y divide-line">
            {sorted.map((o) => {
              const held = !styleClearance(o).cleared;
              return (
                <li key={o.code}>
                  <button
                    type="button"
                    onClick={() => open(o.code)}
                    className="flex min-h-[64px] w-full items-center gap-4 px-5 py-3 text-left transition-colors duration-150 hover:bg-surface-2"
                  >
                    <span className="w-20 shrink-0 font-mono text-sm tabular-nums text-ink-muted">#{o.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{o.title}</span>
                      <span className="block truncate text-sm text-ink-muted">
                        {o.buyer} · {o.volume}
                      </span>
                    </span>
                    <StatusBadge tone={held ? "bad" : "ok"}>{held ? "On hold" : "Ready"}</StatusBadge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
