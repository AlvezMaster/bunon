"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useBunonStore, type SessionUser } from "@/lib/store";
import { t } from "@/lib/i18n";
import AuthShell, { AuthField } from "@/components/auth/AuthShell";
import { checkAccount, type SignupErrors, type SignupInput } from "@/lib/signup-rules";

/** Buyer sign-up: free, four fields. Factories register on /signup/factory. */
export default function BuyerSignupPage() {
  const router = useRouter();
  const setSession = useBunonStore((s) => s.setSession);
  const [invite, setInvite] = useState<string | null>(null);
  const [v, setV] = useState<SignupInput>({ role: "buyer", company: "", fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // Old links that ask for a factory account (or a plan) go to the factory page.
    if (p.get("role") === "factory" || p.get("plan")) {
      router.replace(`/signup/factory${p.get("plan") ? `?plan=${encodeURIComponent(p.get("plan") as string)}` : ""}`);
      return;
    }
    const inv = p.get("invite");
    if (inv && /^[A-Za-z0-9_-]{20,100}$/.test(inv)) setInvite(inv);
  }, [router]);

  const set = <K extends keyof SignupInput>(k: K, value: SignupInput[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs = checkAccount(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: SignupErrors; user?: SessionUser };
      if (!res.ok || !data.user) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error ?? "Sign-up failed.");
      }
      setSession(data.user);
      router.push(invite ? `/invite/${invite}` : "/buyer");
    } catch (err) {
      setFormError(t(err instanceof Error ? err.message : "Sign-up failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell visualTitle="Every answer, with its source." visualLine="See what each factory answered and the document it came from. Free for buyers.">
      <h1 className="font-display text-[2.25rem] font-semibold leading-tight tracking-[-0.02em]">{t("Create a buyer account")}</h1>
      <p className="mt-2 text-base text-ink-muted">{invite ? t("Then accept the factory's invite.") : t("Free for buyers.")}</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <AuthField id="company" label="Company name" error={errors.company}>
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
        {formError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {formError}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary-action min-h-[52px] w-full rounded-xl text-base">
          {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
          {busy ? t("Creating account…") : t("Create account")}
          {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      <div className="mt-8 space-y-2 text-sm text-ink-muted">
        {!invite && (
          <p>
            {t("Registering a factory?")}{" "}
            <Link href="/signup/factory" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {t("Factory sign-up")}
            </Link>
          </p>
        )}
        <p>
          {t("Already have an account?")}{" "}
          <Link href={invite ? `/login?next=${encodeURIComponent(`/invite/${invite}`)}` : "/login"} className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            {t("Sign in")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
