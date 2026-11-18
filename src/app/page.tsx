"use client";

import type React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, ChevronDown, Languages, Quote, Repeat2, ShoppingBag, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/home/HowItWorks";
import CountUp from "@/components/home/CountUp";
import { t } from "@/lib/i18n";

/** Questions every brand asks in its own words: the problem, shown rather than told. */
const QUESTIONS = [
  "Do you hold a valid fire licence?",
  "Is overtime voluntary?",
  "Are all workers paid at least the minimum wage?",
  "Does the factory employ anyone under 18?",
  "Can workers raise grievances anonymously?",
  "Has the building been independently assessed?",
  "Are wages paid on time every month?",
  "Is your cotton certified organic?",
];

const STATS = [
  { to: 871, decimals: 0, suffix: "", text: "questions in one industry questionnaire", source: "SLCP v1.7.1", href: "https://slconvergence.org" },
  { to: 3.6, decimals: 1, suffix: "", text: "social audits per factory each year", source: "Financial Express, 2024", href: "https://thefinancialexpress.com.bd/home/apparel-industry-tops-social-audit-even-amid-a-global-decline" },
  { to: 45, decimals: 0, suffix: "%", text: "of facilities spend $5,000–20,000 a year on audits", source: "WRAP, 2023", href: "https://wrapcompliance.org/wp-content/uploads/2023/10/How-Many-Social-Audits-Are-Enough-WRAP-Oct-2023.pdf" },
];

const WHY = [
  { Icon: Quote, title: "Every answer has a source", text: "Each answer quotes the sentence it came from." },
  { Icon: UserCheck, title: "A person approves", text: "AI drafts. Your team checks and sends." },
  { Icon: Languages, title: "Bangla and English", text: "Staff work in Bangla; buyers read English." },
];

const WORKING = ["Questionnaire inbox", "Bangla screens", "Answer reuse", "Your own AI agents (MCP)", "Plans and billing"];

const H2 = "font-display text-[clamp(1.85rem,3vw+0.5rem,3rem)] font-bold leading-[1.12] tracking-[-0.02em] [text-wrap:balance]";

