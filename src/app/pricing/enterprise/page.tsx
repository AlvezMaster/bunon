"use client";

import React, { useState } from "react";
import { Check, RefreshCw, Send } from "lucide-react";
import PricingShell from "@/components/pricing/PricingShell";
import { t } from "@/lib/i18n";

const INCLUDES = ["Everything in Pro", "A price for your factories and needs", "Open AI model (Qwen) on your own computers: documents never leave the factory", "Onboarding and training for your team"];

type Form = { company: string; contactName: string; email: string; phone: string; factories: string; needs: string };

/** Pricing, page 4: the Enterprise quote request, and nothing else. */
export default function PricingEnterprisePage() {
  const [f, setF] = useState<Form>({ company: "", contactName: "", email: "", phone: "", factories: "1", needs: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setFormError("");
    try {
      const res = await fetch("/api/billing/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = (await res.json()) as { error?: string; errors?: Record<string, string> };
      if (!res.ok) {
        setErrors(json.errors ?? {});
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setState("sent");
    } catch (err) {
      setFormError(t(err instanceof Error ? err.message : "Sending failed."));
      setState("idle");
    }
  };

  const input = (k: keyof Form, label: string, type = "text", extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{t(label)}</span>
      <input
        type={type}
        value={f[k]}
        onChange={(e) => {
          setF((x) => ({ ...x, [k]: e.target.value }));
          setErrors((x) => ({ ...x, [k]: "" }));
        }}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `${k}-error` : undefined}
        className="min-h-[48px] w-full rounded-lg border border-field bg-canvas/60 px-3 text-base text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]"
        {...extra}
      />
      {errors[k] && (
        <span id={`${k}-error`} className="text-sm text-danger">
          {t(errors[k])}
        </span>
      )}
    </label>
  );

  return (
    <PricingShell title="Enterprise" note="For groups and large factories. Tell us what you need and we send you a price.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="includes-title" className="space-y-4">
          <h2 id="includes-title" className="font-display text-xl font-semibold text-ink">
            {t("What you get")}
          </h2>
          <ul className="space-y-3 text-[15px] text-ink">
            {INCLUDES.map((x) => (
              <li key={x} className="flex items-center gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
                {t(x)}
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-muted">{t("We reply by email within two working days.")}</p>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="quote-title">
          <h2 id="quote-title" className="mb-5 font-display text-xl font-semibold text-ink">
            {t("Ask for a quote")}
          </h2>
          {state === "sent" ? (
            <p role="status" className="rounded-lg border border-success/40 bg-success-soft p-4 text-sm font-medium text-success">
              {t("Thank you. We have your request and will reply by email.")}
            </p>
          ) : (
            <form onSubmit={send} className="grid gap-4 sm:grid-cols-2" noValidate>
              {input("company", "Company or group name", "text", { autoComplete: "organization" })}
              {input("contactName", "Your name", "text", { autoComplete: "name" })}
              {input("email", "Work email", "email", { autoComplete: "email" })}
              {input("phone", "Phone (optional)", "tel", { autoComplete: "tel" })}
              {input("factories", "Number of factories", "number", { min: 1, inputMode: "numeric" })}
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-ink">{t("What do you need? (optional)")}</span>
                <textarea
                  value={f.needs}
                  onChange={(e) => setF((x) => ({ ...x, needs: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-field bg-canvas/60 px-3 py-2.5 text-base text-ink outline-none focus:border-brand"
                />
              </label>
              {formError && (
                <p role="alert" className="text-sm text-danger sm:col-span-2">
                  {formError}
                </p>
              )}
              <button type="submit" disabled={state === "sending"} className="btn-primary-action min-h-[48px] sm:col-span-2 sm:justify-self-start">
                {state === "sending" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                {t("Send request")}
              </button>
            </form>
          )}
        </section>
      </div>
    </PricingShell>
  );
}
