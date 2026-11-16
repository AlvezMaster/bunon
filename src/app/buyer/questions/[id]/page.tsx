"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Clock, RefreshCw, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { QuestionHead, QuestionnaireHeader, SentAnswer, Tabs, orgName, useQuestionnaires } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

/** Buyer: one questionnaire sent to one factory. See answers with their sources, or ask another question. */
export default function BuyerQuestionnaire() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useQuestionnaires();
  const [tab, setTab] = useState<"answered" | "waiting">("answered");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askedOk, setAskedOk] = useState(false);

  const q = data?.questionnaires.find((x) => x.id === id);
  const docOf = (docId: string | null) => data?.documents.find((d) => d.id === docId);
  const factory = q ? orgName(q.factory) : "";

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    setAskError(null);
    setAskedOk(false);
    setSending(true);
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", questionnaireId: id, text }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setText("");
      setAskedOk(true);
      setTab("waiting");
      await reload();
    } catch (err) {
      setAskError(err instanceof Error ? t(err.message) : t("Sending failed."));
    } finally {
      setSending(false);
    }
  };

  const numbered = q?.questions.map((x, i) => ({ ...x, n: i + 1 })) ?? [];
  const answered = numbered.filter((x) => data?.answers[x.id]);
  const waiting = numbered.filter((x) => !data?.answers[x.id]);
  const shown = tab === "answered" ? answered : waiting;

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-6 sm:px-6">
        {error && <p role="alert" className="text-danger">{error}</p>}
        {data && !q && <p className="text-ink-muted">{t("This questionnaire was not found.")}</p>}
        {data && q && (
          <>
            <QuestionnaireHeader q={q} data={data} back="/buyer/questions" />

            <form onSubmit={ask} className="glass-card flex flex-col gap-3 p-5 sm:p-6" noValidate>
              <label htmlFor="ask" className="font-display text-lg font-semibold text-ink">
                {t("Ask")} {factory} {t("a new question")}
              </label>
              <textarea
                id="ask"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={t("For example: Is overtime always voluntary?")}
                aria-describedby="ask-hint"
                className="w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p id="ask-hint" className="text-sm text-ink-faint">
                  {t("The factory answers from its documents. You see the sentence each answer rests on.")}
                </p>
                <button type="submit" disabled={sending || text.trim().length < 8} className="btn-primary-action min-h-[44px]">
                  {sending ? (
                    <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {sending ? t("Sending…") : t("Send question")}
                </button>
              </div>
              {askError && (
                <p role="alert" className="text-sm text-danger">
                  {askError}
                </p>
              )}
              {askedOk && (
                <p role="status" className="text-sm text-success">
                  {t("Sent. It now waits in")} {factory}{t("'s inbox.")}
                </p>
              )}
            </form>

            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: "answered", label: t("Answered"), count: answered.length },
                { id: "waiting", label: t("Waiting"), count: waiting.length },
              ]}
            />

            {shown.length === 0 && (
              <p className="glass-card p-6 text-ink-muted">
                {tab === "answered" ? `${factory} ${t("has not sent any answers yet.")}` : t("Every question has an answer.")}
              </p>
            )}

            <ol className="flex flex-col gap-4">
              {shown.map((x) => {
                const a = data.answers[x.id];
                return (
                  <li key={x.id} className="glass-card flex flex-col gap-4 p-5 sm:p-6">
                    <QuestionHead n={x.n} text={x.text} byline={t("Your question")} added={x.added} />
                    {a ? (
                      <SentAnswer a={a} doc={docOf(a.docId)} />
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-ink-muted">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {t("Waiting for")} {factory} {t("to answer")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
