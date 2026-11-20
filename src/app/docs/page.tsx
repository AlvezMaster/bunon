"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bot, Boxes, CheckCircle2, ClipboardList, Cloud, Database, Eye, FileSearch, FileText, Github, Languages, Lock, Network, Play, Quote, Repeat2, ScanText, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PLANS, formatBdt } from "@/lib/plans";

interface Stats {
  generatedAt: string;
  organisations: { factories: number; buyers: number };
  questionnaires: number;
  questions: number;
  answers: { sent: number; withSource: number; reused: number };
  documents: number;
  activityLog: { latestEntry: number; checked: number; chainOk: boolean };
  system: { ai: { where: string; model: string | null }; database: string; vectorDatabase: string; fileStorage: string };
  mcp: { factory: string[]; buyer: string[] };
  watchedRules: number;
}

const VIDEO = "https://youtu.be/n3jZHBDwask";
const GITHUB = "https://github.com/AlvezMaster/bunon";

const SECTIONS = [
  ["live", "Live numbers"],
  ["fit", "Built for ComplianceOS"],
  ["problem", "The problem"],
  ["solution", "How Bunon works"],
  ["action-plan", "Compliance Action Plan"],
  ["system", "Running now"],
  ["architecture", "Architecture"],
  ["apis", "APIs and MCP"],
  ["responsible", "Responsible AI"],
  ["results", "Measured results"],
  ["business", "Business model"],
  ["roadmap", "Roadmap"],
  ["team", "Team"],
] as const;

const TEAM = [
  { name: "Alvez Master", role: "Team lead" },
  { name: "Arian Mollik Wasi", role: "Team member" },
  { name: "Tanvir Alam", role: "Team member" },
  { name: "Faiza Faria Borna", role: "Team member" },
];

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");

