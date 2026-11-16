"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, MessageSquareText, Plus, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, NextSteps, Panel, RecentActivity, RowLink, StatusBadge, type NextStep } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires } from "@/components/questions/shared";
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
  const partners = useBunonStore((s) => s.partners);
  const { data: questions } = useQuestionnaires();

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

  const toAnswer = questions ? questions.questionnaires.reduce((n, q) => n + q.questions.filter((x) => !questions.answers[x.id]).length, 0) : undefined;
  const buyers = partners.filter((p) => p.status === "active" || p.status === "unlink_pending").length;
  const expiredCount = attention.filter((a) => a.expired).length;

  // The four jobs a factory comes here for. The most urgent one gets the accent colour.
  const steps: NextStep[] = [
    attention.length
      ? { href: "#needs-attention", Icon: ShieldAlert, title: "Renew certificates", note: expiredCount ? "Some have expired; orders are on hold" : "Some expire within 90 days", count: attention.length, primary: expiredCount > 0 }
      : { href: "/factory/orders", Icon: ShieldCheck, title: "Certificates", note: "All in date. See every order", count: 0 },
    { href: "/factory/questionnaire", Icon: MessageSquareText, title: "Answer buyer questions", note: "AI drafts from your documents", count: toAnswer, primary: !expiredCount && !!toAnswer },
    { href: "/factory/buyers", Icon: UserPlus, title: "Invite a buyer", note: "Send a link to connect", count: buyers },
    { href: "/factory/order?new=1", Icon: FilePlus2, title: "Add an order", note: "Track its certificates" },
  ];

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

        <NextSteps steps={steps} />

        {attention.length > 0 && (
          <div id="needs-attention" className="scroll-mt-24">
            <Panel title="Needs your attention">
              <ul className="divide-y divide-line">
                {attention.map(({ order, tier, expired }) => (
                  <li key={`${order}-${tier.id}`}>
                    <RowLink onClick={() => openOrder(order, tier.id)} label={`${t(expired ? "Fix" : "Renew")}: ${tier.facilityName}, ${tier.certType}`}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {tier.facilityName} · {tier.certType}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {t("Order #")}
                          {order} · {t(expired ? "Expired" : "Expires")}{" "}
                          <span className="font-mono tabular-nums">{formatIsoDate(tier.validThrough)}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <StatusBadge tone={expired ? "bad" : "review"}>{expired ? "Expired" : "Due soon"}</StatusBadge>
                        <span className="text-sm font-semibold text-brand">{t(expired ? "Fix" : "Renew")}</span>
                      </span>
                    </RowLink>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel
            title="Your orders"
            action={
              <Link href="/factory/order?new=1" className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand hover:underline">
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
                    <RowLink onClick={() => openOrder(o.code)}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          #{o.code} · {o.title}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {o.buyer.replace(/\s*\(.*\)\s*$/, "")} · {o.volume}
                        </span>
                      </span>
                      <StatusBadge tone={c.cleared ? "ok" : "bad"}>{c.cleared ? "Ready" : "On hold"}</StatusBadge>
                    </RowLink>
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
