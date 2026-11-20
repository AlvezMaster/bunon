"use client";

import React from "react";
import { Quote, Repeat2, Send, Timer } from "lucide-react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
      <WeeklyChart answers={answers} />
    </section>
  );
}

/** Monday of the week a date falls in, as YYYY-MM-DD (UTC). */
function weekOf(iso: string): string {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * Answers sent per week for the last 8 weeks with answers, split into new answers and answers reused
 * from an earlier buyer. Drawn with Recharts; the same numbers are in a table for screen readers.
 */
export function WeeklyChart({ answers }: { answers: Array<{ approvedAt?: string; reusedFrom?: string | null }> }) {
  const dated = answers.filter((a) => a.approvedAt && Number.isFinite(Date.parse(a.approvedAt)));
  if (dated.length < 2) return null;
  const sorted = dated.map((a) => a.approvedAt!).sort();
  const last = new Date(weekOf(sorted.at(-1)!));
  // From the first week with answers (at most 8 weeks back, at least 4 bars).
  const span = Math.min(8, Math.max(4, Math.round((last.getTime() - Date.parse(weekOf(sorted[0]))) / (7 * 864e5)) + 1));
  const weeks = Array.from({ length: span }, (_, i) => {
    const d = new Date(last);
    d.setUTCDate(d.getUTCDate() - 7 * (span - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const rows = weeks.map((w) => {
    const inWeek = dated.filter((a) => weekOf(a.approvedAt!) === w);
    const reused = inWeek.filter((a) => a.reusedFrom).length;
    return { week: w, fresh: inWeek.length - reused, reused };
  });
  const label = (w: string) => new Date(w).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  // The total sits on top of whichever bar is highest in the stack.
  const chartRows = rows.map((r) => ({ ...r, label: label(r.week), onFresh: r.reused ? null : r.fresh || null, onReused: r.reused ? r.fresh + r.reused : null }));

  return (
    <figure className="glass-card p-4">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{t("Answers sent each week")}</span>
        <span className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" aria-hidden="true" />{t("New answer")}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-success [background-image:repeating-linear-gradient(45deg,transparent_0_2px,rgba(255,255,255,.45)_2px_4px)]" aria-hidden="true" />{t("Reused for another buyer")}</span>
        </span>
      </figcaption>
      <div role="img" aria-label={t("Answers sent each week")} className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 18, right: 8, bottom: 0, left: 8 }} barCategoryGap="28%">
            <defs>
              <pattern id="reuse-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" className="fill-success" />
                <rect width="2" height="6" fill="rgba(255,255,255,.4)" />
              </pattern>
            </defs>
            <XAxis dataKey="label" tickLine={false} axisLine={{ className: "stroke-line" }} tick={{ className: "fill-ink-faint text-[11px]" }} />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              cursor={{ fillOpacity: 0.06 }}
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 12, color: "var(--color-ink)" }}
              formatter={(value, name) => [value, name === "fresh" ? t("New answer") : t("Reused for another buyer")]}
            />
            <Bar dataKey="fresh" stackId="week" maxBarSize={64} className="[&_.recharts-rectangle]:fill-brand" isAnimationActive={false}>
              <LabelList dataKey="onFresh" position="top" fill="var(--color-ink-muted)" className="text-[11px] [font-variant-numeric:tabular-nums]" />
            </Bar>
            <Bar dataKey="reused" stackId="week" maxBarSize={64} fill="url(#reuse-hatch)" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="onReused" position="top" fill="var(--color-ink-muted)" className="text-[11px] [font-variant-numeric:tabular-nums]" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{t("Answers sent each week")}</caption>
        <thead><tr><th>{t("Week of")}</th><th>{t("New answer")}</th><th>{t("Reused for another buyer")}</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.week}><td>{label(r.week)}</td><td>{r.fresh}</td><td>{r.reused}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
