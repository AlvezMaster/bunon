"use client";

import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { QuestionnaireList, useQuestionnaires } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

/** Factory inbox: every questionnaire a buyer has sent, newest first, with how far along each one is. */
export default function FactoryQuestionsInbox() {
  const { data, error } = useQuestionnaires();
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="Buyer questions"
          title="Questions from your buyers"
          note={t("Each buyer sends you a questionnaire. Open one to answer it; nothing reaches the buyer until you send it.")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/factory/documents" className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("Your documents")}
            </Link>
          </div>
        </DashboardHeader>
        {error && <p role="alert" className="text-danger">{error}</p>}
        {data ? <QuestionnaireList data={data} hrefBase="/factory/questionnaire" /> : !error && <p className="text-ink-muted">{t("Loading…")}</p>}
      </main>
    </div>
  );
}
