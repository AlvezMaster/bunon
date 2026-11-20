"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileText, Link2, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useQuestionnaires, type Payload } from "@/components/questions/shared";
import { answerNode, buildEvidenceGraph, connected, docNode, documentImpact, unsourcedAnswers, type EvidenceGraph, type GraphNode } from "@/lib/evidence-graph";
import { t } from "@/lib/i18n";

/**
 * Evidence map: which documents back which answers, and which buyers received them. Select a document to see
 * everything that rests on it, so a factory knows whom to tell when a certificate changes or expires.
 */
export default function EvidenceMapPage() {
  const { data, error } = useQuestionnaires();
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="Evidence map"
          title="What rests on each document"
          note={t("Each line joins a document to an answer it backs, and the answer to the buyer who received it. Select a document to see who is affected if it changes or expires.")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <DemoDataBadge />
            <Link href="/factory/documents" className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 px-4 text-sm">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("Your documents")}
            </Link>
          </div>
        </DashboardHeader>
        {error && <p role="alert" className="text-danger">{error}</p>}
        {data ? <EvidenceMap data={data} /> : !error && <p className="text-ink-muted">{t("Loading…")}</p>}
      </main>
    </div>
  );
}

const SOON = 60;
const W = 960;
const COL = { document: { x: 0, w: 240, chars: 30 }, answer: { x: 340, w: 300, chars: 40 }, buyer: { x: 740, w: 220, chars: 26 } } as const;
const ROW = 34;
const NODE_H = 26;

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Places answers in rows grouped by document; documents and buyers sit level with the answers they connect to. */
function layout(g: EvidenceGraph, order: string[]) {
  const y = new Map<string, number>();
  const answers = g.nodes.filter((n) => n.kind === "answer");
  const rank = new Map(order.map((id, i) => [id, i]));
  answers
    .sort((a, b) => (rank.get(a.docId ? docNode(a.docId) : "") ?? 1e9) - (rank.get(b.docId ? docNode(b.docId) : "") ?? 1e9) || (a.buyer ?? "").localeCompare(b.buyer ?? ""))
    .forEach((a, i) => y.set(a.id, i * ROW));
  const level = (kind: "document" | "buyer", ends: (n: GraphNode) => string[]) => {
    const placed = g.nodes
      .filter((n) => n.kind === kind)
      .map((n) => {
        const ys = ends(n).map((id) => y.get(id)).filter((v): v is number => v !== undefined);
        return { id: n.id, target: ys.length ? ys.reduce((s, v) => s + v, 0) / ys.length : Infinity };
      })
      .sort((a, b) => a.target - b.target);
    let next = 0;
    for (const p of placed) {
      const at = Math.max(Number.isFinite(p.target) ? p.target : next, next);
      y.set(p.id, at);
      next = at + ROW;
    }
  };
  level("document", (n) => g.edges.filter((e) => e.from === n.id && e.kind === "backs").map((e) => e.to));
  level("buyer", (n) => g.edges.filter((e) => e.to === n.id).map((e) => e.from));
  const height = Math.max(ROW, ...[...y.values()].map((v) => v + NODE_H)) + 8;
  return { y, height };
}

