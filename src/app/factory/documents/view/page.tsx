"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, Cloud, ExternalLink, FileText, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { useQuestionnaires } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

interface ViewDoc {
  id: string;
  title: string;
  fileName: string;
  bytes: number;
  uploadedAt: string;
  uploadedBy: string;
  validUntil: string | null;
  demo: boolean;
  fromPhoto: boolean;
  original: { kind: "pdf" | "image" | "file" } | null;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Splits a paragraph so each quoted sentence can be highlighted. */
function highlight(paragraph: string, quotes: string[]): React.ReactNode[] {
  const hits = quotes.filter((q) => q && paragraph.includes(q));
  if (!hits.length) return [paragraph];
  const re = new RegExp(`(${hits.map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return paragraph.split(re).map((part, i) => (hits.includes(part) ? <mark key={i} className="rounded bg-accent-soft px-0.5 text-ink">{part}</mark> : part));
}

function Viewer() {
  const id = useSearchParams().get("id") ?? "";
  const { data } = useQuestionnaires();
  const [doc, setDoc] = useState<ViewDoc | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/documents/view?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as { document?: ViewDoc; text?: string; error?: string };
        if (!res.ok || !json.document) throw new Error(json.error ?? `HTTP ${res.status}`);
        setDoc(json.document);
        setText(json.text ?? "");
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // The sentences of this document that answers quote, with the question and buyer of each.
  const cited = useMemo(() => {
    if (!data) return [];
    const question = new Map(data.questionnaires.flatMap((q) => q.questions.map((x) => [x.id, { text: x.text, buyer: q.buyer }] as const)));
    return Object.values(data.answers ?? {})
      .filter((a) => a.docId === id && a.quote)
      .map((a) => ({ quote: a.quote, question: question.get(a.questionId)?.text ?? "", buyer: question.get(a.questionId)?.buyer ?? "" }));
  }, [data, id]);
  const paragraphs = text.replace(/\r/g, "").split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const fileUrl = `/api/documents/file?id=${encodeURIComponent(id)}`;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10 sm:px-6">
      <Link href="/factory/library" className="inline-flex min-h-[44px] items-center gap-2 self-start text-sm font-medium text-ink-muted hover:text-brand">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("Document library")}
      </Link>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {!doc && !error && <p className="text-ink-muted">{t("Loading…")}</p>}
      {doc && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="section-index">{t("Document")}</p>
              <h1 className="font-display text-3xl font-semibold text-ink [text-wrap:balance]">{doc.title}</h1>
              <p className="text-sm text-ink-muted">
                {doc.fileName} · {doc.demo ? t("Demo document") : `${t("Added")} ${day(doc.uploadedAt)} ${t("by")} ${doc.uploadedBy}`}
                {doc.validUntil ? ` · ${t("Valid until")} ${day(doc.validUntil)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {doc.demo && <DemoDataBadge />}
              {doc.fromPhoto && <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning"><Camera className="h-3.5 w-3.5" aria-hidden="true" />{t("Read from a photo: check the text")}</span>}
              {doc.original && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
                  <Cloud className="h-4 w-4" aria-hidden="true" />
                  {t("Download original")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </header>

          <div className={`grid gap-6 ${doc.original ? "lg:grid-cols-2" : ""}`}>
            {doc.original && (
              <section aria-label={t("Original file")} className="glass-card flex flex-col gap-2 p-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">{t("Original file · kept privately on Cloudinary")}</p>
                {doc.original.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${fileUrl}&view=1`} alt={doc.title} className="w-full rounded-lg border border-line object-contain" />
                ) : doc.original.kind === "pdf" ? (
                  <iframe src={`${fileUrl}&view=1`} title={doc.title} className="h-[70vh] w-full rounded-lg border border-line bg-surface" />
                ) : (
                  <p className="p-2 text-sm text-ink-muted">{t("This file type can't be shown here. Use Download original.")}</p>
                )}
              </section>
            )}

            <section aria-label={t("Text Bunon reads")} className="glass-card flex flex-col gap-3 p-5 sm:p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {t("Text Bunon reads")}
                {cited.length > 0 && <span className="normal-case tracking-normal text-ink-muted">· <mark className="rounded bg-accent-soft px-1 text-ink">{t("highlighted")}</mark> {t("sentences are quoted in answers")}</span>}
              </p>
              <div className="flex max-w-[72ch] flex-col gap-3 text-[15px] leading-relaxed text-ink [text-wrap:pretty]">
                {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{highlight(p, cited.map((c) => c.quote))}</p>) : <p className="text-ink-muted">{t("No text was found in this document.")}</p>}
              </div>
            </section>
          </div>

          {cited.length > 0 && (
            <section aria-labelledby="cited-title" className="glass-card flex flex-col gap-3 p-5 sm:p-6">
              <h2 id="cited-title" className="flex items-center gap-2 font-display text-lg font-semibold text-ink"><Quote className="h-5 w-5 text-brand" aria-hidden="true" />{t("Answers that quote this document")} ({cited.length})</h2>
              <ul className="flex flex-col divide-y divide-line">
                {cited.map((c, i) => (
                  <li key={i} className="flex flex-col gap-1 py-2.5 text-sm">
                    <span className="font-medium text-ink">{c.question} <span className="font-normal text-ink-faint">· {c.buyer}</span></span>
                    <span className="italic text-ink-muted">“{c.quote}”</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

/** Document viewer: the original file (when kept) beside the text Bunon reads, with quoted sentences highlighted. */
export default function DocumentViewerPage() {
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <Suspense fallback={<p className="p-10 text-ink-muted">{t("Loading…")}</p>}>
        <Viewer />
      </Suspense>
    </div>
  );
}
