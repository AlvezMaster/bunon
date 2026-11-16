"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, RefreshCw, Send, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { OrgAvatar, orgName, useQuestionnaires } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

/** Short, common social-audit questions a buyer can add with one tap. */
const COMMON = [
  "Does the factory hold a valid fire licence?",
  "When was the last fire evacuation drill held?",
  "Are all workers paid at least the legal minimum wage?",
  "Is overtime voluntary?",
  "Does the factory employ anyone under the age of 18?",
  "Can workers raise grievances anonymously?",
  "Has an independent building safety assessment been completed?",
  "How many workers does the factory employ?",
];

const FIELD =
  "w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]";

/** Buyer: write a questionnaire once and send it to one or more linked factories. */
export default function NewQuestionnaire() {
  const router = useRouter();
  const { data, error } = useQuestionnaires();
  const factories = data?.factories ?? [];
  const [title, setTitle] = useState("Supplier questionnaire");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [dueOn, setDueOn] = useState(() => new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Every linked factory is ticked to start with.
  useEffect(() => {
    if (data && chosen === null) setChosen(factories.map((f) => f.id));
  }, [data, chosen, factories]);
  const selected = chosen ?? [];
  const filled = questions.map((q) => q.trim()).filter(Boolean);

  const toggle = (id: string) => setChosen((c) => ((c ?? []).includes(id) ? (c ?? []).filter((x) => x !== id) : [...(c ?? []), id]));
  const setQ = (i: number, v: string) => setQuestions((qs) => qs.map((q, j) => (j === i ? v : q)));
  const addQ = (text = "") =>
    setQuestions((qs) => {
      if (text && qs.includes(text)) return qs;
      const blank = qs.findIndex((q) => !q.trim());
      return text && blank >= 0 ? qs.map((q, j) => (j === blank ? text : q)) : [...qs, text];
    });
  const removeQ = (i: number) => setQuestions((qs) => (qs.length === 1 ? [""] : qs.filter((_, j) => j !== i)));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selected.length) return setFormError(t("Choose at least one factory."));
    if (!filled.length) return setFormError(t("Add at least one question."));
    if (filled.some((q) => q.length < 8)) return setFormError(t("Each question needs 8 to 300 characters."));
    setBusy(true);
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title, dueOn, questions: filled, factoryOrgIds: selected }),
      });
      const json = (await res.json()) as { error?: string; groupId?: string };
      if (!res.ok || !json.groupId) throw new Error(json.error ?? `HTTP ${res.status}`);
      router.push(`/buyer/questions/${json.groupId}`);
    } catch (err) {
      setFormError(t(err instanceof Error ? err.message : "Sending failed."));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6 sm:px-6">
        <Link href="/buyer/questions" className="flex h-11 w-fit items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("All questionnaires")}
        </Link>
        <div className="space-y-1">
          <p className="section-index">{t("Questions")}</p>
          <h1 className="font-display text-[clamp(1.85rem,3vw+0.5rem,2.5rem)] font-semibold leading-tight tracking-tight text-ink">{t("New questionnaire")}</h1>
          <p className="text-ink-muted">{t("Each factory gets its own copy and answers from its own documents. You see every answer side by side.")}</p>
        </div>
        {error && <p role="alert" className="text-danger">{error}</p>}

        <form onSubmit={send} className="flex flex-col gap-6" noValidate>
          <section className="glass-card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="to-title">
            <h2 id="to-title" className="text-lg font-semibold text-ink">
              1. {t("Send to")}
            </h2>
            {data && factories.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {t("You aren't linked to any factory yet.")}{" "}
                <Link href="/buyer/factories" className="font-semibold text-brand underline underline-offset-4">
                  {t("Your factories")}
                </Link>
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {factories.map((f) => {
                  const on = selected.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className={`glass-card tile-link !min-h-0 !flex-row items-center !gap-3 !p-3 ${on ? "!border-brand ring-2 ring-brand/40" : ""}`}
                    >
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(f.id)} />
                      <OrgAvatar name={f.name} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{orgName(f.name)}</span>
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${on ? "border-brand bg-brand text-white dark:text-canvas" : "border-line-strong"}`}
                      >
                        {on && <Check className="h-4 w-4" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="glass-card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="q-title">
            <h2 id="q-title" className="text-lg font-semibold text-ink">
              2. {t("Questions")}
            </h2>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">{t("Title")}</span>
              <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
            </label>
            <ol className="flex flex-col gap-2">
              {questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-3 w-6 shrink-0 text-right text-sm tabular-nums text-ink-faint">{i + 1}.</span>
                  <textarea
                    value={q}
                    rows={1}
                    maxLength={300}
                    onChange={(e) => setQ(i, e.target.value)}
                    aria-label={`${t("Question")} ${i + 1}`}
                    placeholder={t("Type a question")}
                    className={`${FIELD} min-h-[48px] resize-y`}
                  />
                  <button
                    type="button"
                    onClick={() => removeQ(i)}
                    aria-label={`${t("Remove question")} ${i + 1}`}
                    className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-ink/[0.06] hover:text-danger"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => addQ()} className="btn-tactile-hollow inline-flex min-h-[44px] w-fit items-center gap-2 px-4 text-sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("Add a question")}
            </button>
            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-sm font-medium text-ink-muted">{t("Common questions: tap to add")}</p>
              <div className="flex flex-wrap gap-2">
                {COMMON.map((c) => {
                  const added = questions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={added}
                      onClick={() => addQ(c)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-surface-2/60 px-3 text-left text-sm text-ink transition-[background-color,border-color] duration-150 hover:border-brand hover:bg-brand-soft/50 disabled:cursor-default disabled:opacity-50"
                    >
                      {added ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      {t(c)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="glass-card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="due-title">
            <h2 id="due-title" className="text-lg font-semibold text-ink">
              3. {t("Due date")}
            </h2>
            <input type="date" value={dueOn} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDueOn(e.target.value)} className={`${FIELD} w-fit`} />
          </section>

          {formError && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              {formError}
            </p>
          )}

          {/* Always-visible summary and send button */}
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 p-3 pl-5 shadow-[var(--shadow-raised)] backdrop-blur-md">
            <p className="text-sm text-ink-muted">
              <strong className="tabular-nums text-ink">{filled.length}</strong> {t(filled.length === 1 ? "question" : "questions")} →{" "}
              <strong className="tabular-nums text-ink">{selected.length}</strong> {t(selected.length === 1 ? "factory" : "factories")}
            </p>
            <button type="submit" disabled={busy || !selected.length || !filled.length} className="btn-primary-action min-h-[48px]">
              {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {t("Send questionnaire")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
