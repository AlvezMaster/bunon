"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Factory, RefreshCw, ShoppingBag } from "lucide-react";
import { useBunonStore, type SessionUser, type UserRole } from "@/lib/store";
import { t } from "@/lib/i18n";
import AuthShell, { AuthField } from "@/components/auth/AuthShell";

const HOME: Record<UserRole, string> = { factory: "/factory", buyer: "/buyer" };
/** The public demo accounts (fictional companies); their passphrase is published on purpose. */
const DEMO: Array<{ role: UserRole; label: string; email: string; Icon: typeof Factory }> = [
  { role: "factory", label: "Demo factory", email: "factory@nodiwear.example", Icon: Factory },
  { role: "buyer", label: "Demo buyer", email: "buyer@nordlys-apparel.example", Icon: ShoppingBag },
];

/** Only same-site paths are allowed as a post-login destination. */
function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useBunonStore((s) => s.setSession);
  const session = useBunonStore((s) => s.session);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next") ?? "";
    setInvite(next.match(/^\/invite\/([A-Za-z0-9_-]{20,100})$/)?.[1] ?? null);
  }, []);

  const signIn = async (who: { email: string; password: string }, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(who) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; user?: SessionUser };
      if (!res.ok || !data.user) throw new Error(data.error || "Check the email and passphrase, then try again.");
      setSession(data.user);
      router.push(safeNext(new URLSearchParams(window.location.search).get("next")) ?? HOME[data.user.role]);
    } catch (err) {
      setError(t(err instanceof Error ? err.message : "Check the email and passphrase, then try again."));
      setBusy(null);
    }
  };

  return (
    <AuthShell visualTitle="Answer every buyer once." visualLine="Your documents become sourced answers. A person approves every one.">
      <h1 className="font-display text-[2.25rem] font-semibold leading-tight tracking-[-0.02em]">{t("Sign in")}</h1>
      {session && (
        <p className="mt-2 text-sm text-ink-muted">
          {t("Signed in as")} <strong className="font-medium text-ink">{session.fullName}</strong> ·{" "}
          <Link href={HOME[session.role]} className="font-semibold text-brand hover:underline">
            {t("Open your workspace")}
          </Link>
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {DEMO.map((d) => (
          <button
            key={d.role}
            type="button"
            disabled={!!busy}
            onClick={() => void signIn({ email: d.email, password: "demo123" }, d.role)}
            className="group flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-xl border border-line bg-surface px-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_-12px_rgba(30,58,95,0.35)] active:scale-[0.98] motion-reduce:transform-none"
          >
            {busy === d.role ? <RefreshCw className="h-5 w-5 animate-spin text-brand motion-reduce:animate-none" aria-hidden="true" /> : <d.Icon className="h-5 w-5 text-brand" aria-hidden="true" />}
            <span className="text-sm font-semibold text-ink">{t(d.label)}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{t("One click. Fictional demo companies.")}</p>

      <div className="my-7 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void signIn({ email, password }, "form");
        }}
        className="space-y-4"
        noValidate
      >
        <AuthField id="login-email" label="Email">
          {(p) => <input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </AuthField>
        <AuthField id="login-password" label="Passphrase">
          {(p) => <input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </AuthField>
        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={!!busy} className="btn-primary-action min-h-[52px] w-full rounded-xl text-base">
          {busy === "form" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
          {t("Sign in")}
          {busy !== "form" && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-muted">
        {t("New to Bunon?")}{" "}
        <Link href={invite ? `/signup?invite=${invite}` : "/signup"} className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          {t("Buyer account")}
        </Link>
        {!invite && (
          <>
            {" · "}
            <Link href="/signup/factory" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {t("Register a factory")}
            </Link>
          </>
        )}
      </p>
    </AuthShell>
  );
}
