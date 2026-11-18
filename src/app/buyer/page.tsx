"use client";

import { Factory, History, MessageSquarePlus, MessageSquareText, Package, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, NextUp, QuickLinks, type NextUpTask, type QuickLink } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires } from "@/components/questions/shared";
import { useBunonStore } from "@/lib/store";
import { listStyles, styleClearance, visibleOrders } from "@/lib/styles";
import { t } from "@/lib/i18n";

export default function BuyerDashboard() {
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const partners = useBunonStore((s) => s.partners);
  const { data: questions } = useQuestionnaires();

  const orders = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  const held = orders.filter((o) => !styleClearance(o).cleared).length;
  const all = questions?.questionnaires.flatMap((q) => q.questions) ?? [];
  const answered = all.filter((x) => questions?.answers[x.id]).length;
  const waiting = all.length - answered;
  const factories = partners.filter((p) => p.status === "active" || p.status === "unlink_pending").length;

  // Only the one most useful job gets the big button; everything else is a quiet link below.
  const next: NextUpTask = held
    ? {
        Icon: ShieldAlert,
        tone: "bad",
        title: `${held} ${t(held === 1 ? "order is on hold" : "orders are on hold")}`,
        note: t("A supplier certificate has expired. See which one and who must renew it."),
        action: "See orders on hold",
        href: "/reports",
      }
    : factories === 0
      ? { Icon: Factory, title: t("Link your first factory"), note: t("Accept a factory's invite, or send one, to see its answers here."), action: "Link a factory", href: "/buyer/factories" }
      : answered
        ? {
            Icon: MessageSquareText,
            title: `${answered} ${t(answered === 1 ? "answer from your factories" : "answers from your factories")}`,
            note: t("Each one shows the sentence it came from."),
            action: "Read answers",
            href: "/buyer/questions",
          }
        : all.length === 0 && questions
          ? { Icon: MessageSquarePlus, title: t("Ask your factories a question"), note: t("Send a questionnaire. Each answer comes back with its source."), action: "Send a questionnaire", href: "/buyer/questions/new" }
          : waiting
            ? { Icon: MessageSquareText, calm: true, title: `${t("Waiting for")} ${waiting} ${t(waiting === 1 ? "answer" : "answers")}`, note: t("Your factories are working on them."), action: "See your questionnaires", href: "/buyer/questions" }
            : { Icon: ShieldCheck, calm: true, title: t("Everything is in date"), note: t("Every supplier certificate on your orders is valid."), action: "Verify a supplier", href: "/buyer/verify" };

  const links: QuickLink[] = [
    { href: "/buyer/questions", Icon: MessageSquareText, label: "Answers", count: questions ? answered : undefined },
    { href: "/reports", Icon: Package, label: "Orders", count: orders.length },
    { href: "/buyer/factories", Icon: Factory, label: "Factories", count: factories },
    { href: "/buyer/verify", Icon: Search, label: "Verify" },
    { href: "/ledger", Icon: History, label: "Activity log" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Buyer dashboard" title={session?.organization ?? "Your suppliers"}>
          <DemoDataBadge />
        </DashboardHeader>
        <NextUp task={next} />
        <QuickLinks links={links} />
      </main>
    </div>
  );
}
