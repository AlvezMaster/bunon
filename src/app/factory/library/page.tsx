"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, Cloud, ExternalLink, FileText, Network, UploadCloud } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { checklist, SOON_DAYS, type ChecklistItem } from "@/lib/document-library";
import { t } from "@/lib/i18n";

interface Doc {
  id: string;
  title: string;
  fileName: string;
  bytes: number;
  uploadedAt: string;
  uploadedBy: string;
  validUntil: string | null;
  demo?: boolean;
  fromPhoto?: boolean;
  stored?: unknown;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Status({ item }: { item: ChecklistItem }) {
  if (item.status === "missing") return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning"><CircleDashed className="h-4 w-4" aria-hidden="true" />{t("Missing")}</span>;
  if (item.status === "expired") return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("Expired")}</span>;
  if (item.status === "expiring") return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("Expires in")} {item.daysLeft} {t("days")}</span>;
  return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t("On file")}</span>;
}

/**
 * Factory document library: the documents buyers usually ask for, which of them are on file, missing or expiring,
 * and every document with where its original file is kept (privately on Cloudinary, or text only).
 */
export default function FactoryLibraryPage() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/documents", { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as { documents?: Doc[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setDocs(json.documents ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const items = docs ? checklist(docs) : [];
  const covered = items.filter((i) => i.status !== "missing").length;
  const originals = docs?.filter((d) => d.stored).length ?? 0;
  const attention = items.filter((i) => i.status === "expiring" || i.status === "expired").length;
  const tiles = [
    { label: "Documents on file", value: docs ? String(docs.length) : "–" },
    { label: "Checklist covered", value: docs ? `${covered} / ${items.length}` : "–" },
    { label: "Originals kept privately on Cloudinary", value: docs ? String(originals) : "–" },
    { label: `Expired or expiring within ${SOON_DAYS} days`, value: docs ? String(attention) : "–", warn: attention > 0 },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Document library" title="All your documents in one place" note={t("See which documents buyers usually ask for are on file, which are missing or expiring, and where each original is kept.")}>
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/factory/documents" className="btn-primary-action min-h-[48px]">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {t("Upload a document")}
            </Link>
          </div>
        </DashboardHeader>
        {error && <p role="alert" className="text-danger">{error}</p>}

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.label} className="glass-card flex flex-col gap-1 p-4">
              <span className={`font-display text-2xl font-semibold [font-variant-numeric:tabular-nums] ${tile.warn ? "text-warning" : "text-ink"}`}>{tile.value}</span>
              <span className="text-sm text-ink-muted">{t(tile.label)}</span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="checklist-title" className="glass-card flex flex-col gap-2 p-5 sm:p-6">
          <h2 id="checklist-title" className="font-display text-lg font-semibold text-ink">{t("What buyers usually ask for")}</h2>
          <p className="text-sm text-ink-muted">{t("Matched by each document's title and file name, so name your uploads clearly.")}</p>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {items.map((item) => (
              <li key={item.doc.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{t(item.doc.name)}</span>
                  <span className="block text-xs text-ink-faint">{item.matches.length ? item.matches.map((m) => m.title).join(" · ") : t(item.doc.why)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Status item={item} />
                  {(item.status === "missing" || item.status === "expired") && (
                    <Link href="/factory/documents" className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm">
                      <UploadCloud className="h-4 w-4" aria-hidden="true" />
                      {t("Upload")}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="all-docs-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="all-docs-title" className="font-display text-lg font-semibold text-ink">{t("Every document")}</h2>
            <Link href="/factory/evidence" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline">
              <Network className="h-4 w-4" aria-hidden="true" />
              {t("See which answers rest on each")}
            </Link>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Document")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Added")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Valid until")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("Original file")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {docs?.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">
                      <span className="flex items-start gap-2 font-medium text-ink"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />{d.title}</span>
                      <span className="block pl-6 text-xs text-ink-faint">{d.fileName}{d.fromPhoto ? ` · ${t("read from a photo")}` : ""}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted [font-variant-numeric:tabular-nums]">{d.demo ? t("Demo document") : day(d.uploadedAt)}</td>
                    <td className="px-4 py-3 text-ink-muted [font-variant-numeric:tabular-nums]">{d.validUntil ? day(d.validUntil) : "–"}</td>
                    <td className="px-4 py-3">
                      {d.stored ? (
                        <a href={`/api/documents/file?id=${encodeURIComponent(d.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-brand hover:underline">
                          <Cloud className="h-4 w-4" aria-hidden="true" />
                          {t("Kept privately · Open")}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-ink-faint">{d.demo ? t("Built-in demo text") : t("Text only")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs?.length === 0 && <p className="p-4 text-sm text-ink-muted">{t("No documents yet.")}</p>}
            {!docs && !error && <p className="p-4 text-sm text-ink-muted">{t("Loading…")}</p>}
          </div>
          <p className="text-xs text-ink-faint">{t("Originals are stored privately on Cloudinary, named by their fingerprint; an open link works for 5 minutes and only for people at your factory.")}</p>
        </section>
      </main>
    </div>
  );
}
