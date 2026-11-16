"use client";

import type React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  CircleCheck,
  FileSearch,
  Fingerprint,
  ListChecks,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Upload,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/home/HowItWorks";
import { t } from "@/lib/i18n";

const FACTORY_POINTS = [
  "One place for every certificate and licence",
  "Warnings before a certificate expires",
  "Questionnaires pre-filled from your own evidence",
  "Screens in Bangla for your staff",
];

const BUYER_POINTS = [
  "Answers in English, each linked to its source document",
  "Certificate status checked, not just copied",
  "A tamper-proof record of what was claimed and when",
  "Clear flags for anything missing or expired",
];

const LEDGER = [
  {
    figure: "3.6",
    text: "Social audits per factory per year in Bangladesh, the highest of any country in the SLCP programme",
    source: "Financial Express, Aug 2024",
    href: "https://thefinancialexpress.com.bd/home/apparel-industry-tops-social-audit-even-amid-a-global-decline",
  },
  {
    figure: "45%",
    text: "Share of facilities spending $5,000–20,000 a year on audits",
    source: "WRAP, Oct 2023",
    href: "https://wrapcompliance.org/wp-content/uploads/2023/10/How-Many-Social-Audits-Are-Enough-WRAP-Oct-2023.pdf",
  },
  {
    figure: "2027-12-14",
    text: "When the EU ban on products made with forced labour applies, covering every supplier tier",
    source: "Covington, Jul 2026",
    href: "https://www.cov.com/en/news-and-insights/insights/2026/07/european-commission-publishes-forced-labour-regulation-guidelines-key-takeaways-for-companies",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-col items-start px-4 pb-24 pt-20 sm:px-6 lg:pt-32">
          <div className="scroll-drift space-y-6">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-brand">
              {t("Compliance for Bangladesh’s garment factories")}
            </p>
            <h1 className="hero-title rise" style={{ animationDelay: "60ms" }}>
              {t("Answer every buyer")}{" "}<em className="scroll-slide italic text-brand">{t("once")}</em>.
            </h1>
            <p className="rise max-w-[60ch] text-lg leading-relaxed text-ink-muted" style={{ animationDelay: "120ms" }}>
              {t("Bunon checks a factory’s certificates and licences, then drafts each buyer’s compliance questionnaire from that verified evidence, with a source for every answer. Staff work in Bangla; buyers receive English.")}
            </p>
            <div className="rise flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
              <Link href="/login" className="btn-primary-action">
                {t("Try the demo")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="#how-it-works" className="btn-tactile-hollow inline-flex min-h-[48px] items-center justify-center px-6 text-[0.9375rem] font-semibold">
                {t("See how it works")}
              </Link>
            </div>
            <p className="rise text-sm text-ink-faint" style={{ animationDelay: "240ms" }}>
              {t("A working prototype. All companies and certificates in the demo are fictional.")}
            </p>
          </div>
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-title" className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <p className="section-index scroll-reveal">{t("The problem")}</p>
              <h2 id="problem-title" className="scroll-reveal font-display text-[clamp(1.85rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em]">
                {t("The same questions, in a different form for every buyer.")}
              </h2>
              <p className="max-w-[60ch] text-base leading-relaxed text-ink-muted">
                {t("Every brand sends its own compliance questionnaire: fire safety, wages, working hours, certified materials. Compliance staff spend days copying the same facts from folders of paper into form after form, and one expired certificate can cost an order.")}
              </p>
            </div>
            <div className="self-start border-t-2 border-ink">
              {LEDGER.map((row, i) => (
                <div key={row.figure} style={{ "--i": i } as React.CSSProperties} className="scroll-reveal grid grid-cols-1 gap-x-8 gap-y-1 border-b border-line py-5 sm:grid-cols-[11rem_1fr]">
                  <span className="font-mono text-3xl font-semibold tabular-nums text-ink">{row.figure}</span>
                  <span className="text-sm text-ink-muted">
                    {t(row.text)}{" "}
                    <a className="whitespace-nowrap font-mono text-xs text-ink-faint underline hover:text-ink" href={row.href}>
                      [{row.source}]
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Who it's for */}
        <section id="who-its-for" aria-labelledby="who-title" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="max-w-[60ch] space-y-4">
              <p className="section-index scroll-reveal">{t("Who it’s for")}</p>
              <h2 id="who-title" className="scroll-reveal font-display text-[clamp(1.85rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em]">
                {t("Two workspaces, one source of truth.")}
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {[
                { Icon: Building2, title: "Factories", lead: "For compliance officers and managers.", points: FACTORY_POINTS, role: "factory", cta: "Open the factory demo" },
                { Icon: ShoppingBag, title: "Buyers", lead: "For brands' sourcing and compliance teams.", points: BUYER_POINTS, role: "buyer", cta: "Open the buyer demo" }, ].map(({ Icon, title, lead, points, role, cta }) => (
                <article key={title} className="flex flex-col rounded-[4px] border border-line bg-canvas p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-ink text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-xl font-bold">{t(title)}</h3>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted">{t(lead)}</p>
                  <ul className="mt-5 space-y-3">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-ink">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        {t(p)}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/login?role=${role}`}
                    className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-[3px] text-sm font-semibold text-brand hover:underline"
                  >
                    {t(cta)}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" aria-labelledby="about-title" className="mx-auto grid max-w-6xl scroll-mt-20 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="section-index scroll-reveal">{t("About us")}</p>
            <h2 id="about-title" className="scroll-reveal font-display text-[clamp(1.85rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em]">
              {t("Built in Bangladesh, for the people who fill in the forms.")}
            </h2>
            <p className="max-w-[60ch] text-base leading-relaxed text-ink-muted">
              {t("Bunon (")}<span className="font-bengali">বুনন</span>{t(") means weaving. We are a small team building compliance software for the factory floor first: Bangla on screen, proof behind every answer, and a person in charge of every decision.")}
            </p>
            <p className="max-w-[60ch] text-base leading-relaxed text-ink-muted">
              {t("Bunon is our entry to the International AI Builders Congress 2026, in the JusticeSphere ComplianceOS challenge.")}
            </p>
          </div>
          <div className="rounded-[4px] border border-line bg-surface p-6 sm:p-8">
            <h3 className="text-lg font-semibold">{t("What works in the prototype today")}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Reading certificates with a local AI model, with a rules-based backup", true],
                ["Traffic-light checks: issuer record, expiry date and file fingerprint", true],
                ["A hash-chained, append-only record of every check and approval", true],
                ["Separate factory and buyer sign-in", true],
                ["Buyer questionnaire inbox", false],
                ["Bangla screens for factory staff", false],
              ].map(([label, done]) => (
                <li key={label as string} className="flex items-start gap-2.5">
                  {done ? (
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                  )}
                  <span className="text-ink">
                    {t(label as string)}
                    <span className="sr-only">{done ? " (working)" : " (in progress)"}</span>
                    {!done && <span className="ml-1.5 text-ink-faint">{t("· in progress")}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-sm text-ink-muted">
              <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              {t("The certificate registry in the demo is simulated, because certification bodies offer no free access to theirs.")}
            </p>
          </div>
        </section>

        {/* Closing call to action: the dark indigo band */}
        <section className="bg-ink">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <h2 className="scroll-reveal font-display text-2xl font-bold text-white sm:text-3xl">{t("See it with demo data.")}</h2>
              <p className="max-w-[56ch] text-base text-white/75">
                {t("Sign in as a fictional factory or buyer and run the certificate checks yourself.")}
              </p>
            </div>
            <Link href="/login" className="btn-primary-action shrink-0">
              {t("Try the demo")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            <span className="font-semibold text-ink">Bunon</span> · <span className="font-bengali">বুনন</span>{" "}{t("· Dhaka, Bangladesh")}
          </span>
          <span>{t("Prototype. Demo companies and certificates are fictional.")}</span>
        </div>
      </footer>
    </div>
  );
}
