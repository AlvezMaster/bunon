"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { t } from "@/lib/i18n";

const TABS = [
  { href: "/pricing", label: "Plans" },
  { href: "/pricing/compare", label: "Compare" },
  { href: "/pricing/faq", label: "Questions" },
  { href: "/pricing/enterprise", label: "Enterprise" },
];

/** The frame every pricing page shares: one heading, one line of context, and the pricing tabs. */
export default function PricingShell({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-brand">{t("Pricing")}</p>
          <h1 className="max-w-[22ch] font-display text-[clamp(2.25rem,4vw+1rem,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink [text-wrap:balance]">{t(title)}</h1>
          <p className="max-w-[60ch] text-base text-ink-muted [text-wrap:pretty]">{t(note)}</p>
        </header>
        <nav aria-label={t("Pricing pages")} className="-mt-2 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface-2/70 p-1 [scrollbar-width:none]">
          {TABS.map((tab) => {
            const active = path === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-5 text-sm font-medium transition-colors duration-150 ${
                  active ? "bg-[var(--color-ink)] text-canvas" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t(tab.label)}
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
