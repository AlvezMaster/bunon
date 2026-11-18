"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, FileText, RefreshCw, Search, Sparkles, Trash2, UploadCloud } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useDay } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

interface Doc {
  id: string;
  title: string;
  fileName: string;
  passages: number;
  bytes: number;
  embedModel: string | null;
  validUntil: string | null;
  uploadedAt: string;
  demo?: boolean;
  fromPhoto?: boolean;
}

const isPhoto = (f: File) => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);

/** Phone photos are often several MB: send a sharp 2000-pixel JPEG instead, well under the 4 MB limit. */
async function shrinkPhoto(f: File): Promise<File> {
  if (f.size < 1.5 * 1024 * 1024 || typeof createImageBitmap === "undefined") return f;
  const bmp = await createImageBitmap(f);
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  return blob ? new File([blob], f.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg", { type: "image/jpeg" }) : f;
}

const FIELD =
  "w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]";

/** Factory: the documents answers to buyers are drafted from. Upload, see and remove them. */
export default function FactoryDocuments() {
  const day = useDay();
  const input = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<{ meaning: boolean; passages: Array<{ docId: string; title: string; text: string; via: string[] }> } | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 4) return;
    setSearching(true);
    try {
      const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", text: query }) });
      const json = (await res.json()) as { error?: string; meaning: boolean; passages: Array<{ docId: string; title: string; text: string; via: string[] }> };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setHits(json);
    } catch (err) {
      setError(t(err instanceof Error ? err.message : "Search failed."));
    } finally {
      setSearching(false);
    }
  };

  const load = useCallback(async () => {
    const res = await fetch("/api/documents", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { documents?: Doc[]; embedModel?: string | null; error?: string };
    if (!res.ok) return setError(json.error ?? `HTTP ${res.status}`);
    setDocs(json.documents ?? []);
    setMeaning(json.embedModel ?? null);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setError(null);
    setDone(null);
    if (!title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " "));
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError(t("Choose a file to upload."));
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", isPhoto(file) ? await shrinkPhoto(file) : file);
      form.append("title", title);
      if (validUntil) form.append("validUntil", validUntil);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { error?: string; document?: Doc };
      if (!res.ok || !json.document) throw new Error(json.error ?? `HTTP ${res.status}`);
      setDone(`${t("Added")} “${json.document.title}”: ${json.document.passages} ${t("passages")}.`);
      setFile(null);
      setTitle("");
      setValidUntil("");
      if (input.current) input.current.value = "";
      await load();
    } catch (err) {
      setError(t(err instanceof Error ? err.message : "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    setBusy(false);
    setConfirming(null);
    if (!res.ok) return setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? t("Delete failed."));
    await load();
  };

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="Documents"
          title="Your documents"
          note={t("Answers to buyer questions are drafted only from these files, and each answer quotes the sentence it uses.")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/factory/questionnaire" className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
              {t("Buyer questions")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </DashboardHeader>

        <form onSubmit={upload} className="glass-card flex flex-col gap-4 p-5 sm:p-6" noValidate>
          <h2 className="text-lg font-semibold text-ink">{t("Add a document")}</h2>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-[background-color,border-color] duration-150 ${
              dragging ? "border-brand bg-brand-soft/60" : "border-line-strong bg-surface-2/40 hover:border-brand hover:bg-brand-soft/30"
            }`}
          >
            <input ref={input} type="file" accept=".pdf,.txt,.md,.jpg,.jpeg,.png,.webp,application/pdf,text/plain,text/markdown,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            <UploadCloud className="h-8 w-8 text-brand" aria-hidden="true" />
            {file ? (
              <span className="text-sm font-semibold text-ink">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </span>
            ) : (
              <>
                <span className="text-sm font-semibold text-ink">{t("Drop a file here, or click to choose")}</span>
                <span className="text-sm text-ink-faint">{t("A PDF, a .txt / .md file, or a photo of a document (JPG, PNG), up to 4 MB")}</span>
              </>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">{t("Title")}</span>
              <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder={t("e.g. Wage and benefits policy")} className={FIELD} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">{t("Valid until (optional)")}</span>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={FIELD} />
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </p>
          )}
          {done && (
            <p role="status" className="text-sm text-success">
              {done}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm text-ink-faint">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {meaning ? t("Searched by keywords and by meaning (English and Bangla).") : t("Searched by keywords. Meaning search turns on when an embedding model is available.")}
            </p>
            <button type="submit" disabled={busy || !file} className="btn-primary-action min-h-[48px]">
              {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
              {busy ? t(file && isPhoto(file) ? "Reading the photo, up to a minute…" : "Reading the file…") : t("Upload document")}
            </button>
          </div>
        </form>

        <section className="glass-card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="try-title">
          <div className="space-y-1">
            <h2 id="try-title" className="text-lg font-semibold text-ink">
              {t("Try a question")}
            </h2>
            <p className="text-sm text-ink-muted">{t("See which passages a buyer's question would be answered from. Works in English and Bangla.")}</p>
          </div>
          <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="try-q">
              {t("Question")}
            </label>
            <input
              id="try-q"
              value={query}
              maxLength={300}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("For example: Do you use child workers?")}
              className={`${FIELD} min-h-[48px] flex-1`}
            />
            <button type="submit" disabled={searching || query.trim().length < 4} className="btn-tactile-hollow inline-flex min-h-[48px] items-center justify-center gap-2 px-5 text-sm">
              {searching ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              {t("Search")}
            </button>
          </form>
          {hits && (
            <ol className="flex flex-col gap-2">
              {hits.passages.length === 0 && <li className="text-sm text-ink-muted">{t("Nothing on file matches this question.")}</li>}
              {hits.passages.map((p, i) => (
                <li key={`${p.docId}-${i}`} className="rounded-lg border border-line bg-surface-2/50 p-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    <span className="tabular-nums text-ink-faint">{i + 1}.</span>
                    {t(p.title)}
                    {p.via.map((v) => (
                      <span key={v} className={`rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ${v === "meaning" ? "bg-brand-soft text-brand" : "bg-ink/[0.07] text-ink-muted"}`}>
                        {v === "meaning" ? t("by meaning") : t("by keywords")}
                      </span>
                    ))}
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{p.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="list-title">
          <h2 id="list-title" className="section-index">
            {t("On file")} {docs ? `· ${docs.length}` : ""}
          </h2>
          {!docs && <p className="text-ink-muted">{t("Loading…")}</p>}
          {docs && docs.length === 0 && <p className="glass-card p-6 text-ink-muted">{t("No documents yet. Upload your policies, licences and reports to start answering buyers.")}</p>}
          <ul className="flex flex-col gap-2">
            {docs?.map((d) => {
              const expired = !!d.validUntil && d.validUntil < new Date().toISOString().slice(0, 10);
              return (
                <li key={d.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <FileText className="h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{t(d.title)}</p>
                    <p className="text-sm text-ink-faint">
                      {d.fileName} · {d.passages} {t(d.passages === 1 ? "passage" : "passages")} · {d.demo ? t("Demo document") : `${t("Added")} ${day(d.uploadedAt)}`}
                      {d.fromPhoto && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("Read from a photo: check the text")}
                        </span>
                      )}
                      {d.validUntil ? ` · ${t(expired ? "Expired" : "Valid until")} ${day(d.validUntil)}` : ""}
                    </p>
                  </div>
                  {d.embedModel && <span className="w-fit rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">{t("Meaning search")}</span>}
                  {!d.demo &&
                    (confirming === d.id ? (
                      <span className="flex items-center gap-2">
                        <button type="button" disabled={busy} onClick={() => void remove(d.id)} className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 border-danger px-3 text-sm text-danger">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {t("Delete")}
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className="min-h-[44px] rounded-lg px-3 text-sm text-ink-muted hover:text-ink">
                          {t("Keep")}
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(d.id)}
                        aria-label={`${t("Delete")} ${d.title}`}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-faint hover:bg-ink/[0.06] hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