function Section({ id, title, lead, children }: { id: string; n?: number; title: string; lead?: string; children: React.ReactNode }) {
  // Numbered by its place in the section menu, so adding a section renumbers the rest.
  const n = SECTIONS.findIndex(([s]) => s === id) + 1;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="section-index [font-variant-numeric:tabular-nums]">{String(n).padStart(2, "0")}</p>
        <h2 id={`${id}-title`} className="font-display text-[clamp(1.85rem,3vw+0.5rem,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink [text-wrap:balance]">{title}</h2>
        {lead && <p className="max-w-[68ch] text-base leading-relaxed text-ink-muted [text-wrap:pretty]">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Metric({ value, label, note }: { value: React.ReactNode; label: string; note?: string }) {
  return (
    <li className="glass-card flex flex-col gap-1 p-4">
      <span className="font-display text-3xl font-semibold text-ink [font-variant-numeric:tabular-nums]">{value}</span>
      <span className="text-sm text-ink-muted">{label}</span>
      {note && <span className="text-xs text-ink-faint">{note}</span>}
    </li>
  );
}

function Flow({ steps }: { steps: Array<{ Icon: React.ElementType; title: string; text: string }> }) {
  return (
    <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
      {steps.map(({ Icon, title, text }, i) => (
        <li key={title} className="flex flex-col items-stretch lg:flex-1 lg:flex-row lg:items-center">
          <div className="glass-card flex h-full flex-1 flex-col gap-1.5 p-4">
            <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            <span className="text-sm font-semibold text-ink">{title}</span>
            <span className="text-xs leading-relaxed text-ink-muted">{text}</span>
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="flex justify-center py-1 text-ink-faint lg:px-1.5 lg:py-0">
              <ArrowDown className="h-4 w-4 lg:hidden" />
              <ArrowRight className="hidden h-4 w-4 lg:block" />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * /docs: Bunon's live pitch deck, technical write-up and system dashboard on one public page. The numbers and the
 * running system come from /api/docs/stats (aggregate counts only) and refresh every 30 seconds; the plans and
 * prices come from the same code the app bills with.
 */
export default function DocsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [active, setActive] = useState<string>("live");

  useEffect(() => {
    const load = () => fetch("/api/docs/stats", { cache: "no-store" }).then((r) => r.json()).then(setStats).catch(() => undefined);
    void load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-30% 0px -60% 0px" });
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) seen.observe(el);
    });
    return () => seen.disconnect();
  }, []);

  const n = (v: number | undefined) => (stats ? (v ?? 0).toLocaleString("en-US") : "–");
  const sourcedPct = stats && stats.answers.sent ? `${Math.round((stats.answers.withSource / stats.answers.sent) * 100)}%` : "–";
  const updated = stats ? new Date(stats.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-line">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-14 sm:px-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Bunon docs · live{updated ? ` · updated ${updated}` : ""}
          </p>
          <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,5vw+1rem,4.5rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-ink [text-wrap:balance]">
            Answer every buyer <em className="not-italic text-accent">once</em>.
          </h1>
          <p className="max-w-[62ch] text-lg leading-relaxed text-ink-muted [text-wrap:pretty]">
            Bunon (বুনন, &ldquo;weaving&rdquo;) is a compliance OS for Bangladesh&rsquo;s garment factories. AI drafts each buyer&rsquo;s compliance answer from the factory&rsquo;s own documents and quotes the sentence it used; a person checks and sends it; every answer is sealed in a tamper-evident record and reused when the next buyer asks the same thing.
          </p>
          <p className="max-w-[62ch] text-lg leading-relaxed text-ink [text-wrap:pretty]">
            When a law, the minimum wage or a buyer&rsquo;s code of conduct changes, Bunon detects it and builds a <strong className="font-semibold">Compliance Action Plan</strong>: what the change affects, a redrafted policy and the fixes, each approved by a person.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="btn-primary-action min-h-[48px]">
              Try the live demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href={VIDEO} target="_blank" rel="noopener noreferrer" className="btn-tactile-hollow inline-flex min-h-[48px] items-center gap-2 px-5">
              <Play className="h-4 w-4" aria-hidden="true" />
              3-minute video
            </a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn-tactile-hollow inline-flex min-h-[48px] items-center gap-2 px-5">
              <Github className="h-4 w-4" aria-hidden="true" />
              Source code
            </a>
          </div>
          <p className="text-xs text-ink-faint">International AI Builders Congress 2026 · Idea to Unicorn · JusticeSphere AI → ComplianceOS · Team Maku. Demo companies are fictional and labelled.</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Section menu */}
        <nav aria-label="Sections" className="hidden lg:block">
          <ol className="sticky top-24 flex flex-col gap-0.5 border-l border-line">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={active === id ? "true" : undefined} className={`-ml-px flex min-h-[36px] items-center gap-2 border-l-2 pl-3 text-sm transition-colors duration-150 ${active === id ? "border-accent font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
                  <span className="w-5 text-xs text-ink-faint [font-variant-numeric:tabular-nums]">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="flex min-w-0 flex-col gap-20">
          <Section id="live" n={1} title="Live numbers" lead="Read from the running product as you open this page, refreshed every 30 seconds. They include the fictional demo companies.">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric value={n(stats?.organisations.factories)} label="Factories" />
              <Metric value={n(stats?.organisations.buyers)} label="Buyers" />
              <Metric value={n(stats?.questionnaires)} label="Questionnaires" note={stats ? `${n(stats.questions)} questions` : undefined} />
              <Metric value={n(stats?.documents)} label="Documents on file" />
              <Metric value={n(stats?.answers.sent)} label="Answers sent" />
              <Metric value={sourcedPct} label="Answers with their source sentence" />
              <Metric value={n(stats?.answers.reused)} label="Answers reused for another buyer" />
              <Metric
                value={n(stats?.activityLog.latestEntry)}
                label="Activity log entries"
                note={stats ? (stats.activityLog.chainOk ? `Hash chain verified (last ${stats.activityLog.checked})` : "Hash chain check failed") : undefined}
              />
            </ul>
          </Section>

          <Section id="fit" title="Built for ComplianceOS" lead="JusticeSphere AI asks for systems that turn dense legal and regulatory complexity into actionable, auditable intelligence. Here is each part of the ComplianceOS brief, and what in Bunon answers it.">
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-sm md:min-w-[680px]">
                <caption className="sr-only">ComplianceOS brief mapped to Bunon</caption>
                <thead className="hidden text-xs uppercase tracking-[0.06em] text-ink-faint md:table-header-group">
                  <tr className="border-b border-line"><th scope="col" className="px-4 py-3">The brief asks for</th><th scope="col" className="px-4 py-3">Bunon</th><th scope="col" className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["Detect a regulatory change (agents monitoring legislative feeds)", "Bunon watches the rules that apply to a factory (minimum wage, wage payment, working hours, buyers' codes) and reports a new version on its own.", "Built · demo rule versions; real Gazette, DIFE and EUR-Lex feeds next", false],
                    ["Generate a Compliance Action Plan", "Regulatory diff (what changed, including number words), the documents and sent answers that rest on the old wording, and the buyers to tell.", "Built · 10 / 10 on a labelled stress test", true],
                    ["Updated policy drafts", "The affected policy passage, redrafted with the new values, for a person to check.", "Built", true],
                    ["List of required fixes", "A fix list; a person approves each fix, and every approval is written to the hash-chained activity log.", "Built", true],
                    ["RAG over legal and compliance text", "Hybrid search (keywords + pgvector) over each factory's compliance documents, with contextual chunking; answers quote their source word for word.", "Built · 16 / 16 right document in the top 4", true],
                    ["Vision for physical compliance documents", "Photos and scans of licences are read by Qwen vision and marked for a person to check.", "Built", true],
                    ["Documents and digital workflows together, beyond static checklists", "Buyer questionnaires, answer reuse, the evidence map and the document library work on the same documents.", "Built", true],
                    ["Synthetic edge cases to stress-test automated auditing", "Labelled synthetic rule changes, including look-alike numbers, test the action plan.", "Built", true],
                  ].map(([ask, bunon, status, done]) => (
                    <tr key={String(ask)} className="flex flex-col gap-1.5 py-3 md:table-row md:py-0">
                      <th scope="row" className="block px-4 align-top font-medium text-ink md:table-cell md:py-3">{ask}</th>
                      <td className="block px-4 align-top text-ink-muted md:table-cell md:py-3">{bunon}</td>
                      <td className="block px-4 align-top md:table-cell md:py-3">
                        <span className={`inline-flex items-start gap-1.5 text-xs font-medium ${done ? "text-success" : "text-brand"}`}>
                          <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="problem" n={2} title="Every buyer asks the same questions, in its own form" lead="A factory sells to many brands, and each brand sends its own questionnaire about the same things: fire safety, wages, working hours, child labour. Compliance officers copy the same facts from folders of licences and policies into form after form, and a wrong or out-of-date answer can cost an order.">
            <ul className="grid gap-3 sm:grid-cols-3">
              <Metric value="3,555" label="Export garment factories in Bangladesh" />
              <Metric value="871" label="Questions in one industry questionnaire" />
              <Metric value="45%" label="Of surveyed facilities spend $5,000–20,000 a year on audits" note="WRAP, 2023" />
            </ul>
          </Section>

          <Section id="solution" n={3} title="How Bunon works" lead="Five steps, the same for every buyer. Nothing reaches a buyer until a person sends it.">
            <Flow
              steps={[
                { Icon: FileText, title: "Upload once", text: "Licences, policies and reports: PDF, text or a photo of a paper document." },
                { Icon: Sparkles, title: "AI drafts", text: "Qwen drafts each answer from the factory's own documents only." },
                { Icon: Quote, title: "Quotes its source", text: "Each answer carries the exact sentence it rests on; Bunon checks it word for word." },
                { Icon: UserCheck, title: "A person sends", text: "The compliance officer approves, edits or writes the answer." },
                { Icon: Repeat2, title: "Reused", text: "The next buyer asking the same thing, in other words, gets it pre-filled." },
              ]}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="glass-card flex flex-col gap-1.5 p-5"><FileSearch className="h-5 w-5 text-brand" aria-hidden="true" /><span className="font-semibold text-ink">Document library and viewer</span><span className="text-sm text-ink-muted">The nine documents buyers usually ask for, marked on file, missing or expiring; every document opens with its quoted sentences highlighted.</span></div>
              <div className="glass-card flex flex-col gap-1.5 p-5"><Network className="h-5 w-5 text-brand" aria-hidden="true" /><span className="font-semibold text-ink">Evidence map</span><span className="text-sm text-ink-muted">A graph of documents → answers → buyers: who is affected when a certificate changes or expires.</span></div>
              <div className="glass-card flex flex-col gap-1.5 p-5"><Languages className="h-5 w-5 text-brand" aria-hidden="true" /><span className="font-semibold text-ink">Bangla and English</span><span className="text-sm text-ink-muted">The whole app in both languages; Bangla questions search English documents through a glossary.</span></div>
            </div>
          </Section>

          <Section id="action-plan" title="Compliance Action Plan" lead="The heart of ComplianceOS: a rule changes, and the factory knows within seconds what it affects and what to fix. Nothing is changed or sent automatically; a person approves every fix.">
            <Flow
              steps={[
                { Icon: Eye, title: "Change detected", text: "A watched rule has a newer version than the one the factory last reviewed." },
                { Icon: ScanText, title: "Regulatory diff", text: "Which values changed, in digits or words (seventh → fifth)." },
                { Icon: Network, title: "Impact", text: "Documents stating the old value, documents already meeting the new one, sent answers and buyers affected." },
                { Icon: FileText, title: "Redraft + fixes", text: "The policy passage with the new values, and the list of fixes." },
                { Icon: UserCheck, title: "Approved and logged", text: "A person approves each fix; each approval is a hash-chained activity log entry." },
              ]}
            />
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <figure className="glass-card flex flex-col gap-3 p-5">
                <figcaption className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Example from the demo (a labelled demo rule change)</figcaption>
                <div className="flex flex-col gap-2 text-sm">
                  <p className="font-medium text-ink">Garment sector minimum wage</p>
                  <p className="text-ink-muted"><span className="line-through decoration-danger/60">BDT 12,500 per month</span> <ArrowRight className="inline h-3.5 w-3.5" aria-label="becomes" /> <span className="font-semibold text-ink">BDT 15,000 per month</span></p>
                  <p className="flex items-start gap-2 text-ink"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />Wage and benefits policy: states the old wording</p>
                  <p className="rounded-lg border border-success/40 bg-success-soft p-3 text-ink">&ldquo;All workers are paid at or above the legal minimum wage for the garment sector, which is BDT 15,000 per month for the entry grade.&rdquo;</p>
                  <ol className="flex flex-col gap-1 text-ink-muted">
                    <li>1. Update &ldquo;Wage and benefits policy&rdquo; (12,500 → 15,000) and upload the new version.</li>
                    <li>2. Check that practice matches the new rule: payroll, records and notices on the floor.</li>
                  </ol>
                </div>
              </figure>
              <div className="flex flex-col gap-3">
                <Metric value="10 / 10" label="Correct plans on 10 labelled synthetic rule changes" note="0 documents missed, 0 false alarms; 5 / 5 redrafts carry the new value" />
                <Metric value={stats ? String(stats.watchedRules) : "–"} label="Rules watched for every factory" note="Demo versions now; real feeds (Gazette, DIFE, EUR-Lex, buyers' codes) next" />
                <Link href="/login?next=%2Ffactory%2Faction-plan" className="btn-primary-action min-h-[48px] self-start">
                  Open the action plan
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Section>

          <Section id="system" n={4} title="Running right now" lead="What the live site is using at this moment, read from its own settings.">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { Icon: Sparkles, label: "AI drafting", value: stats ? `${stats.system.ai.model ?? "–"}` : "–", note: stats?.system.ai.where },
                { Icon: FileSearch, label: "Embeddings", value: "Qwen3-Embedding 0.6B", note: "Multilingual, 1024 dimensions" },
                { Icon: Boxes, label: "Vector database", value: stats?.system.vectorDatabase ?? "–", note: "Nearest passages by cosine distance" },
                { Icon: Database, label: "Main database", value: stats?.system.database ?? "–", note: "Per-factory records, activity log" },
                { Icon: Cloud, label: "Original files", value: stats?.system.fileStorage ?? "–", note: "Private, 5-minute signed links" },
                { Icon: Bot, label: "MCP servers", value: stats ? `2 servers · ${stats.mcp.factory.length + stats.mcp.buyer.length} tools` : "–", note: `Rules watched for changes: ${stats?.watchedRules ?? "–"}` },
              ].map(({ Icon, label, value, note }) => (
                <li key={label} className="glass-card flex items-start gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">{label}</span>
                    <span className="truncate text-sm font-semibold text-ink" title={value}>{value}</span>
                    {note && <span className="text-xs text-ink-muted">{note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="architecture" n={5} title="Architecture and data flow" lead="Three pipelines in the app's own TypeScript code: documents become searchable passages, a buyer's question becomes a checked, sourced answer, and a rule change becomes a Compliance Action Plan.">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Documents in</p>
              <Flow
                steps={[
                  { Icon: FileText, title: "Upload", text: "PDF, text, or a photo (JPG, PNG); original kept privately on Cloudinary." },
                  { Icon: ScanText, title: "Extract", text: "unpdf for PDFs; Qwen vision copies the text of photos exactly." },
                  { Icon: Boxes, title: "Contextual chunks", text: "Paragraph and sentence lines; each passage keeps its title, section and opening sentence." },
                  { Icon: FileSearch, title: "Embed", text: "Qwen3-Embedding; stored in D1 and in pgvector on Supabase." },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Answers out</p>
              <Flow
                steps={[
                  { Icon: Quote, title: "Buyer question", text: "English or Bangla, from any buyer's questionnaire." },
                  { Icon: FileSearch, title: "Hybrid search", text: "Keywords + pgvector meaning search, fused by reciprocal rank." },
                  { Icon: Sparkles, title: "Qwen drafts", text: "Answer + exact quote + source, from that factory's documents only." },
                  { Icon: ShieldCheck, title: "Checks", text: "Quote must appear word for word; a second model must agree; else a person answers." },
                  { Icon: Lock, title: "Sent and sealed", text: "A person sends it; SHA-256 hash-chained activity log." },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Rule changes in</p>
              <Flow
                steps={[
                  { Icon: Eye, title: "Watched rule", text: "A newer version than the factory's last review is reported on its own." },
                  { Icon: ScanText, title: "Regulatory diff", text: "Changed values, as digits or number words." },
                  { Icon: FileSearch, title: "Impact search", text: "Hybrid search for the old wording; a value counts only beside the same kind of word." },
                  { Icon: Network, title: "Evidence graph", text: "Sent answers and buyers that rest on the affected documents." },
                  { Icon: ClipboardList, title: "Plan, approved", text: "Redraft and fix list; each approval written to the activity log." },
                ]}
              />
            </div>
            <p className="text-sm text-ink-muted">Stack: Next.js 16 on Vercel · TypeScript · Cloudflare D1 · Supabase Postgres + pgvector · Cloudinary · Qwen (Cloudflare Workers AI online, Ollama on a factory&rsquo;s own computer) · Recharts · Vercel Cron.</p>
          </Section>

          <Section id="apis" n={6} title="APIs and MCP servers" lead="Factories and buyers can connect their own AI agents through two MCP servers (Streamable HTTP, JSON-RPC 2.0). Tool lists below are read from the running servers.">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: "bunon-factory-mcp", path: "/api/mcp/factory", note: "Scoped to one factory. Agents can read, search, draft and prepare answers; only a person can send.", tools: stats?.mcp.factory },
                { name: "bunon-buyer-mcp", path: "/api/mcp/buyer", note: "Read-only, scoped to one buyer: answers with their source sentence, compared across factories.", tools: stats?.mcp.buyer },
              ].map((s) => (
                <div key={s.name} className="glass-card flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{s.name}</span>
                    <code className="rounded bg-brand-soft px-2 py-0.5 text-xs text-brand">{s.path}</code>
                  </div>
                  <p className="text-sm text-ink-muted">{s.note}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {(s.tools ?? []).map((t) => <li key={t}><code className="rounded border border-line bg-surface px-2 py-0.5 text-xs text-ink">{t}</code></li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-sm md:min-w-[560px]">
                <caption className="sr-only">Main HTTP endpoints</caption>
                <thead className="text-xs uppercase tracking-[0.06em] text-ink-faint"><tr className="border-b border-line"><th scope="col" className="px-4 py-3">Endpoint</th><th scope="col" className="px-4 py-3">What it does</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["POST /api/documents", "Upload a document (PDF, text, photo) or search a factory's documents"],
                    ["GET /api/documents/view", "One document's full text, for the document viewer"],
                    ["GET /api/questionnaire", "Questionnaires, answers and reuse suggestions for the signed-in side"],
                    ["POST /api/questionnaire", "Draft with AI, prepare, approve and send answers; buyers send questionnaires"],
                    ["GET /api/action-plan", "Watched rules and the factory's reviewed versions and approved fixes"],
                    ["GET /api/audit-ledger", "The tamper-evident activity log, with hash-chain verification"],
                    ["GET /api/docs/stats", "The live numbers on this page (aggregate counts only)"],
                  ].map(([e, d]) => <tr key={e}><td className="px-4 py-2.5 align-top"><code className="break-words text-xs text-ink">{e}</code></td><td className="px-4 py-2.5 text-ink-muted">{d}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="responsible" n={7} title="Responsible AI" lead="Built so an AI mistake cannot quietly reach a buyer.">
            <ul className="grid gap-3 md:grid-cols-2">
              {[
                ["Never guesses", "A draft needs a quote that appears word for word in the factory's document, and a second model must agree. Otherwise the question goes to a person."],
                ["A person sends every answer", "AI drafts and agents prepare; only a person at the factory can send, link buyers or approve fixes. The server enforces it."],
                ["Open models, on your own computer", "Qwen can run on the factory's own computer through Ollama, so documents never leave it. Online, personal details are masked before any cloud call."],
                ["Each factory sees only its own data", "Every request is scoped to one organisation; buyers see answers and titles, never a factory's files."],
                ["Tamper-evident record", "Every sent answer, agent action and approval is written to a SHA-256 hash-chained activity log anyone on the account can verify."],
                ["Honest labels", "Demo companies, the simulated certificate registry, demo rule changes and test-mode payments are labelled on screen."],
              ].map(([title, text]) => (
                <li key={title} className="glass-card flex gap-3 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" /><span className="flex flex-col gap-1"><span className="font-semibold text-ink">{title}</span><span className="text-sm text-ink-muted">{text}</span></span></li>
              ))}
            </ul>
          </Section>

          <Section id="results" n={8} title="Measured results" lead="Our own tests on small labelled sets and synthetic documents. Real factory pilots are the next step.">
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-sm md:min-w-[560px]">
                <caption className="sr-only">Measured results</caption>
                <thead className="text-xs uppercase tracking-[0.06em] text-ink-faint"><tr className="border-b border-line"><th scope="col" className="px-4 py-3">Test</th><th scope="col" className="px-4 py-3">Result</th></tr></thead>
                <tbody className="divide-y divide-line [font-variant-numeric:tabular-nums]">
                  {[
                    ["Right document in the top 4 (16 reworded questions, 4 in Bangla; live site, pgvector)", "16 / 16 (first: 14 / 16)"],
                    ["Correct cited answers, local Qwen 3.5 4B (13 labelled questions)", "8 / 10, with 0 wrong drafts kept and 3 / 3 left for a person"],
                    ["Answer reuse (40 questions from two more buyers)", "18 / 24 repeats found, 16 / 16 look-alikes left alone, 0 wrong suggestions"],
                    ["Compliance Action Plan (10 labelled synthetic rule changes)", "10 / 10 correct plans, 0 missed, 0 false alarms"],
                    ["Language bias check (after fixes)", "Bangla 8 / 10 = English 8 / 10"],
                    ["Draft time", "about 3 s per answer (local Qwen 3.5 4B)"],
                    ["Automated tests", "95 passing"],
                  ].map(([test, result]) => <tr key={test}><td className="px-4 py-2.5 text-ink-muted">{test}</td><td className="px-4 py-2.5 font-medium text-ink">{result}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="business" n={9} title="Business model" lead="Factories pay a monthly plan in taka; buyers are always free, so each buyer brings its factories. Prices below come from the same code the app bills with.">
            <ul className="grid gap-3 md:grid-cols-3">
              {Object.values(PLANS).map((p) => (
                <li key={p.name} className="glass-card flex flex-col gap-2 p-5">
                  <span className="font-semibold text-ink">{p.name}</span>
                  <span className="font-display text-2xl font-semibold text-ink [font-variant-numeric:tabular-nums]">{p.priceBdt ? `${formatBdt(p.priceBdt)} / month` : "By quote"}</span>
                  <span className="text-sm text-ink-muted">{p.tagline}</span>
                  <ul className="mt-1 flex flex-col gap-1">{p.features.slice(0, 4).map((f) => <li key={f} className="flex gap-2 text-xs text-ink-muted"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />{f}</li>)}</ul>
                </li>
              ))}
            </ul>
            <p className="max-w-[72ch] text-sm text-ink-muted">Payments in Bangladesh through SSLCommerz (bKash, Nagad, Rocket, cards, internet banking); a labelled test checkout runs until live keys are set. Size, as an illustration and not a forecast: if 10% of the 3,555 export factories paid Starter to Pro prices, that is ৳15–32 million a year.</p>
          </Section>

          <Section id="roadmap" n={10} title="Roadmap">
            <ol className="grid gap-3 md:grid-cols-3">
              {[
                ["Now: built", "Sourced drafting, answer reuse, Bangla, buyer comparison, evidence map, Compliance Action Plan, document library, two MCP servers, plans and billing."],
                ["Next 3 months", "Pilots with Bangladeshi factories; real rule feeds (Gazette, DIFE, EUR-Lex); checks against official registers; the full SLCP question set."],
                ["6–12 months", "iOS and Android apps; more questionnaire standards; other garment exporters (Vietnam, Cambodia, Pakistan, Sri Lanka) with language packs."],
              ].map(([when, what], i) => (
                <li key={when} className="glass-card flex flex-col gap-2 p-5">
                  <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${i === 0 ? "bg-success-soft text-success" : "bg-brand-soft text-brand"}`}>{when}</span>
                  <span className="text-sm text-ink-muted">{what}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="team" n={11} title="Team Maku" lead="মাকু, the loom shuttle that carries the thread through the cloth: the team behind Bunon.">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {TEAM.map((m) => (
                <li key={m.name} className="glass-card flex flex-col items-start gap-3 p-5">
                  <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initials(m.name)}</span>
                  <span className="flex flex-col">
                    <span className="font-semibold text-ink">{m.name}</span>
                    <span className="text-sm text-ink-muted">{m.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <footer className="flex flex-col items-start gap-4 border-t border-line pt-10">
            <p className="font-display text-2xl font-semibold text-ink">See it working in two minutes.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary-action min-h-[48px]">Try the live demo<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/pricing" className="btn-tactile-hollow inline-flex min-h-[48px] items-center gap-2 px-5">Pricing</Link>
            </div>
            <p className="text-xs text-ink-faint">On the sign-in page, press &ldquo;Demo factory&rdquo; or &ldquo;Demo buyer&rdquo;: no password needed. All demo companies are fictional.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
