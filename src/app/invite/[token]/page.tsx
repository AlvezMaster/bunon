"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleAlert, RefreshCw } from "lucide-react";
import { useBunonStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PreferenceToggles } from "@/components/Preferences";
import BunonLogo from "@/components/BunonLogo";
import { orgName } from "@/lib/questionnaire";

type Lookup = { state: "open" | "used" | "revoked" | "expired" | "invalid"; factory?: string; expiresAt?: string };

/** Where an invite link lands: shows which factory invites you, then lets a buyer accept. */
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const session = useBunonStore((s) => s.session);
  const refreshCatalog = useBunonStore((s) => s.refreshCatalog);
  const [info, setInfo] = useState<Lookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invites?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<Lookup>)
      .then(setInfo)
      .catch(() => setInfo({ state: "invalid" }));
  }, [token]);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept", token }) });
      const json = (await res.json()) as { error?: string; factory?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setLinked(json.factory ?? info?.factory ?? "");
      void refreshCatalog();
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const factory = info?.factory ? orgName(info.factory) : "";
  const here = `/invite/${token}`;

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
        <div className="morph-in w-full max-w-[460px] rounded-xl border border-line bg-surface/80 p-6 shadow-[var(--shadow-raised)] backdrop-blur-xl sm:p-8 dark:border-white/[0.12] dark:bg-white/[0.04]">
          <BunonLogo className="mx-auto h-10 w-10" />

          {!info ? (
            <p className="mt-6 text-center text-ink-muted">{t("Checking the invite…")}</p>
          ) : info.state !== "open" && !linked ? (
            <div className="mt-6 space-y-3 text-center">
              <CircleAlert className="mx-auto h-8 w-8 text-warning" aria-hidden="true" />
              <h1 className="font-display text-2xl font-semibold">
                {info.state === "used" ? t("This invite was already used") : info.state === "expired" ? t("This invite has expired") : t("This invite doesn't work")}
              </h1>
              <p className="text-sm text-ink-muted">{t("Invite links work once and expire after 7 days. Ask the factory for a new one.")}</p>
            </div>
          ) : linked ? (
            <div className="mt-6 space-y-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="h-6 w-6" aria-hidden="true" />
              </span>
              <h1 className="font-display text-2xl font-semibold">
                {t("You're linked with")} {orgName(linked)}
              </h1>
              <p className="text-sm text-ink-muted">{t("You can now send them questionnaires and see their verified evidence for your orders.")}</p>
              <button type="button" onClick={() => router.push("/buyer/factories")} className="btn-primary-action min-h-[48px] w-full rounded-lg">
                {t("Go to your factories")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="space-y-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">{t("Invitation")}</p>
                <h1 className="font-display text-2xl font-semibold tracking-tight [text-wrap:balance]">
                  {factory} {t("invites you to link as their buyer")}
                </h1>
              </div>
              <ul className="space-y-2 text-sm text-ink-muted">
                {[
                  "You see their verified certificates for your orders.",
                  "You send them questionnaires; they answer from their documents, with the source sentence.",
                  "Either side can unlink at any time.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    {t(line)}
                  </li>
                ))}
              </ul>

              {error && (
                <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                  {error}
                </p>
              )}

              {session?.role === "buyer" ? (
                <>
                  <button type="button" onClick={() => void accept()} disabled={busy} className="btn-primary-action min-h-[48px] w-full rounded-lg">
                    {busy && <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    {t("Accept and link")} {orgName(session.organization)}
                  </button>
                  <p className="text-center text-xs text-ink-faint">
                    {t("Signed in as")} {session.fullName}
                  </p>
                </>
              ) : session?.role === "factory" ? (
                <p className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-ink-muted">
                  {t("This invite is for buyer accounts. Sign out, then sign in or create a buyer account.")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href={`/signup?invite=${token}`} className="btn-primary-action min-h-[48px] w-full rounded-lg">
                    {t("Create a free buyer account")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href={`/login?next=${encodeURIComponent(here)}`} className="flex min-h-[48px] items-center justify-center rounded-lg text-sm font-semibold text-ink-muted hover:text-ink">
                    {t("I already have a buyer account")}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
