"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Info, PenLine, RefreshCw, Send, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  QuestionHead,
  QuestionnaireHeader,
  SentAnswer,
  Tabs,
  orgName,
  useQuestionnaires,
  type Approved,
} from "@/components/questions/shared";
import type { QuestionDraft } from "@/lib/questionnaire";
import { t } from "@/lib/i18n";

const CATEGORY_LABEL: Record<string, string> = {
  document_fact: "Fact from a document",
  policy_exists: "Policy on file",
  calculation: "Needs a calculation",
  needs_person: "Needs a person",
};

function answerText(d: QuestionDraft): string {
  if (d.answer === "yes") return d.value ? `Yes: ${d.value}` : "Yes";
  if (d.answer === "no") return d.value ? `No: ${d.value}` : "No";
  if (d.answer === "value") return d.value;
  return "";
}

/** Factory: answer one buyer's questionnaire. AI drafts from your documents; you edit and send. */
export default function FactoryQuestionnaire() {
  const { id } = useParams<{ id: string }>();
  const { data, setData, error } = useQuestionnaires();
  const [tab, setTab] = useState<"todo" | "sent">("todo");
  const [drafts, setDrafts] = useState<Record<string, QuestionDraft>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, "drafting" | "sending" | undefined>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  const q = data?.questionnaires.find((x) => x.id === id);
  const docOf = (docId: string | null) => data?.documents.find((d) => d.id === docId);
  const buyer = q ? orgName(q.buyer) : "";
  const ai = !!data?.model;
  const closed = q?.linkState === "closed";

  const draft = async (qid: string) => {
    setBusy((b) => ({ ...b, [qid]: "drafting" }));
    setRowError((e) => ({ ...e, [qid]: "" }));
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft", questionId: qid }),
      });
      const json = (await res.json()) as { draft?: QuestionDraft; error?: string };
      if (!res.ok || !json.draft) throw new Error(json.error ?? `HTTP ${res.status}`);
      setDrafts((d) => ({ ...d, [qid]: json.draft! }));
      setEdits((e) => ({ ...e, [qid]: answerText(json.draft!) }));
    } catch (e) {
      setRowError((r) => ({ ...r, [qid]: e instanceof Error ? e.message : t("Drafting failed.") }));
    } finally {
      setBusy((b) => ({ ...b, [qid]: undefined }));
    }
  };

  const draftAll = async () => {
    if (!q || !data) return;
    const todo = q.questions.filter((x) => !data.answers[x.id] && edits[x.id] === undefined);
    setBulk({ done: 0, total: todo.length });
    for (let i = 0; i < todo.length; i++) {
      await draft(todo[i].id);
      setBulk({ done: i + 1, total: todo.length });
    }
    setBulk(null);
  };

  const send = async (qid: string) => {
    const d = drafts[qid];
    const text = (edits[qid] ?? "").trim();
    if (!text) {
      setRowError((r) => ({ ...r, [qid]: t("Write an answer first.") }));
      return;
    }
    const cited = d && d.status === "draft";
    setBusy((b) => ({ ...b, [qid]: "sending" }));
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          questionId: qid,
          answer: text,
          quote: cited ? d.quote : "",
          docId: cited ? d.docId : null,
          aiDrafted: !!cited && text === answerText(d),
        }),
      });
      const json = (await res.json()) as { approved?: Approved; error?: string };
      if (!res.ok || !json.approved) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData((prev) => (prev ? { ...prev, answers: { ...prev.answers, [qid]: json.approved! } } : prev));
    } catch (e) {
      setRowError((r) => ({ ...r, [qid]: e instanceof Error ? e.message : t("Sending failed.") }));
    } finally {
      setBusy((b) => ({ ...b, [qid]: undefined }));
    }
  };

  const numbered = q?.questions.map((x, i) => ({ ...x, n: i + 1 })) ?? [];
  const todo = numbered.filter((x) => !data?.answers[x.id]);
  const sent = numbered.filter((x) => data?.answers[x.id]);
  const shown = tab === "todo" ? todo : sent;

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-6 sm:px-6">
        {error && <p role="alert" className="text-danger">{error}</p>}
        {data && !q && <p className="text-ink-muted">{t("This questionnaire was not found.")}</p>}
        {data && q && (
          <>
            <QuestionnaireHeader q={q} data={data} back="/factory/questionnaire">
              {!closed && (
              <button type="button" onClick={() => void draftAll()} disabled={!!bulk || todo.length === 0} className="btn-primary-action">
                {bulk ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    {t("Drafting")} {Math.min(bulk.done + 1, bulk.total)}/{bulk.total}…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {ai ? t("Draft all with AI") : t("Suggest all from documents")}
                  </>
                )}
              </button>
              )}
            </QuestionnaireHeader>

            {closed ? (
              <p role="status" className="flex items-start gap-2 rounded-lg border border-line bg-surface-2/70 px-4 py-3 text-sm text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {t("You are no longer linked with")} {buyer}. {t("These answers are read-only. Download them from the Buyers page while the 30-day window lasts.")}
                </span>
              </p>
            ) : ai && (data.model ?? "").startsWith("@cf/") ? (
              <p role="note" className="flex items-start gap-2 rounded-lg border border-line bg-surface-2/70 px-4 py-3 text-sm text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span>
                  <strong className="text-ink">{t("Online demo: cloud AI on fictional documents.")}</strong>{" "}
                  {t("Drafts come from Qwen on Cloudflare Workers AI, which does not train on what it is sent. Real factories run Qwen on their own computer. Nothing reaches")}{" "}
                  {buyer} {t("until you press Send.")}
                </span>
              </p>
            ) : ai ? (
              <p className="-mt-2 max-w-[65ch] text-sm text-ink-muted">
                {`${t("AI drafts each answer from your documents and quotes the sentence it used. Nothing reaches")} ${buyer} ${t("until you press Send.")}`}
              </p>
            ) : (
              <p role="note" className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  <strong className="text-ink">{t("Online demo: no AI here.")}</strong>{" "}
                  {t("Bunon's AI model runs on the factory's own computer. On this website, rules find the matching sentence in your documents instead. Nothing reaches")}{" "}
                  {buyer} {t("until you press Send.")}
                </span>
              </p>
            )}

            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: "todo", label: t("To answer"), count: todo.length },
                { id: "sent", label: t("Sent"), count: sent.length },
              ]}
            />

            {shown.length === 0 && (
              <p className="glass-card p-6 text-ink-muted">
                {tab === "todo" ? `${t("All questions are answered and sent to")} ${buyer}.` : t("Nothing sent yet.")}
              </p>
            )}

            <ol className="flex flex-col gap-4">
              {shown.map((x) => {
                const approved = data.answers[x.id];
                const d = drafts[x.id];
                const state = busy[x.id];
                const editing = edits[x.id] !== undefined;
                const doc = d?.status === "draft" ? docOf(d.docId) : undefined;
                const hint = d && d.status !== "draft" ? d.evidence[0] : undefined;
                return (
                  <li key={x.id} className="glass-card flex flex-col gap-4 p-5 sm:p-6">
                    <QuestionHead n={x.n} text={x.text} byline={`${buyer} ${t("asks")}`} added={x.added} />

                    {approved ? (
                      <SentAnswer a={approved} doc={docOf(approved.docId)} />
                    ) : closed ? (
                      <p className="text-sm text-ink-faint">{t("Not answered before the unlink.")}</p>
                    ) : !editing && !d ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void draft(x.id)}
                          disabled={!!state || !!bulk}
                          className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm"
                        >
                          {state === "drafting" ? (
                            <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                          ) : (
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                          )}
                          {state === "drafting" ? t("Drafting…") : ai ? t("Draft with AI") : t("Suggest from documents")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEdits((e) => ({ ...e, [x.id]: "" }))}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-medium text-ink-muted hover:text-ink"
                        >
                          <PenLine className="h-4 w-4" aria-hidden="true" />
                          {t("Write it myself")}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {d?.status === "draft" && (
                          <div className="space-y-2">
                            <blockquote className="border-l-2 border-success pl-3 text-sm italic text-ink-muted">“{d.quote}”</blockquote>
                            {doc && (
                              <p className="flex items-center gap-1.5 text-sm text-ink-faint">
                                <FileText className="h-4 w-4" aria-hidden="true" />
                                {t("From")} {t(doc.title)}
                              </p>
                            )}
                          </div>
                        )}
                        {d && d.status !== "draft" && (
                          <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-ink-muted">
                            <p className="font-semibold text-warning">{t("Please answer this one yourself.")}</p>
                            <p>{t(d.reason)}</p>
                            {hint && (
                              <p className="mt-1">
                                {t("Most relevant document")}: <strong>{t(docOf(hint.docId)?.title ?? "")}</strong>
                              </p>
                            )}
                          </div>
                        )}
                        <label className="block space-y-1.5">
                          <span className="text-sm font-medium text-ink">
                            {t("Your answer to")} {buyer}
                          </span>
                          <textarea
                            value={edits[x.id] ?? ""}
                            onChange={(e) => setEdits((v) => ({ ...v, [x.id]: e.target.value }))}
                            rows={2}
                            placeholder={t("Write the answer the buyer will see")}
                            className="w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]"
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => void send(x.id)} disabled={!!state} className="btn-primary-action min-h-[44px]">
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {state === "sending" ? t("Sending…") : `${t("Send to")} ${buyer}`}
                          </button>
                          <button
                            type="button"
                            onClick={() => void draft(x.id)}
                            disabled={!!state}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-medium text-ink-muted hover:text-ink"
                          >
                            <RefreshCw className={`h-4 w-4 ${state === "drafting" ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                            {d ? t("Draft again") : ai ? t("Draft with AI") : t("Suggest from documents")}
                          </button>
                        </div>
                        {d && (
                          <details className="text-xs text-ink-muted">
                            <summary className="flex min-h-[44px] cursor-pointer items-center">{t("Technical details")}</summary>
                            <p className="font-mono">
                              {d.engine} · {d.durationMs} ms · AI: {CATEGORY_LABEL[d.category]} · {t("decision model")}: {CATEGORY_LABEL[d.decision.category]} (
                              {Math.round(d.decision.probability * 100)}%) · {Math.round(d.confidence * 100)}% {t("confidence")}
                            </p>
                          </details>
                        )}
                      </div>
                    )}
                    {rowError[x.id] && (
                      <p role="alert" className="text-sm text-danger">
                        {rowError[x.id]}
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
