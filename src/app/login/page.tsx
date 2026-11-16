"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Factory, ShoppingBag, RefreshCw, TriangleAlert } from "lucide-react";
import { useBunonStore, type SessionUser, type UserRole } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PreferenceToggles } from "@/components/Preferences";
import BunonLogo from "@/components/BunonLogo";

const FIELD =
  "w-full rounded-lg border border-field bg-surface/70 px-3 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_18%,transparent)] dark:bg-white/[0.03]";

const ROLES: Record<UserRole, { label: string; Icon: typeof Factory; email: string; blurb: string; home: string }> = {
  factory: {
    label: "Factory",
    Icon: Factory,
    email: "factory@nodiwear.example",
    blurb: "Upload and check certificates, answer buyer questionnaires, and approve what gets sent.",
    home: "/factory",
  }, buyer: {
    label: "Buyer",
    Icon: ShoppingBag,
    email: "buyer@nordlys-apparel.example",
    blurb: "Check a supplier's verified evidence and confirm every answer against its source.",
    home: "/buyer",
  },
};

const ROLE_ORDER: UserRole[] = ["factory", "buyer"];

/** Only same-site paths are allowed as a post-login destination. */
function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useBunonStore((s) => s.setSession);
  const session = useBunonStore((s) => s.session);

  const [activeRole, setActiveRole] = useState<UserRole>("factory");
  const [email, setEmail] = useState<string>(ROLES.factory.email);
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // Pre-select the role from ?role= or from the area the visitor was trying to open (?next=/buyer…).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next") ?? "";
    const invite = nextPath.match(/^\/invite\/([A-Za-z0-9_-]{20,100})$/)?.[1] ?? null;
    setInviteToken(invite);
    const wanted = params.get("role") ?? (nextPath.startsWith("/buyer") || invite ? "buyer" : null);
    if (wanted === "buyer" || wanted === "factory") {
      setActiveRole(wanted);
      setEmail(ROLES[wanted].email);
    }
  }, []);

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
    setEmail(ROLES[role].email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; user?: SessionUser };
      if (!res.ok || !data.user) {
        throw new Error(data.error || t("Sign-in failed. Check the email and passphrase, then try again."));
      }
      setSession(data.user);
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.push(next ?? ROLES[data.user.role].home);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("Sign-in failed. Check the email and passphrase, then try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const role = ROLES[activeRole];

  return (
    <div className="flex min-h-screen flex-col text-ink">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 sm:px-6">
        <Link
          href="/"
          className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("Back to overview")}
        </Link>
        <PreferenceToggles />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:px-8">
        <div className="morph-in w-full max-w-[420px] rounded-xl border border-line bg-surface/80 p-6 shadow-[var(--shadow-raised)] backdrop-blur-xl sm:p-8 dark:border-white/[0.12] dark:bg-white/[0.04]">
          <Link href="/" aria-label={t("Bunon home")} className="mx-auto flex w-fit items-center gap-3 rounded-lg">
            <BunonLogo className="h-11 w-11" />
            <span className="font-display text-4xl font-semibold tracking-tight">Bunon</span>
          </Link>

          <div className="mt-6 space-y-2 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight [text-wrap:balance]">{t("Sign in to Bunon")}</h1>
            <p className="text-sm text-ink-muted">{t("Factories and buyers each have their own workspace.")}</p>
          </div>

          {session && (
            <div role="status" className="mt-6 rounded-lg border border-line bg-surface-2 p-3 text-sm text-ink-muted">
              {t("Signed in as")}{" "}<strong className="text-ink">{session.fullName}</strong>{t(". Signing in again switches account.")}
            </div>
          )}

          <div
            role="radiogroup"
            aria-label={t("Account type")}
            className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface-2/70 p-1"
          >
            {ROLE_ORDER.map((r) => {
              const selected = activeRole === r;
              const { Icon, label } = ROLES[r];
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleRoleSwitch(r)}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 ${
                    selected ? "bg-[var(--color-ink)] text-canvas shadow-[var(--shadow-card)]" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(label)}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs italic text-ink-muted">{t(role.blurb)}</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm font-medium text-ink">
                {t("Email")}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={FIELD}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-ink">
                {t("Passphrase")}
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby="login-hint"
                aria-invalid={errorMessage ? true : undefined}
                className={FIELD}
              />
            </div>

            <p
              id="login-hint"
              className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-ink-muted"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <span>
                {t("Demo accounts use the passphrase")}{" "}<code className="font-mono font-semibold text-ink">demo123</code>{t(". Both companies are fictional.")}
              </span>
            </p>

            {errorMessage && (
              <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                {errorMessage}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary-action min-h-[48px] w-full rounded-lg">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  <span>{t("Signing in…")}</span>
                </>
              ) : (
                <>
                  <span>{t(`Sign in as ${role.label.toLowerCase()}`)}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {t("New to Bunon?")}{" "}
            <Link
              href={inviteToken ? `/signup?role=buyer&invite=${inviteToken}` : `/signup?role=${activeRole}`}
              className="font-semibold text-ink underline decoration-line-strong underline-offset-4"
            >
              {t("Create an account")}
            </Link>
          </p>

          <details className="group mt-2 text-center text-xs text-ink-muted">
            <summary className="mx-auto flex min-h-[44px] w-fit cursor-pointer list-none items-center font-medium underline decoration-line-strong underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
              {t("Technical details")}
            </summary>
            <p className="pb-2 text-left">
              {t("Passwords are stored as scrypt hashes; sessions use a signed, httpOnly cookie that expires after 8 hours.")}
            </p>
          </details>
        </div>
      </main>
    </div>
  );
}
