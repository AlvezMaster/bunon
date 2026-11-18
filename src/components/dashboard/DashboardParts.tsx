"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import { fetchLedger, type LedgerSnapshot } from "@/lib/ledger-client";
import { t } from "@/lib/i18n";
import { eventLabel } from "@/lib/labels";

export type Tone = "ok" | "review" | "bad";

const TONE: Record<Tone, { Icon: LucideIcon; cls: string }> = {
  ok: { Icon: CircleCheck, cls: "text-success" }, review: { Icon: CircleAlert, cls: "text-warning" }, bad: { Icon: CircleX, cls: "text-danger" },
};

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const { Icon, cls } = TONE[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border-[1.5px] border-current px-2 py-0.5 font-sans text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {typeof children === "string" ? t(children) : children}
    </span>
  );
}

/** A number with a label. With `href`, the whole card opens the list behind the number. */
export function StatCard({ label, value, note, tone, href }: { label: string; value: React.ReactNode; note?: string; tone?: Tone; href?: string }) {
  const color = tone === "bad" ? "text-danger" : tone === "review" ? "text-warning" : "text-ink";
  const body = (
    <>
      <p className="flex items-center justify-between gap-2 text-sm text-ink-muted">
        {t(label)}
        {href && <ArrowRight className="tile-arrow h-4 w-4" aria-hidden="true" />}
      </p>
      <p className={`font-display text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {note && <p className="text-sm text-ink-faint">{t(note)}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="glass-card tile-link !min-h-0 !gap-2 p-5">
      {body}
    </Link>
  ) : (
    <div className="glass-card flex flex-col gap-2 p-5">{body}</div>
  );
}

export interface NextStep {
  href: string;
  Icon: LucideIcon;
  title: string;
  /** One short line under the title. */
  note: string;
  /** A number to show in a pill (e.g. how many are waiting). Hidden when undefined. */
  count?: number;
  /** The one most urgent step gets the accent colour. */
  primary?: boolean;
}

/** "What to do next": big tiles, each one a single click to the right screen. */
export function NextSteps({ steps }: { steps: NextStep[] }) {
  return (
    <section aria-labelledby="next-steps-title" className="space-y-3">
      <h2 id="next-steps-title" className="section-index">
        {t("What to do next")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ href, Icon, title, note, count, primary }) => (
          <li key={href + title} className="flex">
            <Link href={href} data-primary={primary ? "true" : undefined} className="glass-card tile-link flex-1">
              <span className="flex items-center justify-between gap-2">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {count !== undefined && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                      primary ? "bg-white/20 text-white" : "bg-ink/[0.07] text-ink dark:bg-white/[0.08]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </span>
              <span className="mt-auto space-y-1">
                <span className="flex items-center justify-between gap-2 font-semibold">
                  {t(title)}
                  <ArrowRight className="tile-arrow h-4 w-4 shrink-0" aria-hidden="true" />
                </span>
                <span className="tile-muted block text-sm text-ink-muted">{t(note)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface NextUpTask {
  Icon: LucideIcon;
  title: string;
  /** One short line under the title. */
  note: string;
  /** The one big button. */
  action: string;
  href?: string;
  onClick?: () => void;
  /** Nothing urgent: the button is quiet instead of the accent colour. */
  calm?: boolean;
  tone?: Tone;
}

/** The single most useful thing to do now, with one big button. */
export function NextUp({ task }: { task: NextUpTask }) {
  const { Icon, title, note, action, href, onClick, calm, tone } = task;
  const btn = calm ? "btn-tactile-hollow inline-flex min-h-[52px] items-center justify-center gap-2 px-6 text-base" : "btn-primary-action min-h-[52px] px-6 text-base";
  const iconTone = tone === "bad" ? "bg-danger-soft text-danger" : tone === "review" ? "bg-warning/10 text-warning" : "bg-brand/10 text-brand";
  const label = (
    <>
      {t(action)}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </>
  );
  return (
    <section aria-labelledby="next-up-title" className="glass-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${iconTone}`}>
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="section-index">{t("Next up")}</p>
        <h2 id="next-up-title" className="font-display text-2xl font-semibold text-ink [text-wrap:balance] sm:text-3xl">
          {title}
        </h2>
        <p className="text-base text-ink-muted">{note}</p>
      </div>
      {href ? (
        <Link href={href} className={`${btn} self-stretch sm:self-center`}>
          {label}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={`${btn} self-stretch sm:self-center`}>
          {label}
        </button>
      )}
    </section>
  );
}

export interface QuickLink {
  href: string;
  Icon: LucideIcon;
  label: string;
  count?: number;
}

/** Quiet one-click links to the other screens, so the dashboard itself stays short. */
export function QuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <nav aria-label={t("Go to")} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {links.map(({ href, Icon, label, count }) => (
        <Link key={href} href={href} className="glass-card flex min-h-[56px] items-center gap-3 px-4 py-3 text-sm font-medium text-ink transition-colors duration-150 hover:text-brand">
          <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{t(label)}</span>
          {count !== undefined && <span className="rounded-full bg-ink/[0.07] px-2 py-0.5 text-xs font-semibold tabular-nums text-ink dark:bg-white/[0.08]">{count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** A list row that is one big link or button, with a chevron that says "this opens". */
export function RowLink({ href, onClick, children, label }: { href?: string; onClick?: () => void; children: React.ReactNode; label?: string }) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">{children}</span>
      <ChevronRight className="row-chevron h-5 w-5" aria-hidden="true" />
    </>
  );
  return href ? (
    <Link href={href} className="row-link" aria-label={label}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className="row-link" aria-label={label}>
      {inner}
    </button>
  );
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink">{t(title)}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardHeader({
  eyebrow,
  title,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  /** One short line of context under the title. */
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="section-index">{t(eyebrow)}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t(title)}</h1>
        {note && <p className="text-base text-ink-muted">{note}</p>}
      </div>
      {children}
    </div>
  );
}

/** The newest ledger blocks, optionally filtered by event type. */ export function RecentActivity({ types, empty }: { types?: string[]; empty: string }) {
  const [snap, setSnap] = useState<LedgerSnapshot | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetchLedger(50).then(setSnap).catch(() => setError(true));
  }, []);
  // Entries about other companies come back hidden from the API; they don't belong in your activity.
  const blocks = (snap?.blocks ?? []).filter((b) => b.actor !== "Another company" && (!types || types.includes(b.type))).slice(0, 5);

  return (
    <Panel
      title="Recent activity"
      action={
        <Link href="/ledger" className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand hover:underline">
          {t("Full ledger")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {error ? (
        <p className="text-sm text-danger">{t("The ledger could not be loaded.")}</p>
      ) : !snap ? (
        <p className="text-sm text-ink-muted">{t("Loading…")}</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-ink-muted">{t(empty)}</p>
      ) : (
        <ul className="divide-y divide-line">
          {blocks.map((b) => (
            <li key={b.block}>
              <RowLink href={`/ledger#block-${b.block}`}>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{t(eventLabel(b.type))}</span>
                  <span className="line-clamp-2 text-sm text-ink-muted">{b.summary}</span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-ink-faint">
                  #{b.block} · {b.time.slice(0, 10)}
                </span>
              </RowLink>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