function EvidenceMap({ data }: { data: Payload }) {
  const graph = useMemo(() => buildEvidenceGraph(data), [data]);
  const impact = useMemo(() => documentImpact(graph), [graph]);
  const inUse = impact.filter((d) => d.answers.length > 0);
  const [selected, setSelected] = useState<string | null>(inUse[0]?.id ?? null);
  const lit = useMemo(() => (selected ? connected(graph, selected) : null), [graph, selected]);
  const { y, height } = useMemo(() => layout(graph, impact.map((d) => d.id)), [graph, impact]);
  const questionnaireOf = useMemo(() => new Map(data.questionnaires.flatMap((q) => q.questions.map((x) => [x.id, q.id] as const))), [data]);
  const unsourced = unsourcedAnswers(graph);
  const answers = graph.nodes.filter((n) => n.kind === "answer");

  if (answers.length === 0) {
    return (
      <div className="glass-card p-6 text-ink-muted">
        {t("No answers sent yet. When you send an answer, the map shows the document behind it and the buyer who received it.")}{" "}
        <Link href="/factory/questionnaire" className="font-medium text-brand underline underline-offset-4">{t("Open your questions")}</Link>
      </div>
    );
  }

  const soon = inUse.filter((d) => d.daysLeft !== null && d.daysLeft <= SOON);
  const sourcedShare = Math.round(((answers.length - unsourced.length) / answers.length) * 100);
  const tiles = [
    { label: "Documents in use", value: `${inUse.length} / ${impact.length}` },
    { label: "Answers with a source document", value: `${sourcedShare}%` },
    { label: "Most relied on", value: inUse[0] ? `${inUse[0].answers.length} ${t("answers")}` : "–", note: inUse[0]?.title },
    { label: `Expiring within ${SOON} days`, value: String(soon.length), warn: soon.length > 0 },
  ];
  const node = (id: string) => graph.nodes.find((n) => n.id === id);

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="glass-card flex flex-col gap-1 p-4">
            <span className={`font-display text-2xl font-semibold [font-variant-numeric:tabular-nums] ${tile.warn ? "text-warning" : "text-ink"}`}>
              {tile.warn && <AlertTriangle className="mr-1.5 inline h-5 w-5 align-[-2px]" aria-hidden="true" />}
              {tile.value}
            </span>
            <span className="text-sm text-ink-muted">{t(tile.label)}</span>
            {tile.note && <span className="truncate text-xs text-ink-faint" title={tile.note}>{tile.note}</span>}
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <figure className="glass-card overflow-x-auto p-4">
          <figcaption className="mb-3 grid min-w-[720px] grid-cols-[240fr_100fr_300fr_100fr_220fr] text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
            <span>{t("Documents")}</span><span /><span>{t("Answers sent")}</span><span /><span>{t("Buyers")}</span>
          </figcaption>
          <svg viewBox={`0 0 ${W} ${height}`} className="h-auto min-w-[720px] w-full" role="group" aria-label={t("Evidence map")}>
            {graph.edges.map((e) => {
              const from = node(e.from)!;
              const to = node(e.to)!;
              const on = !lit || (lit.has(e.from) && lit.has(e.to));
              const y1 = (y.get(e.from) ?? 0) + NODE_H / 2;
              const y2 = (y.get(e.to) ?? 0) + NODE_H / 2;
              if (e.kind === "reused-as") {
                const x = COL.answer.x;
                return <path key={`${e.from}>${e.to}`} d={`M ${x} ${y1} C ${x - 46} ${y1}, ${x - 46} ${y2}, ${x} ${y2}`} fill="none" strokeDasharray="4 4" strokeWidth={on ? 1.75 : 1} className={on ? "stroke-success" : "stroke-line"} opacity={on ? 1 : 0.35} />;
              }
              const x1 = COL[from.kind].x + COL[from.kind].w;
              const x2 = COL[to.kind].x;
              const dx = (x2 - x1) / 2;
              return <path key={`${e.from}>${e.to}`} d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`} fill="none" strokeWidth={on && lit ? 1.75 : 1} className={on && lit ? "stroke-brand" : "stroke-line-strong"} opacity={on ? 1 : 0.3} />;
            })}
            {graph.nodes.map((n) => {
              const c = COL[n.kind];
              const top = y.get(n.id) ?? 0;
              const doc = n.kind === "document" ? impact.find((d) => d.id === n.id) : undefined;
              const warn = doc && doc.answers.length > 0 && doc.daysLeft !== null && doc.daysLeft <= SOON;
              const on = !lit || lit.has(n.id);
              const isSel = selected === n.id;
              const choose = () => setSelected(isSel ? null : n.id);
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`${t(n.kind === "document" ? "Document" : n.kind === "answer" ? "Answer" : "Buyer")}: ${n.label}`}
                  onClick={choose}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      choose();
                    }
                  }}
                  className="group cursor-pointer outline-none"
                  opacity={on ? 1 : 0.35}
                >
                  <title>{n.label}</title>
                  <rect
                    x={c.x}
                    y={top}
                    width={c.w}
                    height={NODE_H}
                    rx={n.kind === "buyer" ? NODE_H / 2 : 6}
                    strokeWidth={isSel ? 2 : 1}
                    className={`${n.kind === "document" ? "fill-brand-soft" : "fill-surface"} ${isSel ? "stroke-brand" : warn ? "stroke-warning" : "stroke-line-strong"} transition-[stroke] duration-150 group-hover:stroke-brand group-focus-visible:stroke-brand group-focus-visible:[stroke-width:3]`}
                  />
                  <text x={c.x + 10} y={top + NODE_H / 2 + 4} className={`text-[12px] ${n.kind === "answer" ? "fill-ink-muted" : "fill-ink font-medium"}`}>
                    {cut(n.label, warn ? c.chars - 3 : c.chars)}
                  </text>
                  {warn && (
                    <path d={`M ${c.x + c.w - 18} ${top + 19} l 7 -12 l 7 12 z`} className="fill-warning" aria-hidden="true" />
                  )}
                </g>
              );
            })}
          </svg>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true"><line x1="0" x2="22" y1="3" y2="3" className="stroke-line-strong" strokeWidth="1.5" /></svg>{t("backs / sent to")}</span>
            <span className="inline-flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true"><line x1="0" x2="22" y1="3" y2="3" className="stroke-success" strokeWidth="1.75" strokeDasharray="4 4" /></svg>{t("answer reused for another buyer")}</span>
            <span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />{t(`expires within ${SOON} days`)}</span>
          </p>
        </figure>

        <aside className="glass-card flex flex-col gap-4 p-5" aria-live="polite">
          {selected ? <Detail id={selected} graph={graph} data={data} impact={impact} questionnaireOf={questionnaireOf} onSelect={setSelected} /> : <p className="text-sm text-ink-muted">{t("Select a document, an answer or a buyer to see what it connects to.")}</p>}
        </aside>
      </div>

      {unsourced.length > 0 && (
        <section className="glass-card flex flex-col gap-2 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />{t("Answers sent without a source document")} ({unsourced.length})</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {unsourced.map((n) => <li key={n.id}>{n.label} <span className="text-ink-faint">· {n.buyer}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function Detail({ id, graph, data, impact, questionnaireOf, onSelect }: { id: string; graph: EvidenceGraph; data: Payload; impact: ReturnType<typeof documentImpact>; questionnaireOf: Map<string, string>; onSelect: (id: string) => void }) {
  const n = graph.nodes.find((x) => x.id === id);
  if (!n) return null;
  const label = (nid: string) => graph.nodes.find((x) => x.id === nid)?.label ?? nid;
  const answerLink = (nid: string) => `/factory/questionnaire/${questionnaireOf.get(nid.slice(4)) ?? ""}`;

  if (n.kind === "document") {
    const d = impact.find((x) => x.id === id)!;
    const byBuyer = new Map<string, string[]>();
    for (const a of d.answers) {
      const b = graph.nodes.find((x) => x.id === a)?.buyer ?? "";
      byBuyer.set(b, [...(byBuyer.get(b) ?? []), a]);
    }
    return (
      <>
        <header className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{t("Document")}</span>
          <h2 className="text-lg font-semibold text-ink [text-wrap:balance]">{n.label}</h2>
          <Validity daysLeft={d.daysLeft} validUntil={d.validUntil} />
        </header>
        <p className="text-sm text-ink-muted">
          {d.answers.length === 0
            ? t("No answer rests on this document yet.")
            : `${d.answers.length} ${t(d.answers.length === 1 ? "answer" : "answers")}, ${d.buyers.length} ${t(d.buyers.length === 1 ? "buyer" : "buyers")}. ${t("They rest on this document. If it changes, check these:")}`}
        </p>
        {[...byBuyer].map(([buyer, list]) => (
          <div key={buyer} className="flex flex-col gap-1.5">
            <button type="button" onClick={() => onSelect(`buyer:${buyer}`)} className="inline-flex min-h-[32px] items-center gap-1.5 self-start text-sm font-medium text-ink hover:text-brand"><Users className="h-4 w-4" aria-hidden="true" />{buyer}</button>
            <ul className="flex flex-col gap-1 border-l border-line pl-3">
              {list.map((a) => <li key={a}><Link href={answerLink(a)} className="text-sm text-ink-muted underline-offset-4 hover:text-brand hover:underline">{label(a)}</Link></li>)}
            </ul>
          </div>
        ))}
      </>
    );
  }

  if (n.kind === "answer") {
    const a = data.answers[id.slice(4)];
    const from = a?.reusedFrom ? answerNode(a.reusedFrom) : null;
    return (
      <>
        <header className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">{t("Answer")} · {n.buyer}</span>
          <h2 className="text-base font-semibold text-ink [text-wrap:balance]">{n.label}</h2>
        </header>
        {a?.answer && <p className="text-sm text-ink-muted [text-wrap:pretty]">{cut(a.answer, 280)}</p>}
        {a?.quote && <blockquote className="border-l-2 border-brand pl-3 text-sm italic text-ink-muted">“{cut(a.quote, 220)}”</blockquote>}
        <div className="flex flex-col gap-2 text-sm">
          {n.docId ? (
            <button type="button" onClick={() => onSelect(docNode(n.docId!))} className="inline-flex min-h-[32px] items-center gap-1.5 self-start font-medium text-brand hover:underline"><FileText className="h-4 w-4" aria-hidden="true" />{label(docNode(n.docId))}</button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-warning"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("No source document")}</span>
          )}
          {from && graph.nodes.some((x) => x.id === from) && (
            <button type="button" onClick={() => onSelect(from)} className="inline-flex min-h-[32px] items-center gap-1.5 self-start text-ink-muted hover:text-brand"><Link2 className="h-4 w-4" aria-hidden="true" />{t("Reused from")}: {cut(label(from), 48)}</button>
          )}
          <Link href={answerLink(id)} className="self-start font-medium text-brand underline underline-offset-4">{t("Open the questionnaire")}</Link>
        </div>
      </>
    );
  }

  const sent = graph.edges.filter((e) => e.to === id).map((e) => e.from);
  const docs = [...new Set(sent.map((a) => graph.nodes.find((x) => x.id === a)?.docId).filter((d): d is string => !!d))];
  return (
    <>
      <header className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint"><Users className="h-3.5 w-3.5" aria-hidden="true" />{t("Buyer")}</span>
        <h2 className="text-lg font-semibold text-ink">{n.label}</h2>
      </header>
      <p className="text-sm text-ink-muted">{`${sent.length} ${t(sent.length === 1 ? "answer" : "answers")} ${t("sent, resting on")} ${docs.length} ${t(docs.length === 1 ? "document" : "documents")}:`}</p>
      <ul className="flex flex-col gap-1">
        {docs.map((d) => (
          <li key={d}>
            <button type="button" onClick={() => onSelect(docNode(d))} className="inline-flex min-h-[32px] items-center gap-1.5 text-left text-sm font-medium text-ink hover:text-brand"><FileText className="h-4 w-4 shrink-0" aria-hidden="true" />{label(docNode(d))}</button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Validity({ daysLeft, validUntil }: { daysLeft: number | null; validUntil: string | null }) {
  if (daysLeft === null || !validUntil) return <span className="text-sm text-ink-faint">{t("No expiry date")}</span>;
  const date = new Date(validUntil).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (daysLeft < 0) return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("Expired")} {date}</span>;
  if (daysLeft <= SOON) return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("Expires in")} {daysLeft} {t("days")} ({date})</span>;
  return <span className="text-sm text-ink-muted">{t("Valid until")} {date}</span>;
}
