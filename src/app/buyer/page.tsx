"use client";

import { Factory, MessageSquareText, ShieldAlert, ShieldCheck, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, NextSteps, Panel, RecentActivity, RowLink, StatusBadge, type NextStep } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires } from "@/components/questions/shared";
import { useBunonStore } from "@/lib/store";
import { factoryOf, listStyles, styleClearance, visibleOrders } from "@/lib/styles";
import { t } from "@/lib/i18n";

export default function BuyerDashboard() {
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const partners = useBunonStore((s) => s.partners);
  const { data: questions } = useQuestionnaires();

  const orders = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  const suppliers = [...new Set(orders.map(factoryOf))].map((name) => {
    const own = orders.filter((o) => factoryOf(o) === name);
    return { name, orders: own.length, held: own.filter((o) => !styleClearance(o).cleared).length };
  });
  const held = suppliers.reduce((n, s) => n + s.held, 0);
  const answered = questions ? questions.questionnaires.reduce((n, q) => n + q.questions.filter((x) => questions.answers[x.id]).length, 0) : undefined;
  const factories = partners.filter((p) => p.status === "active" || p.status === "unlink_pending").length;

  // The four jobs a buyer comes here for. Orders on hold come first when there are any.
  const steps: NextStep[] = [
    held
      ? { href: "/reports", Icon: ShieldAlert, title: "Orders on hold", note: "A supplier certificate has expired", count: held, primary: true }
      : { href: "/reports", Icon: ShieldCheck, title: "Your orders", note: "All certificates in date", count: orders.length },
    { href: "/buyer/questions", Icon: MessageSquareText, title: "Read answers", note: "Each one shows its source sentence", count: answered, primary: !held && !!answered },
    { href: "/buyer/verify", Icon: Search, title: "Verify a supplier", note: "Check any order step by step" },
    { href: "/buyer/factories", Icon: Factory, title: "Your factories", note: "Linked suppliers and invites", count: factories },
  ];

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Buyer dashboard" title={session?.organization ?? "Your suppliers"}>
          <DemoDataBadge />
        </DashboardHeader>

        <NextSteps steps={steps} />

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel title="Your suppliers">
            <ul className="divide-y divide-line">
              {suppliers.map((s) => (
                <li key={s.name}>
                  <RowLink href={`/buyer/verify?factory=${encodeURIComponent(s.name)}`} label={`${t("Verify")} ${s.name}`}>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{s.name}</span>
                      <span className="block text-sm text-ink-muted tabular-nums">
                        {s.orders} {t(s.orders === 1 ? "order" : "orders")}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <StatusBadge tone={s.held ? "bad" : "ok"}>{s.held ? `${s.held} ${t("on hold")}` : t("All in date")}</StatusBadge>
                      <span className="text-sm font-semibold text-brand">{t("Verify")}</span>
                    </span>
                  </RowLink>
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
