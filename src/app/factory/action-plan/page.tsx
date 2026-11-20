"use client";

import React, { useState } from "react";
import { ArrowRight, Check, ClipboardList, FileText, RefreshCw, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires, type Payload } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

/** A labelled demo change, so the page can be tried at once. Not a real announcement. */
const DEMO = {
  rule: "Garment sector minimum wage (demo change, not a real announcement)",
  before: "The legal minimum wage for the garment sector is BDT 12,500 per month for the entry grade.",
  after: "The legal minimum wage for the garment sector is BDT 15,000 per month for the entry grade.",
};

const nums = (s: string) => (s.match(/\d[\d,]*(\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, ""));
const fmt = (n: string) => (/^\d+$/.test(n) && n.length > 3 ? Number(n).toLocaleString("en-US") : n);
const has = (text: string, n: string) => text.replace(/(\d),(?=\d)/g, "$1").includes(n);
const swap = (text: string, from: string, to: string) => text.split(fmt(from)).join(fmt(to)).split(from).join(to);

interface Plan {
  changes: Array<{ from: string; to: string | null }>;
  docs: Array<{ docId: string; title: string; passage: string; draft: string | null }>;
  answers: Array<{ id: string; question: string; buyer: string; wrong: boolean }>;
  buyers: string[];
  fixes: string[];
}

/** Regulatory diff (which values changed), then what in this factory rests on the old values. */
async function makePlan(before: string, after: string, data: Payload): Promise<Plan> {
  const a = nums(before);
  const b = nums(after);
  const gone = a.filter((n) => !b.includes(n));
  const added = b.filter((n) => !a.includes(n));
  const changes = gone.map((from, i) => ({ from, to: added[i] ?? null }));

  const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", text: before }) });
  const json = (await res.json()) as { passages?: Array<{ docId: string; title: string; text: string }>; error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  const found = json.passages ?? [];
  // Passages that state an old value; with no changed values, the closest passage to check by hand.
  const hits = changes.length ? found.filter((p) => changes.some((c) => has(p.text, c.from))) : found.slice(0, 1);
  const docs = [...new Map(hits.map((p) => [p.docId, p])).values()].map((p) => ({
    docId: p.docId,
    title: p.title,
    passage: p.text,
    draft: changes.length ? changes.reduce((txt, c) => (c.to ? swap(txt, c.from, c.to) : txt), p.text) : null,
  }));

  const ids = new Set(docs.map((d) => d.docId));
  const question = new Map(data.questionnaires.flatMap((q) => q.questions.map((x) => [x.id, { text: x.text, buyer: q.buyer }] as const)));
  const answers = Object.values(data.answers ?? {})
    .filter((x) => x.docId && ids.has(x.docId) && question.has(x.questionId))
    .map((x) => ({ id: x.questionId, question: question.get(x.questionId)!.text, buyer: question.get(x.questionId)!.buyer, wrong: changes.some((c) => has(`${x.answer} ${x.quote}`, c.from)) }));
  const buyers = [...new Set(answers.map((x) => x.buyer))];

  const fixes = [
    ...docs.map((d) => (d.draft ? `Update "${d.title}" (${changes.map((c) => `${fmt(c.from)} → ${c.to ? fmt(c.to) : "?"}`).join(", ")}) and upload the new version.` : `Check "${d.title}" against the new rule.`)),
    ...answers.map((x) => (x.wrong ? `Send a corrected answer to ${x.buyer}: "${x.question}"` : `Check the answer sent to ${x.buyer}: "${x.question}"`)),
    "Check that practice matches the new rule: payroll, records and notices on the floor.",
  ];
  return { changes, docs, answers, buyers, fixes };
}

/**
 * Compliance Action Plan: when a rule changes, Bunon compares the old and new text, finds the factory's documents
 * and sent answers that rest on the old version, drafts the updated policy text and lists the fixes. A person checks
 * every item; nothing is sent or changed automatically.
 */
export default function ActionPlanPage() {
  const { data, error } = useQuestionnaires();
  const [rule, setRule] = useState(DEMO.rule);
  const [before, setBefore] = useState(DEMO.before);
  const [after, setAfter] = useState(DEMO.after);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState("");
  const [done, setDone] = useState<Set<number>>(new Set());

  const run = async () => {
    if (!data) return;
    setBusy(true);
    setFail("");
    try {
      setPlan(await makePlan(before, after, data));
      setDone(new Set());
    } catch (e) {
      setFail(e instanceof Error ? e.message : t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-lg border border-field bg-surface/70 p-3 text-base text-ink outline-none focus:border-brand";
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Compliance Action Plan" title="A rule changed. What do we fix?" note={t("Paste the old and new wording of a law, standard or buyer code. Bunon compares them, finds what in your documents and sent answers rests on the old version, and drafts the fixes for a person to check.")}>
          <DemoDataBadge />
        </DashboardHeader>
        {error && <p role="alert" className="text-danger">{error}</p>}

        <form onSubmit={(e) => { e.preventDefault(); void run(); }} className="glass-card flex flex-col gap-4 p-5 sm:p-6">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">{t("Rule")}<input value={rule} onChange={(e) => setRule(e.target.value)} className={`${field} min-h-[48px]`} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">{t("Old wording")}<textarea rows={4} value={before} onChange={(e) => setBefore(e.target.value)} className={field} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">{t("New wording")}<textarea rows={4} value={after} onChange={(e) => setAfter(e.target.value)} className={field} /></label>
          </div>
          <p className="text-xs text-ink-faint">{t("Filled in with a demo change so you can try it. It is not a real announcement.")}</p>
          <button type="submit" disabled={busy || !data || before.trim().length < 8} className="btn-primary-action min-h-[48px] self-start">
            {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ClipboardList className="h-4 w-4" aria-hidden="true" />}
            {t("Make the action plan")}
          </button>
          {fail && <p role="alert" className="text-sm text-danger">{fail}</p>}
        </form>

        {plan && (
          <section aria-label={t("Compliance Action Plan")} className="flex flex-col gap-6" aria-live="polite">
            <div className="glass-card flex flex-col gap-2 p-5">
              <h2 className="section-index">1 · {t("What changed")}</h2>
              <p className="font-medium text-ink">{rule}</p>
              {plan.changes.length ? (
                <ul className="flex flex-wrap gap-2">{plan.changes.map((c) => <li key={c.from} className="rounded-full bg-brand-soft px-3 py-1 text-sm text-ink [font-variant-numeric:tabular-nums]">{fmt(c.from)} <ArrowRight className="inline h-3.5 w-3.5" aria-label="to" /> {c.to ? fmt(c.to) : "?"}</li>)}</ul>
              ) : <p className="text-sm text-ink-muted">{t("No changed numbers found; check the closest passage by hand.")}</p>}
            </div>

            <div className="glass-card flex flex-col gap-3 p-5">
              <h2 className="section-index">2 · {t("What it affects")}</h2>
              {plan.docs.length === 0 && <p className="text-sm text-ink-muted">{t("None of your documents states the old wording.")}</p>}
              {plan.docs.map((d) => <p key={d.docId} className="flex items-start gap-2 text-sm text-ink"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />{d.title}</p>)}
              <p className="flex items-start gap-2 text-sm text-ink-muted"><Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{plan.answers.length} {t("sent answers rest on these documents")}{plan.buyers.length ? ` · ${plan.buyers.join(", ")}` : ""}</p>
            </div>

            {plan.docs.some((d) => d.draft) && (
              <div className="glass-card flex flex-col gap-3 p-5">
                <h2 className="section-index">3 · {t("Updated policy draft")}</h2>
                {plan.docs.filter((d) => d.draft).map((d) => (
                  <div key={d.docId} className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">{d.title}</p>
                    <p className="text-sm text-ink-muted line-through decoration-danger/60">{d.passage}</p>
                    <p className="rounded-lg border border-success/40 bg-success-soft p-3 text-sm text-ink">{d.draft}</p>
                  </div>
                ))}
                <p className="text-xs text-ink-faint">{t("Drafted by Bunon for a person to check before the policy is changed.")}</p>
              </div>
            )}

            <div className="glass-card flex flex-col gap-3 p-5">
              <h2 className="section-index">4 · {t("Fix list")}</h2>
              <ol className="flex flex-col gap-2">
                {plan.fixes.map((f, i) => (
                  <li key={f} className="flex items-start justify-between gap-3 border-b border-line pb-2 text-sm text-ink last:border-0">
                    <span>{i + 1}. {f}</span>
                    <button type="button" aria-pressed={done.has(i)} onClick={() => setDone((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className="btn-tactile-hollow inline-flex min-h-[44px] shrink-0 items-center gap-1.5 px-3 text-sm">
                      {done.has(i) && <Check className="h-4 w-4 text-success" aria-hidden="true" />}{done.has(i) ? t("Approved") : t("Approve")}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-ink-faint">{t("Nothing is sent or changed automatically. Approvals on this page are not saved yet.")}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
