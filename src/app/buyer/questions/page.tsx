"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { QuestionnaireList, useQuestionnaires } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

/** Buyer view: the questionnaires this brand sent, to which factory, and how many answers are back. */
export default function BuyerQuestionsList() {
  const { data, error } = useQuestionnaires();
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="Questions"
          title="Your questionnaires"
          note={t("Questions you sent to your factories. Every answer shows the document sentence it comes from.")}
        >
          <DemoDataBadge />
        </DashboardHeader>
        {error && <p role="alert" className="text-danger">{error}</p>}
        {data ? <QuestionnaireList data={data} hrefBase="/buyer/questions" /> : !error && <p className="text-ink-muted">{t("Loading…")}</p>}
      </main>
    </div>
  );
}
