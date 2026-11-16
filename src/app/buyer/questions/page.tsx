"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { OrgAvatar, answeredCount, groupQuestionnaires, orgName, useDay, useQuestionnaires } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

/** Buyer: every questionnaire once, with each factory it went to and how far that factory has got. */
export default function BuyerQuestionsList() {
  const { data, error } = useQuestionnaires();
  const day = useDay();
  const groups = data ? groupQuestionnaires(data.questionnaires) : [];

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="Questions"
          title="Your questionnaires"
          note={t("Write a questionnaire once and send it to any of your factories. Compare their answers side by side.")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/buyer/questions/new" className="btn-primary-action min-h-[44px]">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("New questionnaire")}
            </Link>
          </div>
        </DashboardHeader>

        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {!data && !error && <p className="text-ink-muted">{t("Loading…")}</p>}
        {data && groups.length === 0 && (
          <div className="glass-card flex flex-col items-start gap-3 p-6">
            <p className="text-ink-muted">{t("No questionnaires yet.")}</p>
            <Link href="/buyer/questions/new" className="btn-primary-action min-h-[44px]">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("New questionnaire")}
            </Link>
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {groups.map((g) => {
            const total = g.copies.reduce((n, c) => n + c.questions.length, 0);
            const done = data ? g.copies.reduce((n, c) => n + answeredCount(c, data.answers), 0) : 0;
            return (
              <li key={g.groupId}>
                <Link href={`/buyer/questions/${g.groupId}`} className="glass-card tile-link !min-h-0 gap-4 p-5 sm:p-6">
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0 space-y-1">
                      <span className="block font-display text-xl font-semibold tracking-tight text-ink">{t(g.title)}</span>
                      <span className="block text-sm text-ink-faint">
                        {t("Sent")} {day(g.sentOn)} · {t("Due")} {day(g.dueOn)} · {g.rows.length} {t("questions")} · {g.copies.length}{" "}
                        {t(g.copies.length === 1 ? "factory" : "factories")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-brand">
                      <span className="tabular-nums">
                        {done}/{total}
                      </span>
                      <ArrowRight className="tile-arrow h-5 w-5" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="grid gap-2 sm:grid-cols-2">
                    {g.copies.map((c) => {
                      const n = data ? answeredCount(c, data.answers) : 0;
                      const pct = c.questions.length ? Math.round((n / c.questions.length) * 100) : 0;
                      return (
                        <span key={c.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/50 px-3 py-2">
                          <OrgAvatar name={c.factory} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">{orgName(c.factory)}</span>
                            <span className="mt-1 flex items-center gap-2">
                              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                                <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                              </span>
                              <span className="text-xs tabular-nums text-ink-muted">
                                {n}/{c.questions.length}
                              </span>
                            </span>
                          </span>
                        </span>
                      );
                    })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
