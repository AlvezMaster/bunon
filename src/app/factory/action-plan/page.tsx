"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BellRing, Check, CheckCircle2, ClipboardList, FileText, RefreshCw, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires, type Payload } from "@/components/questions/shared";
import { buildPlan, fmt, type Plan } from "@/lib/action-plan";
import { latest, versionOf, type WatchedRule } from "@/lib/watched-rules";
import { t } from "@/lib/i18n";

interface Approval {
  fix: string;
  by: string;
  at: string;
  block: number;
}
interface State {
  rules: WatchedRule[];
  reviewed: Record<string, number>;
  approvals: Record<string, Approval>;
}
interface Target {
  ruleId: string;
  version: number;
  name: string;
  before: string;
  after: string;
}

/** Searches this factory's documents for the old wording, then builds the plan (src/lib/action-plan.ts). */
async function makePlan(target: Target, data: Payload): Promise<Plan> {
  const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", text: target.before }) });
  const json = (await res.json()) as { passages?: Array<{ docId: string; title: string; text: string }>; error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return buildPlan({ before: target.before, after: target.after, found: json.passages ?? [], answers: Object.values(data.answers ?? {}), questionnaires: data.questionnaires });
}

const changedRules = (s: State) => s.rules.filter((r) => latest(r).version > (s.reviewed[r.id] ?? r.versions[0].version));
const targetFor = (r: WatchedRule, s: State): Target => ({ ruleId: r.id, version: latest(r).version, name: r.name, before: versionOf(r, s.reviewed[r.id] ?? r.versions[0].version).text, after: latest(r).text });

/**
 * Compliance Action Plan. Bunon watches a list of rules; when a newer version appears than the one the factory last
 * reviewed, it reports the change and builds the plan: what changed, which documents and sent answers rest on the
 * old wording, a redrafted policy, and a fix list. A person approves each fix (recorded in the activity log).
 */
export default function ActionPlanPage() {
  const { data, error } = useQuestionnaires();
  const [state, setState] = useState<State | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [fail, setFail] = useState("");
  const [manual, setManual] = useState({ before: "", after: "" });
  const started = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/action-plan", { cache: "no-store" });
    const json = (await res.json()) as State & { error?: string };
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    setState(json);
    return json;
  }, []);

  const run = useCallback(
    async (tg: Target) => {
      if (!data) return;
      setBusy("plan");
      setFail("");
      setTarget(tg);
      try {
        setPlan(await makePlan(tg, data));
      } catch (e) {
        setFail(e instanceof Error ? e.message : t("Something went wrong."));
      } finally {
        setBusy(null);
      }
    },
    [data]
  );

  // On opening: check the watched rules and build the plan for the first change found.
  useEffect(() => {
    if (!data || started.current) return;
    started.current = true;
    load()
      .then((s) => {
        const first = changedRules(s)[0];
        if (first) void run(targetFor(first, s));
      })
      .catch((e: Error) => setFail(e.message));
  }, [data, load, run]);

  const post = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setFail("");
    try {
      const res = await fetch("/api/action-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setFail(e instanceof Error ? e.message : t("Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const approved = (fix: string) =>
    target && state ? Object.entries(state.approvals).find(([k, a]) => k.startsWith(`${target.ruleId}@${target.version}#`) && a.fix === fix)?.[1] : undefined;
  const changed = state ? changedRules(state) : [];
  const field = "w-full rounded-lg border border-field bg-surface/70 p-3 text-base text-ink outline-none focus:border-brand";

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Compliance Action Plan" title="A rule changed. What do we fix?" note={t("Bunon watches the rules that apply to you. When one changes, it finds what in your documents and sent answers rests on the old wording, drafts the fixes, and a person approves each one.")}>
          <DemoDataBadge />
        </DashboardHeader>
        {(error || fail) && <p role="alert" className="text-danger">{error || fail}</p>}

        <section aria-labelledby="watched-title" className="glass-card flex flex-col gap-3 p-5 sm:p-6">
          <h2 id="watched-title" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <BellRing className="h-5 w-5 text-accent" aria-hidden="true" />
            {state ? (changed.length ? `${changed.length} ${t(changed.length === 1 ? "rule change found since your last review" : "rule changes found since your last review")}` : t("All watched rules are up to date")) : t("Checking the rules Bunon watches…")}
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {state?.rules.map((r) => {
              const isNew = changed.includes(r);
              const on = target?.ruleId === r.id;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{r.name}</span>
                    <span className="block text-xs text-ink-faint">{r.source} · {t("version")} {latest(r).version}, {latest(r).date}</span>
                  </span>
                  {isNew ? (
                    <button type="button" onClick={() => void run(targetFor(r, state))} aria-pressed={on} className={`${on ? "btn-primary-action" : "btn-tactile-hollow inline-flex items-center gap-2 px-4"} min-h-[44px] text-sm`}>
                      <ClipboardList className="h-4 w-4" aria-hidden="true" />
                      {on ? t("Showing its plan") : t("New version: show plan")}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t("Reviewed")}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-ink-faint">{t("Demo versions written for this demo, not real announcements. Real feeds (Gazette, DIFE, EUR-Lex, buyers' codes) are next.")}</p>
        </section>

        {busy === "plan" && <p className="flex items-center gap-2 text-ink-muted"><RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{t("Building the action plan…")}</p>}

        {plan && target && busy !== "plan" && (
          <section aria-label={t("Compliance Action Plan")} className="flex flex-col gap-6" aria-live="polite">
            <div className="glass-card flex flex-col gap-2 p-5">
              <h2 className="section-index">1 · {t("What changed")}</h2>
              <p className="font-medium text-ink">{target.name}</p>
              <p className="text-sm text-ink-muted line-through decoration-danger/60">{target.before}</p>
              <p className="text-sm text-ink">{target.after}</p>
              {plan.changes.length > 0 && (
                <ul className="flex flex-wrap gap-2">{plan.changes.map((c) => <li key={c.from} className="rounded-full bg-brand-soft px-3 py-1 text-sm text-ink [font-variant-numeric:tabular-nums]">{fmt(c.from)} <ArrowRight className="inline h-3.5 w-3.5" aria-label="to" /> {c.to ? fmt(c.to) : "?"}</li>)}</ul>
              )}
            </div>

            <div className="glass-card flex flex-col gap-3 p-5">
              <h2 className="section-index">2 · {t("What it affects")}</h2>
              {plan.docs.map((d) => <p key={d.docId} className="flex items-start gap-2 text-sm text-ink"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />{d.title}: {t("states the old wording")}</p>)}
              {plan.alreadyMeets.map((d) => <p key={d.docId} className="flex items-start gap-2 text-sm text-success"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{d.title}: {t("already meets the new rule")}</p>)}
              {plan.docs.length === 0 && plan.alreadyMeets.length === 0 && <p className="text-sm text-ink-muted">{t("None of your documents covers this rule yet.")}</p>}
              <p className="flex items-start gap-2 text-sm text-ink-muted"><Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{plan.answers.length} {t("sent answers rest on the affected documents")}{plan.buyers.length ? ` · ${plan.buyers.join(", ")}` : ""}</p>
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
                {plan.fixes.map((f, i) => {
                  const a = approved(f);
                  return (
                    <li key={f} className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-2 text-sm text-ink last:border-0">
                      <span className="min-w-0 flex-1">{i + 1}. {f}{a && <span className="block text-xs text-success">{t("Approved by")} {a.by} · {t("activity log entry")} #{a.block}</span>}</span>
                      {a ? (
                        <span className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-success"><Check className="h-4 w-4" aria-hidden="true" />{t("Approved")}</span>
                      ) : (
                        <button type="button" disabled={busy !== null} onClick={() => void post({ action: "approve", ruleId: target.ruleId, version: target.version, fix: f }, `fix-${i}`)} className="btn-tactile-hollow inline-flex min-h-[44px] shrink-0 items-center gap-1.5 px-3 text-sm">
                          {busy === `fix-${i}` ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                          {t("Approve")}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
              <p className="text-xs text-ink-faint">{t("Nothing is sent or changed automatically. Each approval is recorded in your activity log.")}</p>
              {target.ruleId !== "manual" && state && changed.some((r) => r.id === target.ruleId) && (
                <button type="button" disabled={busy !== null} onClick={() => void post({ action: "reviewed", ruleId: target.ruleId, version: target.version }, "reviewed")} className="btn-primary-action min-h-[48px] self-start">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t("Mark this change as reviewed")}
                </button>
              )}
            </div>
          </section>
        )}

        <details className="glass-card p-5 sm:p-6">
          <summary className="min-h-[44px] cursor-pointer font-display text-lg font-semibold text-ink">{t("Or paste a rule change yourself")}</summary>
          <form onSubmit={(e) => { e.preventDefault(); void run({ ruleId: "manual", version: 0, name: t("A rule change entered by hand"), ...manual }); }} className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">{t("Old wording")}<textarea rows={4} value={manual.before} onChange={(e) => setManual((m) => ({ ...m, before: e.target.value }))} className={field} /></label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">{t("New wording")}<textarea rows={4} value={manual.after} onChange={(e) => setManual((m) => ({ ...m, after: e.target.value }))} className={field} /></label>
            </div>
            <button type="submit" disabled={busy !== null || !data || manual.before.trim().length < 8} className="btn-tactile-hollow inline-flex min-h-[48px] items-center gap-2 self-start px-4">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {t("Make the action plan")}
            </button>
          </form>
        </details>
      </main>
    </div>
  );
}
