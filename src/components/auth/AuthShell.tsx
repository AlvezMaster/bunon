"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { PreferenceToggles } from "@/components/Preferences";
import BunonLogo from "@/components/BunonLogo";
import { t } from "@/lib/i18n";

/**
 * The frame for sign-in and sign-up: a picture of what Bunon does on the left (woven threads, since বুনন means
 * weaving, and one answer card), and a calm form on the right. On phones only the form shows.
 */
export default function AuthShell({
  visualTitle,
  visualLine,
  wide = false,
  children,
}: {
  visualTitle: string;
  visualLine: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <aside
        aria-hidden="true"
        className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden bg-[#13263F] p-12 text-white lg:flex"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 22px), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 22px), radial-gradient(60% 50% at 70% 72%, rgba(194,65,12,0.32), transparent 70%), linear-gradient(160deg, #1E3A5F 0%, #13263F 55%, #0D1B2E 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <BunonLogo className="h-10 w-10 [&_path]:fill-white" />
          <span className="font-display text-3xl font-semibold tracking-tight">Bunon</span>
        </div>

        <div className="space-y-8">
          <p className="max-w-[14ch] font-display text-[clamp(2.5rem,3.4vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]">{t(visualTitle)}</p>
          <p className="max-w-[38ch] text-lg text-white/75">{t(visualLine)}</p>

          {/* One answer, the way a buyer sees it: the reason Bunon exists. */}
          <div className="max-w-[420px] rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/55">{t("Question from your buyer")}</p>
            <p className="mt-1.5 font-display text-xl text-white">{t("Is overtime voluntary?")}</p>
            <div className="mt-4 flex items-center gap-2 text-base font-semibold text-white">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#34D399]/20">
                <Check className="h-4 w-4 text-[#6EE7B7]" strokeWidth={3} />
              </span>
              {t("Yes")}
            </div>
            <p className="mt-3 border-l-2 border-[#6EE7B7]/60 pl-3 text-sm italic text-white/70">“{t("Overtime is voluntary and is limited to 2 hours per day.")}”</p>
            <p className="mt-2 text-xs text-white/45">{t("From Working hours policy · approved by a person")}</p>
          </div>
        </div>

        <p className="text-sm text-white/45">বুনন · {t("weaving")}</p>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-8">
          <Link href="/" className="flex min-h-[44px] items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="lg:hidden">Bunon</span>
            <span className="hidden lg:inline">{t("Home")}</span>
          </Link>
          <PreferenceToggles />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:px-8">
          <div className={`w-full ${wide ? "max-w-[540px]" : "max-w-[400px]"}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

/** A labelled input with its error or hint underneath. */
export function AuthField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string; className: string }) => React.ReactNode;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {t(label)}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        className: `min-h-[48px] w-full rounded-xl border bg-surface px-3.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)] dark:bg-white/[0.04] ${
          error ? "border-danger" : "border-field"
        }`,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {t(error)}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-faint">
          {t(hint)}
        </p>
      ) : null}
    </div>
  );
}
