"use client";

import React from "react";
import { Quote, Repeat2, Send, Timer } from "lucide-react";
import type { Payload } from "./shared";
import { t } from "@/lib/i18n";

/**
 * "Your results so far": impact counted from the factory's own answers in Bunon, not estimated.
 * Answers sent, how many carry their source sentence, how many were reused for another buyer instead of
 * being answered again, and the typical time from a questionnaire arriving to an answer being sent.
 */
export function FactoryImpact({ data }: { data: Payload }) {
  const answers = Object.values(data.answers ?? {});
  if (answers.length === 0) return null;
  const sourced = answers.filter((a) => a.docId && a.quote).length;
  const reused = answers.filter((a) => a.reusedFrom).length;
  const sentOn = new Map(data.questionnaires.flatMap((q) => q.questions.map((x) => [x.id, q.sentOn] as const)));
  const days = answers
    .map((a) => (a.approvedAt && sentOn.get(a.questionId) ? (Date.parse(a.approvedAt) - Date.parse(sentOn.get(a.questionId)!)) / 864e5 : NaN))
    .filter((d) => Number.isFinite(d) && d >= 0)
    .sort((a, b) => a - b);
  const median = days.length ? days[Math.floor(days.length / 2)] : null;
  const ready = Object.keys(data.reuse ?? {}).filter((id) => !data.answers[id]).length;

  const tiles = [
    { Icon: Send, value: String(answers.length), label: "Answers sent" },
    { Icon: Quote, value: `${Math.round((sourced / answers.length) * 100)}%`, label: "With their source sentence" },
    { Icon: Repeat2, value: String(reused + ready), label: "Answered once, reused for another buyer", note: ready ? `${ready} ${t("ready to check now")}` : undefined },
    { Icon: Timer, value: median === null ? "–" : median < 1 ? t("Same day") : `${Math.round(median)} ${t(Math.round(median) === 1 ? "day" : "days")}`, label: "Typical time to answer" },
  ];

  return (
    <section aria-labelledby="impact-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="impact-title" className="section-index">
          {t("Your results so far")}
        </h2>
        <p className="text-xs text-ink-faint">{t("Counted from your answers in Bunon, not estimated.")}</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ Icon, value, label, note }) => (
          <li key={label} className="glass-card flex flex-col gap-1.5 p-4">
            <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
            <span className="font-display text-3xl font-semibold text-ink [font-variant-numeric:tabular-nums]">{value}</span>
            <span className="text-sm text-ink-muted">{t(label)}</span>
            {note && <span className="text-xs font-medium text-success">{note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
