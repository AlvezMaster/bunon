"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, FileText, History, MessageSquareText, Package, ShieldAlert, ShieldCheck, UserPlus, Network } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, NextUp, Panel, QuickLinks, RowLink, StatusBadge, type NextUpTask, type QuickLink } from "@/components/dashboard/DashboardParts";
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
  const [docCount, setDocCount] = useState<number | null>(null);
  useEffect(() => {
    void fetch("/api/documents", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { documents?: unknown[] } | null) => setDocCount(j?.documents?.length ?? null))
      .catch(() => undefined);
  }, []);

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

  const open = questions ? questions.questionnaires.filter((q) => q.linkState !== "closed") : [];
  const waiting = open.flatMap((q) => q.questions.filter((x) => !questions?.answers[x.id]));
  const ready = waiting.filter((x) => questions?.reuse?.[x.id] || questions?.prepared?.[x.id]).length;
  const buyers = partners.filter((p) => p.status === "active" || p.status === "unlink_pending").length;
  const expired = attention.filter((a) => a.expired);

  // `fixTier` opens the upload panel for that certificate as soon as the order page loads.
  const openOrder = (code: string, fixTier?: string) => {
    setActiveSupplierStyleId(code);
    router.push(fixTier ? `/factory/order?fix=${encodeURIComponent(fixTier)}` : "/factory/order");
  };

  // Only the one most useful job gets the big button; everything else is a quiet link below.
  const next: NextUpTask = expired.length
    ? {
        Icon: ShieldAlert,
        tone: "bad",
        title: `${expired.length} ${t(expired.length === 1 ? "certificate has expired" : "certificates have expired")}`,
        note: held ? `${held} ${t(held === 1 ? "order is on hold until you renew it." : "orders are on hold until you renew them.")}` : t("Renew it so no order goes on hold."),
        action: "Fix the first one",
        onClick: () => openOrder(expired[0].order, expired[0].tier.id),
      }
    : waiting.length
      ? {
          Icon: MessageSquareText,
          title: `${waiting.length} ${t(waiting.length === 1 ? "buyer question to answer" : "buyer questions to answer")}`,
          note: ready ? `${ready} ${t("are already drafted. Check them and send.")}` : t("Bunon drafts each answer from your documents. You check and send."),
          action: "Answer questions",
          href: "/factory/questionnaire",
        }
      : attention.length
        ? {
            Icon: ShieldAlert,
            tone: "review",
            title: `${attention.length} ${t(attention.length === 1 ? "certificate expires soon" : "certificates expire soon")}`,
            note: t("Renew within 90 days so no order goes on hold."),
            action: "Renew the first one",
            onClick: () => openOrder(attention[0].order, attention[0].tier.id),
          }
        : docCount === 0
          ? { Icon: FileText, title: t("Add your documents"), note: t("Licences, policies and audit reports. Bunon answers buyers from them."), action: "Add documents", href: "/factory/documents" }
          : buyers === 0
            ? { Icon: UserPlus, title: t("Invite your first buyer"), note: t("Send a link. Once they accept, they can ask you questions here."), action: "Invite a buyer", href: "/factory/buyers" }
            : orders.length === 0
              ? { Icon: FilePlus2, title: t("Add your first order"), note: t("Then Bunon tracks every certificate it needs."), action: "Add an order", href: "/factory/order?new=1" }
              : { Icon: ShieldCheck, calm: true, title: t("You're all caught up"), note: t("Every certificate is in date and every question is answered."), action: "See your orders", href: "/factory/orders" };

  const links: QuickLink[] = [
    { href: "/factory/questionnaire", Icon: MessageSquareText, label: "Questions", count: questions ? waiting.length : undefined },
    { href: "/factory/orders", Icon: Package, label: "Orders", count: orders.length },
    { href: "/factory/documents", Icon: FileText, label: "Documents", count: docCount ?? undefined },
    { href: "/factory/evidence", Icon: Network, label: "Evidence map" },
    { href: "/factory/buyers", Icon: UserPlus, label: "Buyers", count: buyers },
    { href: "/ledger", Icon: History, label: "Activity log" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Factory dashboard" title={session?.organization ?? "Your factory"}>
          <DemoDataBadge />
        </DashboardHeader>

        <NextUp task={next} />

        {attention.length > 1 && (
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

        <QuickLinks links={links} />
      </main>
    </div>
  );
}
