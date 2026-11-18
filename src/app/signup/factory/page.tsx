"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RefreshCw, ShieldCheck } from "lucide-react";
import { useBunonStore, type SessionUser } from "@/lib/store";
import { t } from "@/lib/i18n";
import AuthShell, { AuthField } from "@/components/auth/AuthShell";
import { checkAccount, checkFactoryProfile, type SignupErrors, type SignupInput } from "@/lib/signup-rules";
import { PLANS, formatBdt, isPlanId, type PlanId } from "@/lib/plans";

const STEPS = ["Plan", "Account", "Factory"] as const;
const ACCOUNT_FIELDS: Array<keyof SignupErrors> = ["company", "fullName", "email", "password"];

/** Factory sign-up, its own page: 1 choose a plan, 2 the account, 3 the factory's registration details. */
export default function FactorySignupPage() {
  const router = useRouter();
  const setSession = useBunonStore((s) => s.setSession);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [plan, setPlan] = useState<Exclude<PlanId, "enterprise">>("starter");
  const [v, setV] = useState<SignupInput>({ role: "factory", company: "", fullName: "", email: "", password: "", association: "BGMEA", declaration: false });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    if (p === "enterprise") router.replace("/pricing/enterprise");
    else if (isPlanId(p)) setPlan(p as Exclude<PlanId, "enterprise">);
  }, [router]);

  const set = <K extends keyof SignupInput>(k: K, value: SignupInput[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (step === 0) return setStep(1);
    const accountErrors = checkAccount(v);
    if (step === 1) {
      setErrors(accountErrors);
      if (!Object.keys(accountErrors).length) setStep(2);
      return;
    }
    const all = { ...accountErrors, ...checkFactoryProfile(v) };
    setErrors(all);
    if (Object.keys(all).length) {
      if (ACCOUNT_FIELDS.some((k) => all[k])) setStep(1);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, role: "factory", plan }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: SignupErrors; user?: SessionUser };
      if (!res.ok || !data.user) {
        if (data.errors) {
          setErrors(data.errors);
          if (ACCOUNT_FIELDS.some((k) => data.errors?.[k])) setStep(1);
        }
        throw new Error(data.error ?? "Sign-up failed.");
      }
      setSession(data.user);
      router.push(plan === "starter" ? "/factory" : "/factory/billing?welcome=1");
    } catch (err) {
      setFormError(t(err instanceof Error ? err.message : "Sign-up failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell wide visualTitle="Register your factory." visualLine="Upload your documents once. Answer every buyer from them, in Bangla or English.">
      <ol className="flex items-center gap-2" aria-label={t("Steps")}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-2" aria-current={i === step ? "step" : undefined}>
            <span className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
            <span className={`text-xs font-semibold uppercase tracking-[0.06em] ${i === step ? "text-ink" : "text-ink-faint"}`}>
              {i + 1}. {t(s)}
            </span>
          </li>
        ))}
      </ol>

      <h1 className="mt-8 font-display text-[2.25rem] font-semibold leading-tight tracking-[-0.02em]">
        {step === 0 ? t("Choose your plan") : step === 1 ? t("Your account") : t("About your factory")}
      </h1>
      <p className="mt-2 text-base text-ink-muted">
        {step === 0 ? t("You can change it later.") : step === 1 ? t("You will sign in with this email.") : t("Buyers see these details, marked as self-declared.")}
      </p>

      <form onSubmit={next} className="mt-8 space-y-4" noValidate>
        {step === 0 && (
          <div role="radiogroup" aria-label={t("Plan")} className="grid gap-3">
            {(["starter", "pro"] as const).map((id) => {
              const p = PLANS[id];
              const on = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPlan(id)}
                  className={`flex min-h-[76px] items-center gap-4 rounded-xl border px-5 text-left transition-[border-color,box-shadow] duration-200 ${
                    on ? "border-brand bg-brand-soft/50 shadow-[0_0_0_1px_var(--color-brand)]" : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-brand bg-brand text-white" : "border-line-strong"}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-xl font-semibold text-ink">{t(p.name)}</span>
                    <span className="block text-sm text-ink-muted">{id === "starter" ? t("1 month free, then up to 3 buyers") : t("Unlimited buyers and your own AI agents")}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-xl font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatBdt(p.priceBdt ?? 0)}</span>
                    <span className="block text-xs text-ink-faint">/{t("month")}</span>
                  </span>
                </button>
              );
            })}
            <p className="text-sm text-ink-muted">
              {t("A group or a large factory?")}{" "}
              <Link href="/pricing/enterprise" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                {t("Ask for an Enterprise quote")}
              </Link>
            </p>
          </div>
        )}

        {step === 1 && (
          <>
            <AuthField id="company" label="Factory's registered name" error={errors.company}>
              {(p) => <input {...p} autoComplete="organization" value={v.company} onChange={(e) => set("company", e.target.value)} />}
            </AuthField>
            <AuthField id="fullName" label="Your name" error={errors.fullName}>
              {(p) => <input {...p} autoComplete="name" value={v.fullName} onChange={(e) => set("fullName", e.target.value)} />}
            </AuthField>
            <AuthField id="email" label="Work email" error={errors.email}>
              {(p) => <input {...p} type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} />}
            </AuthField>
            <AuthField id="password" label="Passphrase" error={errors.password} hint="At least 10 characters.">
              {(p) => <input {...p} type="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} />}
            </AuthField>
          </>
        )}

        {step === 2 && (
          <>
            <AuthField id="address" label="Factory address" error={errors.address}>
              {(p) => <input {...p} autoComplete="street-address" value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} />}
            </AuthField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField id="district" label="District" error={errors.district}>
                {(p) => <input {...p} list="districts" value={v.district ?? ""} onChange={(e) => set("district", e.target.value)} />}
              </AuthField>
              <AuthField id="workers" label="Number of workers" error={errors.workers}>
                {(p) => <input {...p} inputMode="numeric" value={String(v.workers ?? "")} onChange={(e) => set("workers", e.target.value.replace(/\D/g, ""))} />}
              </AuthField>
              <AuthField id="tradeLicence" label="Trade licence number" error={errors.tradeLicence}>
                {(p) => <input {...p} value={v.tradeLicence ?? ""} onChange={(e) => set("tradeLicence", e.target.value)} />}
              </AuthField>
              <AuthField id="bin" label="BIN (VAT)" error={errors.bin} hint="13 digits.">
                {(p) => <input {...p} inputMode="numeric" value={v.bin ?? ""} onChange={(e) => set("bin", e.target.value)} />}
              </AuthField>
              <AuthField id="erc" label="Export registration (ERC) number" error={errors.erc}>
                {(p) => <input {...p} value={v.erc ?? ""} onChange={(e) => set("erc", e.target.value)} />}
              </AuthField>
              <AuthField id="difeLicence" label="DIFE factory licence number" error={errors.difeLicence}>
                {(p) => <input {...p} value={v.difeLicence ?? ""} onChange={(e) => set("difeLicence", e.target.value)} />}
              </AuthField>
              <AuthField id="association" label="Association" error={errors.association}>
                {(p) => (
                  <select {...p} value={v.association} onChange={(e) => set("association", e.target.value as SignupInput["association"])}>
                    <option value="BGMEA">BGMEA</option>
                    <option value="BKMEA">BKMEA</option>
                    <option value="none">{t("Neither")}</option>
                  </select>
                )}
              </AuthField>
              {v.association !== "none" && (
                <AuthField id="membershipNo" label="Membership number" error={errors.membershipNo}>
                  {(p) => <input {...p} value={v.membershipNo ?? ""} onChange={(e) => set("membershipNo", e.target.value)} />}
                </AuthField>
              )}
            </div>
            <datalist id="districts">
              {["Dhaka", "Gazipur", "Narayanganj", "Chattogram", "Savar", "Mymensingh", "Cumilla"].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm text-ink">
              <input
                type="checkbox"
                checked={!!v.declaration}
                onChange={(e) => set("declaration", e.target.checked)}
                aria-invalid={errors.declaration ? true : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
              />
              <span>{t("I confirm these details are true and that I may register this factory.")}</span>
            </label>
            {errors.declaration && <p className="-mt-2 text-sm text-danger">{t(errors.declaration)}</p>}
            <p className="flex items-start gap-2 text-xs text-ink-faint">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t("Bunon checks the format now; checks against official registers come later.")}
            </p>
          </>
        )}

        {formError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => (s - 1) as 0 | 1)} className="btn-tactile-hollow inline-flex min-h-[52px] items-center gap-2 rounded-xl px-5 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("Back")}
            </button>
          )}
          <button type="submit" disabled={busy} className="btn-primary-action min-h-[52px] flex-1 rounded-xl text-base">
            {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            {step < 2 ? t("Continue") : busy ? t("Creating account…") : plan === "starter" ? t("Start your free month") : t("Create account")}
            {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </form>

      <p className="mt-8 text-sm text-ink-muted">
        {t("Already registered?")}{" "}
        <Link href="/login" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          {t("Sign in")}
        </Link>
        {" · "}
        <Link href="/signup" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          {t("Buyer account")}
        </Link>
      </p>
    </AuthShell>
  );
}
