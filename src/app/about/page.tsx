"use client";

import type React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, CircleSlash, Cpu, FolderLock, Quote, ShoppingBag, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { t } from "@/lib/i18n";

const H2 = "font-display text-[clamp(1.85rem,3vw+0.5rem,3rem)] font-bold leading-[1.12] tracking-[-0.02em] [text-wrap:balance]";

/** Who each side is, what they get and what it costs. Prices match src/lib/plans.ts. */
const AUDIENCES = [
  {
    Icon: Building2,
    title: "Garment factories",
    who: "Owners, compliance officers and their staff at export garment factories in Bangladesh.",
    gets: ["Answer each buyer question once, from your own documents", "AI drafts every answer with its source; your team checks and sends", "Work in Bangla; buyers read English", "Connect your own AI agent on Pro"],
    price: "Starter: first month free, then ৳3,500 a month. Pro: ৳7,500 a month.",
    href: "/signup/factory",
    cta: "Register a factory",
  },
  {
    Icon: ShoppingBag,
    title: "Brands and buyers",
    who: "Sourcing and compliance teams at the brands and retailers that buy from those factories, many of them in the EU.",
    gets: ["Send one questionnaire to all your factories at once", "Read every answer with the sentence it came from", "Compare factories side by side", "See which certificates have expired, and which orders are on hold"],
    price: "Always free.",
    href: "/signup",
    cta: "Create a buyer account",
  },
];

const BELIEFS = [
  { Icon: Cpu, title: "Open models, on your own computer", text: "Bunon's AI can run as an open model (Qwen) on the factory's own computer, so its documents never leave the factory." },
  { Icon: Quote, title: "Every answer has a source", text: "An answer quotes the sentence in the factory's own document that it rests on. No source, no answer." },
  { Icon: UserCheck, title: "A person approves", text: "AI drafts. A person at the factory checks every answer before a buyer sees it." },
  { Icon: FolderLock, title: "Factories own their data", text: "Either side can unlink at any time, with a 12-hour undo and 30 days to download the shared data." },
];

const NEXT = ["Pilots with Bangladeshi factories", "Official register checks", "iOS and Android apps", "The full SLCP question set"];

/** About us: who we are, who Bunon is for, and what we stand for. */
export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-x-clip">
        <section className="mx-auto max-w-4xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <p className="section-index">{t("About us")}</p>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,5vw+1rem,4.25rem)] font-bold leading-[1.06] tracking-[-0.03em] text-ink [text-wrap:balance]">
            {t("We help garment factories answer every buyer once.")}
          </h1>
          <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-muted [text-wrap:pretty]">
            {t("Bunon is a small team in Dhaka, Bangladesh. Every brand sends its factories its own compliance questionnaire, and most ask the same things: fire safety, wages, working hours. Bunon turns a factory's own documents into answers with a source, so it answers each question once and reuses the answer for every buyer.")}
          </p>
          <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-ink-muted [text-wrap:pretty]">
            {t("Our name means “weaving” in Bangla.")} <span className="font-bengali">বুনন</span>
          </p>
        </section>

        <section id="who-its-for" aria-labelledby="who-title" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <p className="section-index">{t("Who it's for")}</p>
            <h2 id="who-title" className={`mt-3 ${H2}`}>
              {t("For garment factories, and the brands that buy from them.")}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {AUDIENCES.map(({ Icon, title, who, gets, price, href, cta }) => (
                <article key={title} className="flex flex-col gap-5 rounded-2xl border border-line bg-canvas p-7 sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-display text-3xl font-semibold text-ink">{t(title)}</h3>
                    <p className="text-base text-ink-muted">{t(who)}</p>
                  </div>
                  <ul className="space-y-2.5">
                    {gets.map((g) => (
                      <li key={g} className="flex gap-2.5 text-[15px] text-ink">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={3} aria-hidden="true" />
                        {t(g)}
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-lg bg-surface px-4 py-3 text-sm font-medium text-ink [font-variant-numeric:tabular-nums]">{t(price)}</p>
                  <Link href={href} className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 self-start text-sm font-semibold text-brand hover:underline">
                    {t(cta)}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-8 flex max-w-[70ch] items-start gap-2.5 text-[15px] text-ink-muted">
              <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
              {t("Bunon checks documents. It does not certify factories or replace audits.")}
            </p>
          </div>
        </section>

        <section aria-labelledby="beliefs-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="beliefs-title" className={H2}>
            {t("What we stand for")}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {BELIEFS.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-surface p-7">
                <Icon className="h-7 w-7 text-brand" aria-hidden="true" />
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">{t(title)}</h3>
                <p className="mt-2 text-[15px] text-ink-muted">{t(text)}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink">{t("Next:")}</span>
            {NEXT.map((n) => (
              <span key={n} className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-muted">
                {t(n)}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-ink">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t("See it with demo data.")}</h2>
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
