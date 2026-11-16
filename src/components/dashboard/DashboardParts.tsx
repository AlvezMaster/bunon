"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
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

export function StatCard({ label, value, note, tone }: { label: string; value: React.ReactNode; note?: string; tone?: Tone }) {
  const color = tone === "bad" ? "text-danger" : tone === "review" ? "text-warning" : "text-ink";
  return (
    <div className="glass-card p-5">
      <p className="text-sm text-ink-muted">{t(label)}</p>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {note && <p className="mt-1 text-sm text-ink-faint">{t(note)}</p>}
    </div>
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
        <Link href="/ledger" className="text-sm font-semibold text-brand hover:underline">
          {t("Full ledger")}
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
            <li key={b.block} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{t(eventLabel(b.type))}</p>
                <p className="line-clamp-2 text-sm text-ink-muted">{b.summary}</p>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-ink-faint">{b.time.slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
