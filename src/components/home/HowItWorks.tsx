"use client";

import React, { useEffect, useRef, useState } from "react";
import { CircleCheck, FileSearch, FileText, Fingerprint, ListChecks, Lock, Scale, Upload, type LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";

interface Step {
  Icon: LucideIcon;
  short: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}

const chip = "inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-surface-2 px-2.5 py-1 font-mono text-xs text-ink-muted";

const STEPS: Step[] = [
  {
    Icon: Upload,
    short: "Upload",
    title: "Upload once",
    body: "The factory adds its certificates, licences and records, as PDFs or phone photos.",
    visual: (
      <div className="flex flex-wrap gap-2">
        {["fire_licence.pdf", "organic_cotton_certificate.pdf", "wage_sheet.xlsx", "photo_of_licence.jpg"].map((f) => (
          <span key={f} className={chip}>
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {f}
          </span>
        ))}
      </div>
    ),
  },
  {
    Icon: FileSearch,
    short: "Check",
    title: "Check every document",
    body: "A small AI model reads each one. Bunon checks the issuer's records, the expiry date and whether the file was altered.",
    visual: (
      <ul className="space-y-2 text-sm">
        {["Issuer record matches", "In date until 2027", "File unchanged since upload"].map((c) => (
          <li key={c} className="flex items-center gap-2 text-ink">
            <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />
            {t(c)}
          </li>
        ))}
      </ul>
    ),
  },
  {
    Icon: ListChecks,
    short: "Draft",
    title: "Draft each buyer's answers",
    body: "Answers to a buyer's questionnaire are drafted from checked evidence, each citing its source. Anything needing judgement is left for a person.",
    visual: (
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-ink">{t("Is overtime voluntary?")}</p>
        <p className="text-ink">
          <span className="font-semibold text-success">{t("Yes")}</span>
          <span className="text-ink-faint"> · </span>
          <span className="text-ink-muted">“{t("Overtime is voluntary and is limited to 2 hours per day.")}”</span>
        </p>
        <p className="font-mono text-xs text-ink-faint">{t("source")}: working_hours_policy.pdf</p>
      </div>
    ),
  },
  {
    Icon: Fingerprint,
    short: "Approve",
    title: "Approve and seal",
    body: "A compliance manager approves every answer. Approved answers are sealed in a tamper-proof record the buyer can check.",
    visual: (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-ink-muted">{t("Approved by the compliance manager")}</span>
        <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-[2px] border-2 border-brand px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Sealed")}
        </span>
      </div>
    ),
  },
];

/**
 * "How it works" as a short scroll story: the title and a progress rail stay pinned on the left while
 * the four steps arrive one at a time on the right. Entry and exit motion is CSS scroll-driven
 * (see .step-card in globals.css); the rail follows the step in view via IntersectionObserver.
 */
export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      // A step counts as current once it reaches the middle band of the screen.
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* Pinned story header and progress rail */}
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <p className="section-index scroll-reveal">{t("How it works")}</p>
          <h2
            id="how-title"
            className="scroll-reveal mt-4 font-display text-[clamp(1.85rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em]"
          >
            {t("Checked evidence in, approved answers out.")}
          </h2>

          <ol className="relative mt-10 hidden space-y-6 pl-8 lg:block" aria-label={t("Steps")}>
            <span className="absolute left-[7px] top-2 bottom-2 w-px bg-line" aria-hidden="true" />
            <span
              className="absolute left-[7px] top-2 w-px bg-accent transition-[height] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ height: `calc(${(active / (STEPS.length - 1)) * 100}% - 1rem)` }}
              aria-hidden="true"
            />
            {STEPS.map((s, i) => (
              <li key={s.short} className="relative flex items-center gap-3">
                <span
                  className={`absolute -left-8 flex h-[15px] w-[15px] items-center justify-center rounded-full border transition-colors duration-300 ${
                    i <= active ? "border-accent bg-accent" : "border-line-strong bg-canvas"
                  }`}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs tabular-nums text-ink-faint">0{i + 1}</span>
                <span className={`text-sm transition-colors duration-300 ${i === active ? "font-semibold text-ink" : "text-ink-muted"}`}>
                  {t(s.short)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* The steps, one per screen-height on large displays */}
        <ol className="flex flex-col gap-6 lg:gap-0">
          {STEPS.map(({ Icon, title, body, visual }, i) => (
            <li
              key={title}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step={i}
              className="lg:flex lg:min-h-[78vh] lg:items-center"
            >
              <article className="step-card glass-card relative w-full overflow-hidden p-7 sm:p-9">
                <span
                  className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-[8rem] font-semibold leading-none text-ink/[0.05]"
                  aria-hidden="true"
                >
                  0{i + 1}
                </span>
                <div className="relative flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums tracking-[0.08em] text-ink-faint">
                    {t("STEP")} {i + 1} / {STEPS.length}
                  </span>
                </div>
                <h3 className="relative mt-6 font-display text-2xl font-semibold leading-snug text-ink sm:text-[1.75rem]">{t(title)}</h3>
                <p className="relative mt-3 max-w-[52ch] leading-relaxed text-ink-muted">{t(body)}</p>
                <div className="relative mt-6 border-t border-line pt-5">{visual}</div>
              </article>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 flex flex-col gap-2 rounded-[4px] border border-line bg-surface p-5 text-sm text-ink-muted sm:flex-row sm:items-center sm:gap-4">
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <Scale className="h-4 w-4 text-brand" aria-hidden="true" />
          {t("What Bunon is not")}
        </span>
        <span>
          {t(
            "Bunon checks documents. It does not certify factories or replace audits: accredited bodies still certify, auditors still visit, and a person approves every answer."
          )}
        </span>
      </div>
    </section>
  );
}