function QuestionRow({ items, direction }: { items: string[]; direction: "left" | "right" }) {
  return (
    <div className={`flex w-max gap-3 ${direction === "left" ? "scroll-marquee-left" : "scroll-marquee-right"}`} aria-hidden="true">
      {[...items, ...items].map((q, i) => (
        <span key={`${q}-${i}`} className="whitespace-nowrap rounded-full border border-line bg-surface px-5 py-3 text-[15px] text-ink shadow-[0_1px_2px_rgba(20,23,26,0.05)]">
          {q}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 overflow-x-clip">
        {/* Hero: the promise, filling the first screen */}
        <section className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center px-4 pb-24 pt-12 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-brand">
              {t("Compliance for Bangladesh’s garment factories")}
            </p>
            <h1 className="hero-giant rise mt-6" style={{ animationDelay: "60ms" }}>
              {t("Answer every buyer")} <em className="scroll-slide italic text-brand">{t("once")}</em>.
            </h1>
            <div className="rise mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between" style={{ animationDelay: "160ms" }}>
              <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
                {t("Your documents become sourced answers for every buyer. A person approves each one.")}
              </p>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link href="/login" className="btn-primary-action min-h-[52px] px-7 text-base">
                  {t("Try the demo")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="btn-tactile-hollow inline-flex min-h-[52px] items-center justify-center px-7 text-base font-semibold">
                  {t("See plans")}
                </Link>
              </div>
            </div>
          </div>
          <a
            href="#one-answer"
            className="rise absolute bottom-6 left-1/2 hidden min-h-[44px] -translate-x-1/2 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-muted hover:text-ink sm:inline-flex"
            style={{ animationDelay: "400ms" }}
          >
            {t("How it works")}
            <ChevronDown className="nudge-down h-4 w-4" aria-hidden="true" />
          </a>
        </section>

        {/* The product in one glance: a buyer's question answered, and the next buyer's ready from it */}
        <section id="one-answer" aria-labelledby="one-answer-title" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 id="one-answer-title" className={`scroll-reveal ${H2}`}>
              {t("One answer, ready for every buyer.")}
            </h2>
            <p className="scroll-reveal max-w-[44ch] text-lg leading-relaxed text-ink-muted">
              {t("When the next buyer asks the same thing in other words, your earlier answer is ready. Check it and send.")}
            </p>
          </div>
          <div className="scroll-scale-in relative mx-auto w-full max-w-[460px]" aria-hidden="true">
            <div className="absolute inset-0 -z-10 translate-y-6 scale-110 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent)] blur-2xl" />
            <div className="float-soft rounded-2xl border border-line bg-surface p-6 shadow-[0_2px_4px_rgba(20,23,26,0.05),0_30px_60px_-30px_rgba(30,58,95,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">{t("Nordlys Apparel asks")}</p>
              <p className="mt-1.5 font-display text-2xl text-ink">{t("Is overtime voluntary?")}</p>
              <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-ink">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success-soft">
                  <Check className="h-4 w-4 text-success" strokeWidth={3} />
                </span>
                {t("Yes")}
              </p>
              <p className="mt-3 border-l-2 border-success pl-3 text-[15px] italic text-ink-muted">“{t("Overtime is voluntary and is limited to 2 hours per day.")}”</p>
              <p className="mt-3 text-xs text-ink-faint">{t("From Working hours policy · approved by a person")}</p>
            </div>
            <div className="relative -mt-3 ml-8 mr-[-8px] rounded-2xl border border-brand/30 bg-brand-soft p-4 shadow-[0_20px_40px_-28px_rgba(30,58,95,0.5)]">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Repeat2 className="h-4 w-4 text-brand" />
                {t("Vela Outfitters asks the same thing")}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{t("Ready from your earlier answer. Check it and send.")}</p>
            </div>
          </div>
        </section>

        {/* Problem: the same questions keep coming */}
        <section aria-labelledby="problem-title" className="overflow-hidden border-y border-line bg-surface-2/50 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="problem-title" className={`scroll-reveal max-w-[20ch] ${H2}`}>
              {t("Every buyer asks the same questions.")}
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            <QuestionRow items={QUESTIONS.slice(0, 4).concat(QUESTIONS.slice(4, 6))} direction="left" />
            <QuestionRow items={QUESTIONS.slice(4).concat(QUESTIONS.slice(0, 2))} direction="right" />
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-10 px-4 sm:grid-cols-3 sm:px-6">
            {STATS.map((s, i) => (
              <div key={s.text} className="scroll-reveal space-y-2" style={{ "--i": i } as React.CSSProperties}>
                <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} className="font-display text-6xl font-semibold tracking-[-0.03em] text-ink" />
                <p className="max-w-[26ch] text-[15px] text-ink-muted">{t(s.text)}</p>
                <a href={s.href} className="inline-block font-mono text-xs text-ink-faint underline-offset-4 hover:text-ink hover:underline">
                  {s.source}
                </a>
              </div>
            ))}
          </div>
        </section>

        <HowItWorks />

        {/* Who it's for: two doors */}
        <section id="who-its-for" aria-labelledby="who-title" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <p className="section-index scroll-reveal">{t("Who it's for")}</p>
            <h2 id="who-title" className={`scroll-reveal mt-3 ${H2}`}>
              {t("For garment factories, and the brands that buy from them.")}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {[
                { Icon: Building2, title: "Factories", who: "Owners and compliance teams at export garment factories in Bangladesh.", line: "Answer each question once, from your own documents.", href: "/signup/factory", cta: "Register a factory" },
                { Icon: ShoppingBag, title: "Buyers", who: "Sourcing and compliance teams at brands and retailers, many in the EU.", line: "Get every answer with its source. Always free.", href: "/signup", cta: "Create a buyer account" },
              ].map(({ Icon, title, who, line, href, cta }, i) => (
                <Link
                  key={title}
                  href={href}
                  style={{ "--i": i } as React.CSSProperties}
                  className="scroll-scale-in group flex flex-col gap-5 rounded-2xl border border-line bg-canvas p-8 transition-[border-color,box-shadow] duration-200 hover:border-brand hover:shadow-[0_16px_40px_-24px_rgba(30,58,95,0.45)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="space-y-2">
                    <span className="block font-display text-3xl font-semibold text-ink">{t(title)}</span>
                    <span className="block text-sm font-medium text-ink-faint">{t(who)}</span>
                    <span className="block text-base text-ink">{t(line)}</span>
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    {t(cta)}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* About: built for the factory floor */}
        <section id="about" aria-labelledby="about-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 id="about-title" className={`scroll-reveal max-w-[22ch] ${H2}`}>
            {t("Built in Dhaka for the factory floor.")}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {WHY.map(({ Icon, title, text }, i) => (
              <div key={title} style={{ "--i": i } as React.CSSProperties} className="scroll-scale-in rounded-2xl border border-line bg-surface p-7">
                <Icon className="h-7 w-7 text-brand" aria-hidden="true" />
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">{t(title)}</h3>
                <p className="mt-2 text-[15px] text-ink-muted">{t(text)}</p>
              </div>
            ))}
          </div>
          <Link href="/about" className="scroll-reveal mt-8 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            {t("More about us")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="scroll-reveal mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink">{t("Working today:")}</span>
            {WORKING.map((w) => (
              <span key={w} className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-sm text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                {t(w)}
              </span>
            ))}
          </div>
        </section>

        {/* Closing call to action */}
        <section className="bg-ink">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center">
            <h2 className="scroll-reveal font-display text-3xl font-bold text-white sm:text-4xl">{t("See it with demo data.")}</h2>
            <Link href="/login" className="btn-primary-action min-h-[52px] shrink-0 px-7 text-base">
              {t("Try the demo")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            <span className="font-semibold text-ink">Bunon</span> · <span className="font-bengali">বুনন</span> {t("· Dhaka, Bangladesh")}
          </span>
          <span>{t("Prototype. Demo companies and certificates are fictional.")}</span>
        </div>
      </footer>
    </div>
  );
}
