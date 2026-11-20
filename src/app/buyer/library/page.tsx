"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, FileText, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires, type Payload } from "@/components/questions/shared";
import { checklist } from "@/lib/document-library";
import { t } from "@/lib/i18n";

interface Cited {
  title: string;
  answers: number;
  last: string | null;
  questions: string[];
}

/** Per factory: the documents its answers to this buyer rest on (titles only; files stay with the factory). */
function byFactory(data: Payload) {
  const out = new Map<string, Map<string, Cited>>();
  for (const q of data.questionnaires) {
    const docs = out.get(q.factory) ?? new Map<string, Cited>();
    for (const x of q.questions) {
      const a = data.answers[x.id];
      if (!a?.docTitle) continue;
      const c = docs.get(a.docTitle) ?? { title: a.docTitle, answers: 0, last: null, questions: [] };
      c.answers++;
      if (a.approvedAt && (!c.last || a.approvedAt > c.last)) c.last = a.approvedAt;
      if (c.questions.length < 3) c.questions.push(x.text);
      docs.set(a.docTitle, c);
    }
    out.set(q.factory, docs);
  }
  return [...out.entries()].map(([factory, docs]) => ({ factory, docs: [...docs.values()].sort((a, b) => b.answers - a.answers) }));
}

/**
 * Buyer document library: for each linked factory, the documents its answers rest on, and which of the documents
 * buyers usually ask for those answers already cite. Factories keep their files private; a buyer sees titles.
 */
export default function BuyerLibraryPage() {
  const { data, error } = useQuestionnaires();
  const groups = data ? byFactory(data) : [];
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Document library" title="The documents behind your factories' answers" note={t("For each factory, every document its answers to you rest on, and which documents buyers usually ask for are already covered.")}>
          <DemoDataBadge />
        </DashboardHeader>
        <p className="flex items-start gap-2 rounded-lg border border-line bg-surface/70 p-3 text-sm text-ink-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          {t("Factories keep their files private in Bunon. You see each document's title and the exact sentence an answer quotes from it, on the questionnaire page.")}
        </p>
        {error && <p role="alert" className="text-danger">{error}</p>}
        {!data && !error && <p className="text-ink-muted">{t("Loading…")}</p>}

        {groups.map(({ factory, docs }) => {
          const covered = checklist(docs.map((d, i) => ({ id: String(i), title: d.title, fileName: "" })));
          return (
            <section key={factory} aria-label={factory} className="glass-card flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-ink">{factory}</h2>
                <span className="text-sm text-ink-muted [font-variant-numeric:tabular-nums]">{docs.length} {t(docs.length === 1 ? "document cited" : "documents cited")}</span>
              </div>
              {docs.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("No answers with a source yet.")} <Link href="/buyer/questions" className="font-medium text-brand underline underline-offset-4">{t("Open your questions")}</Link></p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {docs.map((d) => (
                    <li key={d.title} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2 text-sm font-medium text-ink"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />{d.title}</span>
                        <span className="block pl-6 text-xs text-ink-faint">{d.questions.join(" · ")}</span>
                      </span>
                      <span className="text-sm text-ink-muted [font-variant-numeric:tabular-nums]">{d.answers} {t(d.answers === 1 ? "answer" : "answers")}{d.last ? ` · ${new Date(d.last).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">{t("What buyers usually ask for, covered by these answers")}</p>
                <ul className="flex flex-wrap gap-2">
                  {covered.map((c) => (
                    <li key={c.doc.key} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${c.status === "missing" ? "border-line text-ink-faint" : "border-success/40 bg-success-soft text-success"}`}>
                      {c.status === "missing" ? <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>{t(c.doc.name)}</span>
                      <span className="sr-only">{c.status === "missing" ? t("not covered yet") : t("covered")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
        {data && groups.length === 0 && <p className="text-ink-muted">{t("No questionnaires yet.")}</p>}
      </main>
    </div>
  );
}
