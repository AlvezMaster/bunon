"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Link2 } from "lucide-react";
import { useBunonStore } from "@/lib/store";
import { orgName } from "@/lib/questionnaire";
import { t } from "@/lib/i18n";

export interface Doc {
  id: string;
  title: string;
  fileName: string;
  text?: string;
}
export interface Approved {
  questionId: string;
  answer: string;
  quote: string;
  docId: string | null;
  approvedBy: string;
  approvedAt?: string;
  ledgerBlock: number | null;
  aiDrafted: boolean;
}
export interface Question {
  id: string;
  text: string;
  /** Set when the buyer added the question after sending the questionnaire. */
  added: string | null;
}
export interface Questionnaire {
  id: string;
  buyer: string;
  factory: string;
  title: string;
  sentOn: string;
  dueOn: string;
  questions: Question[];
  /** "open": answers and new questions allowed; "paused": unlink pending; "closed": unlinked, read-only. */
  linkState?: "open" | "paused" | "closed";
}
export interface Payload {
  role: "factory" | "buyer";
  questionnaires: Questionnaire[];
  documents: Doc[];
  answers: Record<string, Approved>;
  model: string | null;
}

export { orgName };

/** Loads the questionnaires this account may see. */
export function useQuestionnaires() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/questionnaire", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Could not load the questions."));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { data, setData, error, reload: load };
}

export function useDay() {
  const lang = useBunonStore((s) => s.lang);
  return (iso: string) => new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short" });
}

export function answeredCount(q: Questionnaire, answers: Record<string, Approved>) {
  return q.questions.filter((x) => answers[x.id]).length;
}

/** A thin progress bar with the count beside it. */
export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={t("Answered")}
      >
        <div className="h-full rounded-full bg-success transition-transform duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-sm tabular-nums text-ink-muted">
        {done} {t("of")} {total} {t("answered")}
      </span>
    </div>
  );
}

/** Round initial badge for a company. */
export function OrgAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-display text-lg font-semibold text-ink"
    >
      {orgName(name).charAt(0)}
    </span>
  );
}

/** The list of questionnaires on the overview pages (factory inbox, buyer "sent" list). */
export function QuestionnaireList({ data, hrefBase }: { data: Payload; hrefBase: string }) {
  const day = useDay();
  if (data.questionnaires.length === 0) {
    return <p className="glass-card p-6 text-ink-muted">{t("No questionnaires yet.")}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {data.questionnaires.map((q) => {
        const other = data.role === "factory" ? q.buyer : q.factory;
        const done = answeredCount(q, data.answers);
        const total = q.questions.length;
        const status = done === total ? t("All answered") : done === 0 ? t("New") : t("In progress");
        return (
          <li key={q.id}>
            <Link
              href={`${hrefBase}/${q.id}`}
              className="glass-card group flex flex-col gap-4 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] sm:flex-row sm:items-center"
            >
              <OrgAvatar name={other} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm text-ink-muted">
                  {data.role === "factory" ? t("From") : t("To")} <strong className="font-semibold text-ink">{orgName(other)}</strong>
                </p>
                <p className="font-display text-xl font-semibold tracking-tight text-ink">{t(q.title)}</p>
                <p className="text-sm text-ink-faint">
                  {t("Sent")} {day(q.sentOn)} · {t("Due")} {day(q.dueOn)} · {total} {t("questions")}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">{status}</span>
                <Progress done={done} total={total} />
              </div>
              <ArrowRight className="hidden h-5 w-5 text-ink-faint transition-transform duration-200 group-hover:translate-x-1 sm:block" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Two-way tab switch used on both detail pages. */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: Array<{ id: T; label: string; count: number }> }) {
  return (
    <div role="tablist" className="flex w-fit gap-1 rounded-full border border-line bg-surface-2/70 p-1">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color] duration-200 ${
            value === it.id ? "bg-[var(--color-ink)] text-canvas" : "text-ink-muted hover:text-ink"
          }`}
        >
          {it.label}
          <span className="tabular-nums opacity-70">{it.count}</span>
        </button>
      ))}
    </div>
  );
}

/** The question itself, shown big, with a short line saying who asked it. */
export function QuestionHead({ n, text, byline, added }: { n: number; text: string; byline: string; added: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
        {t("Question")} {n} · {byline}
        {added ? ` · ${t("added later")}` : ""}
      </p>
      <p className="max-w-[65ch] font-display text-lg font-semibold leading-snug text-ink [text-wrap:pretty]">{text}</p>
    </div>
  );
}

/** Header shared by both detail pages: who it is with, the title, dates and progress. */
export function QuestionnaireHeader({ q, data, back, children }: { q: Questionnaire; data: Payload; back: string; children?: React.ReactNode }) {
  const day = useDay();
  const other = data.role === "factory" ? q.buyer : q.factory;
  return (
    <header className="flex flex-col gap-5">
      <Link href={back} className="flex h-11 w-fit items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
        {data.role === "factory" ? t("All buyer questions") : t("All questionnaires")}
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <OrgAvatar name={other} />
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">
              {data.role === "factory" ? t("From") : t("To")} <strong className="font-semibold text-ink">{orgName(other)}</strong>
            </p>
            <h1 className="font-display text-[clamp(1.85rem,3vw+0.5rem,2.5rem)] font-semibold leading-tight tracking-tight text-ink [text-wrap:balance]">
              {t(q.title)}
            </h1>
            <p className="text-sm text-ink-faint">
              {t("Sent")} {day(q.sentOn)} · {t("Due")} {day(q.dueOn)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Progress done={answeredCount(q, data.answers)} total={q.questions.length} />
          {children}
        </div>
      </div>
    </header>
  );
}

/** A sent answer: what the factory said, the sentence it rests on, and where that sentence lives. */
export function SentAnswer({ a, doc }: { a: Approved; doc?: Doc }) {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-2/50 p-4">
      <p className="text-base text-ink">{a.answer}</p>
      {a.quote && <blockquote className="border-l-2 border-success pl-3 text-sm italic text-ink-muted">“{a.quote}”</blockquote>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-faint">
        {doc ? (
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {t(doc.title)}
          </span>
        ) : (
          <span>{t("Written by")} {a.approvedBy}</span>
        )}
        {a.ledgerBlock != null && (
          <Link href="/ledger" className="flex items-center gap-1.5 underline decoration-line-strong underline-offset-4 hover:text-ink">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {t("Sealed in ledger block")} #{a.ledgerBlock}
          </Link>
        )}
      </div>
    </div>
  );
}
