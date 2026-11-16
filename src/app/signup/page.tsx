"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Factory, RefreshCw, ShieldCheck, ShoppingBag } from "lucide-react";
import { useBunonStore, type SessionUser, type UserRole } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PreferenceToggles } from "@/components/Preferences";
import BunonLogo from "@/components/BunonLogo";
import { checkAccount, checkFactoryProfile, type SignupErrors, type SignupInput } from "@/lib/signup-rules";

const FIELD =
  "w-full rounded-lg border bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)] dark:bg-white/[0.03]";

function Field({
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
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, className: `${FIELD} ${error ? "border-danger" : "border-field"}` })}
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

export default function SignupPage() {
  const router = useRouter();
  const setSession = useBunonStore((s) => s.setSession);
  const [role, setRole] = useState<UserRole>("buyer");
  const [step, setStep] = useState<1 | 2>(1);
  const [invite, setInvite] = useState<string | null>(null);
  const [v, setV] = useState<SignupInput>({ role: "buyer", company: "", fullName: "", email: "", password: "", association: "BGMEA", declaration: false });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const r = p.get("role");
    if (r === "factory" || r === "buyer") setRole(r);
    const inv = p.get("invite");
    if (inv && /^[A-Za-z0-9_-]{20,100}$/.test(inv)) {
      setInvite(inv);
      setRole("buyer");
    }
  }, []);

  const set = <K extends keyof SignupInput>(k: K, value: SignupInput[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const switchRole = (r: UserRole) => {
    setRole(r);
    setStep(1);
    setErrors({});
    setFormError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const input = { ...v, role };
    const accountErrors = checkAccount(input);
    if (role === "factory" && step === 1) {
      setErrors(accountErrors);
      if (!Object.keys(accountErrors).length) setStep(2);
      return;
    }
    const all = { ...accountErrors, ...(role === "factory" ? checkFactoryProfile(input) : {}) };
    setErrors(all);
    if (Object.keys(all).length) {
      if (Object.keys(accountErrors).length) setStep(1);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: SignupErrors; user?: SessionUser };
      if (!res.ok || !data.user) {
        if (data.errors) {
          setErrors(data.errors);
          if (data.errors.email || data.errors.company) setStep(1);
        }
        throw new Error(data.error ?? "Sign-up failed.");
      }
      setSession(data.user);
      router.push(invite ? `/invite/${invite}` : data.user.role === "factory" ? "/factory" : "/buyer");
    } catch (err) {
      setFormError(t(err instanceof Error ? err.message : "Sign-up failed."));
    } finally {
      setBusy(false);
    }
  };

  const factoryStep2 = role === "factory" && step === 2;

  return (
    <div className="flex min-h-screen flex-col text-ink">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 sm:px-6">
        <Link href="/" className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("Back to overview")}
        </Link>
        <PreferenceToggles />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:px-8">
        <div
          className={`morph-in w-full rounded-xl border border-line bg-surface/80 p-6 shadow-[var(--shadow-raised)] backdrop-blur-xl sm:p-8 dark:border-white/[0.12] dark:bg-white/[0.04] ${
            factoryStep2 ? "max-w-[560px]" : "max-w-[440px]"
          }`}
        >
          <Link href="/" aria-label={t("Bunon home")} className="mx-auto flex w-fit items-center gap-3 rounded-lg">
            <BunonLogo className="h-10 w-10" />
            <span className="font-display text-3xl font-semibold tracking-tight">Bunon</span>
          </Link>

          <div className="mt-6 space-y-2 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight [text-wrap:balance]">
              {factoryStep2 ? t("About your factory") : t("Create your Bunon account")}
            </h1>
            <p className="text-sm text-ink-muted">
              {invite
                ? t("Create a buyer account to accept the factory's invite.")
                : role === "factory"
                  ? `${t("Step")} ${step} ${t("of")} 2 · ${step === 1 ? t("Your account") : t("Factory details for buyers")}`
                  : t("Free for buyers. Takes a minute.")}
            </p>
          </div>

          <p className="mt-4 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-center text-xs text-ink-muted">
            {t("Preview: new accounts start empty. The orders, documents and questionnaires in this demo belong to fictional demo companies.")}
          </p>

          {!invite && step === 1 && (
            <div role="radiogroup" aria-label={t("Account type")} className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface-2/70 p-1">
              {(["factory", "buyer"] as const).map((r) => {
                const Icon = r === "factory" ? Factory : ShoppingBag;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={role === r}
                    onClick={() => switchRole(r)}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-semibold transition-[background-color,color] duration-200 ${
                      role === r ? "bg-[var(--color-ink)] text-canvas" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {r === "factory" ? t("Factory") : t("Buyer")}
                  </button>
                );
              })}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {!factoryStep2 ? (
              <>
                <Field id="company" label={role === "factory" ? "Factory's registered name" : "Company name"} error={errors.company}>
                  {(p) => <input {...p} autoComplete="organization" value={v.company} onChange={(e) => set("company", e.target.value)} />}
                </Field>
                <Field id="fullName" label="Your name" error={errors.fullName}>
                  {(p) => <input {...p} autoComplete="name" value={v.fullName} onChange={(e) => set("fullName", e.target.value)} />}
                </Field>
                <Field id="email" label="Work email" error={errors.email}>
                  {(p) => <input {...p} type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} />}
                </Field>
                <Field id="password" label="Passphrase" error={errors.password} hint="At least 10 characters.">
                  {(p) => <input {...p} type="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} />}
                </Field>
              </>
            ) : (
              <>
                <p className="flex items-start gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2.5 text-sm text-ink-muted">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>
                    {t("Buyers see these details on your profile, marked as self-declared. Bunon checks the format now; checks against official registers come later.")}
                  </span>
                </p>
                <Field id="address" label="Factory address" error={errors.address}>
                  {(p) => <input {...p} autoComplete="street-address" value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} />}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="district" label="District" error={errors.district}>
                    {(p) => <input {...p} list="districts" value={v.district ?? ""} onChange={(e) => set("district", e.target.value)} />}
                  </Field>
                  <Field id="workers" label="Number of workers" error={errors.workers}>
                    {(p) => <input {...p} inputMode="numeric" value={String(v.workers ?? "")} onChange={(e) => set("workers", e.target.value.replace(/\D/g, ""))} />}
                  </Field>
                </div>
                <datalist id="districts">
                  {["Dhaka", "Gazipur", "Narayanganj", "Chattogram", "Savar", "Mymensingh", "Cumilla"].map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="tradeLicence" label="Trade licence number" error={errors.tradeLicence}>
                    {(p) => <input {...p} value={v.tradeLicence ?? ""} onChange={(e) => set("tradeLicence", e.target.value)} />}
                  </Field>
                  <Field id="bin" label="BIN (VAT)" error={errors.bin} hint="13 digits.">
                    {(p) => <input {...p} inputMode="numeric" value={v.bin ?? ""} onChange={(e) => set("bin", e.target.value)} />}
                  </Field>
                  <Field id="erc" label="Export registration (ERC) number" error={errors.erc}>
                    {(p) => <input {...p} value={v.erc ?? ""} onChange={(e) => set("erc", e.target.value)} />}
                  </Field>
                  <Field id="difeLicence" label="DIFE factory licence number" error={errors.difeLicence}>
                    {(p) => <input {...p} value={v.difeLicence ?? ""} onChange={(e) => set("difeLicence", e.target.value)} />}
                  </Field>
                  <Field id="association" label="Association" error={errors.association}>
                    {(p) => (
                      <select {...p} value={v.association} onChange={(e) => set("association", e.target.value as SignupInput["association"])}>
                        <option value="BGMEA">BGMEA</option>
                        <option value="BKMEA">BKMEA</option>
                        <option value="none">{t("Neither")}</option>
                      </select>
                    )}
                  </Field>
                  {v.association !== "none" && (
                    <Field id="membershipNo" label="Membership number" error={errors.membershipNo}>
                      {(p) => <input {...p} value={v.membershipNo ?? ""} onChange={(e) => set("membershipNo", e.target.value)} />}
                    </Field>
                  )}
                </div>
                <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg py-2 text-sm text-ink">
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
              </>
            )}

            {formError && (
              <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                {formError}
              </div>
            )}

            <div className="flex gap-2">
              {factoryStep2 && (
                <button type="button" onClick={() => setStep(1)} className="btn-tactile-hollow inline-flex min-h-[48px] items-center gap-2 px-4 text-sm">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {t("Back")}
                </button>
              )}
              <button type="submit" disabled={busy} className="btn-primary-action min-h-[48px] flex-1 rounded-lg">
                {busy ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span>{t("Creating account…")}</span>
                  </>
                ) : (
                  <>
                    <span>{role === "factory" && step === 1 ? t("Continue") : t("Create account")}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {t("Already have an account?")}{" "}
            <Link
              href={invite ? `/login?next=${encodeURIComponent(`/invite/${invite}`)}` : `/login?role=${role}`}
              className="font-semibold text-ink underline decoration-line-strong underline-offset-4"
            >
              {t("Sign in")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
