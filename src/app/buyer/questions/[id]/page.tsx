"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CircleCheck, Clock, MessageSquarePlus, RefreshCw, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { OrgAvatar, SentAnswer, Tabs, answeredCount, groupQuestionnaires, orgName, useDay, useQuestionnaires, type Questionnaire } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

type Filter = "all" | "answered" | "waiting";

/**
 * Buyer: one questionnaire and every factory it went to. Each question appears once, with each
 * factory's answer underneath, so answers can be compared side by side.
 */
export default function BuyerQuestionnaire() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useQuestionnaires();
  const day = useDay();
  const [only, setOnly] = useState<string | null>(null); // a factory's copy id, or null for all
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askedOk, setAskedOk] = useState<number | null>(null);

  // Old links pointed at one factory's copy; find its questionnaire either way.
  const group = useMemo(() => {
    if (!data) return null;
    const groups = groupQuestionnaires(data.questionnaires);
    return groups.find((g) => g.groupId === id) ?? groups.find((g) => g.copies.some((c) => c.id === id)) ?? null;
  }, [data, id]);

  const docOf = (docId: string | null) => data?.documents.find((d) => d.id === docId);
  const copies = group ? group.copies.filter((c) => !only || c.id === only) : [];
  const answerOf = (c: Questionnaire, ref: string) => {
    const q = c.questions.find((x) => x.ref === ref);
    return q ? { q, a: data?.answers[q.id] } : null;
  };
  const openCopies = group?.copies.filter((c) => (c.linkState ?? "open") === "open") ?? [];

  const rows = (group?.rows ?? []).map((r, i) => {
    const cells = copies.map((c) => ({ c, cell: answerOf(c, r.ref) })).filter((x) => x.cell);
    const answered = cells.filter((x) => x.cell?.a).length;
    return { ...r, n: i + 1, cells, answered, waiting: cells.length - answered };
  });
  const shown = rows.filter((r) => (filter === "answered" ? r.answered > 0 : filter === "waiting" ? r.waiting > 0 : true));

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    setAskError(null);
    setAskedOk(null);
    setSending(true);
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", groupId: group.groupId, text }),
      });
      const json = (await res.json()) as { error?: string; sentTo?: number };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setText("");
      setAskedOk(json.sentTo ?? 1);
      setAsking(false);
      setFilter("waiting");
      await reload();
    } catch (err) {
      setAskError(err instanceof Error ? t(err.message) : t("Sending failed."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-6 sm:px-6">
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {data && !group && <p className="text-ink-muted">{t("This questionnaire was not found.")}</p>}
        {!data && !error && <p className="text-ink-muted">{t("Loading…")}</p>}

        {data && group && (
          <>
            <header className="space-y-3">
              <Link href="/buyer/questions" className="flex h-11 w-fit items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("All questionnaires")}
              </Link>
              <p className="section-index">{t("Questionnaire")}</p>
              <h1 className="font-display text-[clamp(1.85rem,3vw+0.5rem,2.5rem)] font-semibold leading-tight tracking-tight text-ink [text-wrap:balance]">
                {t(group.title)}
              </h1>
              <p className="text-sm text-ink-faint">
                {t("Sent")} {day(group.sentOn)} · {t("Due")} {day(group.dueOn)} · {group.rows.length} {t("questions")}
              </p>
            </header>

            {/* Who it went to: each card filters the answers to that factory. */}
            <section aria-label={t("Factories")} className="flex flex-col gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {group.copies.map((c) => {
                  const n = answeredCount(c, data.answers);
                  const pct = c.questions.length ? Math.round((n / c.questions.length) * 100) : 0;
                  const selected = only === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setOnly(selected ? null : c.id)}
                      className={`glass-card tile-link !min-h-0 !flex-row items-center !gap-3 !p-3 text-left ${selected ? "!border-brand ring-2 ring-brand/40" : ""}`}
                    >
                      <OrgAvatar name={c.factory} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{orgName(c.factory)}</span>
                          {c.linkState && c.linkState !== "open" && (
                            <span className="shrink-0 rounded-full bg-ink/[0.07] px-2 py-0.5 text-[0.75rem] font-medium text-ink-muted">
                              {c.linkState === "paused" ? t("Unlinking") : t("Unlinked")}
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                            <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="text-xs tabular-nums text-ink-muted">
                            {n}/{c.questions.length} {t("answered")}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {only && (
                <button type="button" onClick={() => setOnly(null)} className="w-fit min-h-[44px] rounded-lg px-2 text-sm font-semibold text-brand hover:underline">
                  {t("Show all factories")}
                </button>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs
                value={filter}
                onChange={setFilter}
                items={[
                  { id: "all", label: t("All"), count: rows.length },
                  { id: "answered", label: t("Answered"), count: rows.filter((r) => r.answered > 0).length },
                  { id: "waiting", label: t("Waiting"), count: rows.filter((r) => r.waiting > 0).length },
                ]}
              />
              {openCopies.length > 0 && !asking && (
                <button type="button" onClick={() => setAsking(true)} className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
                  <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                  {t("Ask a new question")}
                </button>
              )}
            </div>

            {asking && (
              <form onSubmit={ask} className="glass-card flex flex-col gap-3 p-5" noValidate>
                <label htmlFor="ask" className="font-semibold text-ink">
                  {t("New question for")} {openCopies.map((c) => orgName(c.factory)).join(", ")}
                </label>
                <textarea
                  id="ask"
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder={t("For example: Is overtime always voluntary?")}
                  className="w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]"
                />
                {askError && (
                  <p role="alert" className="text-sm text-danger">
                    {askError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={sending || text.trim().length < 8} className="btn-primary-action min-h-[44px]">
                    {sending ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                    {t("Send question")}
                  </button>
                  <button type="button" onClick={() => setAsking(false)} className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-ink-muted hover:text-ink">
                    {t("Cancel")}
                  </button>
                </div>
              </form>
            )}
            {askedOk !== null && (
              <p role="status" className="text-sm text-success">
                {t("Sent to")} {askedOk} {t(askedOk === 1 ? "factory" : "factories")}.
              </p>
            )}

            {shown.length === 0 && <p className="glass-card p-6 text-ink-muted">{filter === "answered" ? t("No answers yet.") : t("Every question has an answer.")}</p>}

            <ol className="flex flex-col gap-4">
              {shown.map((r) => (
                <li key={r.ref} className="glass-card flex flex-col gap-3 p-5 sm:p-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
                      {t("Question")} {r.n}
                      {r.added ? ` · ${t("added later")}` : ""}
                    </p>
                    <p className="max-w-[65ch] font-display text-lg font-semibold leading-snug text-ink [text-wrap:pretty]">{r.text}</p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {r.cells.map(({ c, cell }) => {
                      const a = cell?.a;
                      const key = `${r.ref}:${c.id}`;
                      const expanded = copies.length === 1 || !!open[key];
                      return (
                        <li key={c.id} className="rounded-lg border border-line bg-surface-2/40">
                          <button
                            type="button"
                            aria-expanded={expanded}
                            disabled={!a}
                            onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                            className="row-link !m-0 !w-full !min-h-[52px] gap-3 px-3 py-2 disabled:cursor-default"
                          >
                            <span className="text-sm font-semibold text-ink">{orgName(c.factory)}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">{a && !expanded ? a.answer : ""}</span>
                            {a ? (
                              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                                <CircleCheck className="h-4 w-4" aria-hidden="true" />
                                {t("Answered")}
                              </span>
                            ) : (
                              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-faint">
                                <Clock className="h-4 w-4" aria-hidden="true" />
                                {c.linkState === "closed" ? t("Not answered") : t("Waiting")}
                              </span>
                            )}
                          </button>
                          {a && expanded && (
                            <div className="px-3 pb-3">
                              <SentAnswer a={a} doc={docOf(a.docId)} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
