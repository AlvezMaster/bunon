"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { fetchLedger, type LedgerSnapshot } from "@/lib/ledger-client";
import { formatBlockTime } from "@/lib/ledger";
import { shortHash } from "@/lib/crypto";
import { t } from "@/lib/i18n";
import { eventLabel } from "@/lib/labels";
import { useBunonStore } from "@/lib/store";
import { ArrowLeft, Download, Copy, Check, Database, ShieldCheck, AlertOctagon, RefreshCw } from "lucide-react";

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function AuditLogsPage() {
  const [snapshot, setSnapshot] = useState<LedgerSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSnapshot(await fetchLedger(200));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ledger unavailable");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const blocks = snapshot?.blocks ?? [];

  // Links like /ledger#block-1421 (from dashboards) land on that entry once the chain has loaded.
  useEffect(() => {
    if (!blocks.length || !window.location.hash.startsWith("#block-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [blocks.length]);
  const verification = snapshot?.verification;

  const handleCopy = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleExportCsv = () => {
    const header = ["Block", "Time (UTC)", "Type", "Actor", "Style", "Summary", "Payload hash", "Parent hash", "Hash", "Status"];
    const rows = blocks.map((b) =>
      [b.block, b.time, b.type, b.actor, b.styleCode ?? "", b.summary, b.payloadHash ?? "", b.prevHash, b.hash, b.status]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bunon-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const session = useBunonStore((s) => s.session);
  const dashboardHref = session ? (session.role === "buyer" ? "/buyer" : "/factory") : "/";
  const sourceLabel = snapshot?.source === "postgres" ? "PostgreSQL" : snapshot ? "In-memory demo store" : "Loading…";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans pb-20">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col gap-8 pt-10">
        <Link href={dashboardHref} className="-mb-4 inline-flex min-h-[44px] w-fit items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {session ? t("Back to dashboard") : t("Back to overview")}
        </Link>

        {/* Title, one line of context, then the one action */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-index text-xs">{t("Ledger")}</span>
              <DemoDataBadge />
            </div>
            <h1 className="display-title font-bold tracking-tight text-ink">{t("Activity record")}</h1>
            <p className="text-base text-ink-muted leading-relaxed max-w-[62ch]">
              {t("Every certificate check, supplier reminder, new order and buyer check is saved here in order. Entries are never changed or deleted, and an edit to any old entry would be detected.")}
            </p>
          </div>
          {blocks.length > 0 && (
            <button type="button" onClick={handleExportCsv} className="btn-primary-action shrink-0 rounded-[4px]">
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{t("Download as CSV")}</span>
            </button>
          )}
        </header>

        {/* Is the record intact? */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-live="polite">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-ink-muted">
              <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {t("Checking the record…")}
            </span>
          ) : verification?.ok ? (
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <ShieldCheck className="w-4 h-4 text-ink-muted" aria-hidden="true" />
              {t("Record intact")} · <span className="tabular-nums">{verification.checked}</span> {t("entries checked")}
            </span>
          ) : verification ? (
            <span className="flex items-center gap-1.5 font-semibold text-danger">
              <AlertOctagon className="w-4 h-4" aria-hidden="true" />
              {t("Record broken at entry")} <span className="font-mono">#{verification.brokenAt}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] px-4 text-sm font-semibold disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>{t("Refresh")}</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-[4px] bg-danger-soft/90 border border-danger text-sm text-danger flex items-center justify-between gap-4"
          >
            <span>
              {t("Could not load the ledger:")} {error}
            </span>
            <button type="button" onClick={() => void load()} className="min-h-[44px] font-semibold underline text-ink">
              {t("Try again")}
            </button>
          </div>
        )}

        <section className="glass-card overflow-x-auto" aria-label={t("Activity record")}>
          <table className="w-full text-left text-sm border-collapse">
            <caption className="sr-only">{t("Activity record, newest first")}</caption>
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-canvas/80 text-xs text-ink-muted">
                <th scope="col" className="py-3 px-4 font-normal">#</th>
                <th scope="col" className="py-3 px-4 font-normal">{t("Time (UTC)")}</th>
                <th scope="col" className="py-3 px-4 font-normal">{t("Event")}</th>
                <th scope="col" className="py-3 px-4 font-normal">{t("By")}</th>
                <th scope="col" className="py-3 px-4 font-normal">{t("Order")}</th>
                <th scope="col" className="py-3 px-4 font-normal">{t("Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {isLoading && blocks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-ink-muted">
                    {t("Loading…")}
                  </td>
                </tr>
              )}
              {!isLoading && blocks.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-ink-muted">
                    {t("Nothing recorded yet.")}
                  </td>
                </tr>
              )}
              {blocks.map((b) => (
                <tr key={b.block} id={`block-${b.block}`} className="scroll-mt-24 bg-canvas/40 align-top transition-colors hover:bg-surface-2/40 target:bg-brand-soft/70">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-ink tabular-nums">#{b.block}</td>
                  <td className="py-3 px-4 font-mono text-xs text-ink-muted whitespace-nowrap tabular-nums">
                    {b.time.slice(0, 10)} {formatBlockTime(b.time)}
                  </td>
                  <td className="py-3 px-4 max-w-[360px]">
                    <span className="font-semibold text-ink">{t(eventLabel(b.type))}</span>
                    <p className="mt-1 text-xs text-ink-muted leading-relaxed">{b.summary}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-ink-muted max-w-[180px]">{b.actor}</td>
                  <td className="py-3 px-4 font-mono text-xs text-ink">{b.styleCode ?? "—"}</td>
                  <td className="py-3 px-4">
                    {b.status === "flagged" ? (
                      <span className="px-2 py-0.5 rounded-[3px] bg-danger text-white font-semibold text-xs inline-flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" aria-hidden="true" /> {t("Flagged")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[3px] bg-success-soft/50 text-ink font-semibold text-xs inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" aria-hidden="true" /> {t("Verified")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {snapshot?.source === "memory" && (
          <p className="text-sm text-ink-muted">{t("This demo record resets when the server restarts.")}</p>
        )}

        <details className="glass-card p-4">
          <summary className="cursor-pointer min-h-[44px] flex items-center text-sm font-semibold text-ink-muted">
            {t("Technical details")}
          </summary>
          <div className="flex flex-col gap-4 pt-4 text-xs text-ink-muted">
            <p className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Backend: {sourceLabel}</span>
            </p>
            {snapshot?.source === "memory" && (
              <p>
                PostgreSQL is not reachable, so this ledger lives in server memory and resets when the server restarts. Set
                DATABASE_URL and run init_db.sql to persist it.
              </p>
            )}
            {verification && !verification.ok && verification.reason && <p className="text-danger">{verification.reason}</p>}
            {blocks.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)]">
                      <th scope="col" className="py-2 pr-4 font-normal">#</th>
                      <th scope="col" className="py-2 pr-4 font-normal">Hash / parent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {blocks.map((b) => (
                      <tr key={b.block} className="align-top">
                        <td className="py-2 pr-4 text-ink tabular-nums">#{b.block}</td>
                        <td className="py-2 pr-4 space-y-1">
                          <button
                            type="button"
                            onClick={() => void handleCopy(b.hash)}
                            className="min-h-11 text-ink hover:text-brand flex items-center gap-1.5 md:min-h-[32px]"
                            aria-label={`Copy hash of block ${b.block}`}
                          >
                            <span>{shortHash(b.hash)}</span>
                            {copiedHash === b.hash ? (
                              <Check className="w-3 h-3 text-ink-muted" aria-hidden="true" />
                            ) : (
                              <Copy className="w-3 h-3 text-ink-muted" aria-hidden="true" />
                            )}
                          </button>
                          <div className="text-[10px]">parent {shortHash(b.prevHash)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </details>
      </main>
    </div>
  );
}
