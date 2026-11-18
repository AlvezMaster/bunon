"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, CircleAlert, Eye, EyeOff, Info, LogOut, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useBunonStore } from "@/lib/store";
import { t } from "@/lib/i18n";

interface Account {
  fullName: string;
  email: string;
  role: "factory" | "buyer";
  company: string;
  country: string | null;
  owner: boolean | null;
  editable: boolean;
  plan: { id: string; name: string; status: string } | null;
}

type Note = { kind: "ok" | "error"; text: string; field?: string } | null;

const STATUS: Record<string, string> = {
  trialing: "Free month",
  active: "Active",
  past_due: "Payment due",
  awaiting_payment: "Waiting for payment",
  quote_requested: "Quote requested",
};

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { error?: string; field?: string; fullName?: string };
  if (!res.ok) throw Object.assign(new Error(json.error ?? `HTTP ${res.status}`), { field: json.field });
  return json;
}

/** Everyone: your name, passphrase and company in one place, plus "Sign out everywhere". */
export default function AccountPage() {
  const session = useBunonStore((s) => s.session);
  const setSession = useBunonStore((s) => s.setSession);
  const [account, setAccount] = useState<Account | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, Note>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/account", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as Account & { error?: string };
      if (!res.ok) return setLoadError(json.error ?? t("Could not load your account."));
      setAccount(json);
      setName(json.fullName);
    })();
  }, []);

  const run = async (key: string, body: Record<string, unknown>, ok: string, after?: (json: { fullName?: string }) => void) => {
    setBusy(key);
    setNotes((n) => ({ ...n, [key]: null }));
    try {
      const json = await post(body);
      after?.(json);
      setNotes((n) => ({ ...n, [key]: { kind: "ok", text: t(ok) } }));
    } catch (e) {
      setNotes((n) => ({ ...n, [key]: { kind: "error", text: t(e instanceof Error ? e.message : "Something went wrong."), field: (e as { field?: string }).field } }));
    } finally {
      setBusy(null);
    }
  };

  const locked = account !== null && !account.editable;
  const signupHref = account?.role === "factory" ? "/signup/factory" : "/signup";

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="Account" title="Your account" />

        {loadError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {loadError}
          </p>
        )}
        {!account && !loadError && <div className="glass-card h-72 animate-pulse motion-reduce:animate-none" aria-hidden="true" />}

        {account && (
          <>
            <section className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6" aria-label={t("Your company")}>
              <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-xl font-semibold text-white">
                {(account.fullName.trim().charAt(0) || "?").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-semibold text-ink">{account.fullName}</p>
                <p className="truncate text-sm text-ink-muted">{account.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {account.company} · {t(account.role === "factory" ? "Factory" : "Buyer")}
                    {account.owner ? ` · ${t("Owner")}` : ""}
                  </span>
                </p>
              </div>
              {account.plan && (
                <Link href="/factory/billing" className="btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-4 text-sm sm:self-center">
                  {t(account.plan.name)} · {t(STATUS[account.plan.status] ?? account.plan.status)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </section>

            {locked && (
              <p className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span>
                  {t("This is a shared demo account, so its name and passphrase stay as they are.")}{" "}
                  <Link href={signupHref} className="font-medium text-brand underline underline-offset-2">
                    {t("Make your own account")}
                  </Link>
                </span>
              </p>
            )}

            <Card title={t("Your name")}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run("rename", { action: "rename", fullName: name }, "Name saved.", (json) => {
                    if (session && json.fullName) setSession({ ...session, fullName: json.fullName, avatarInitial: json.fullName.charAt(0).toUpperCase() });
                  });
                }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <label className="sr-only" htmlFor="full-name">
                  {t("Your name")}
                </label>
                <input
                  id="full-name"
                  value={name}
                  maxLength={80}
                  disabled={locked}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-[48px] flex-1 rounded-lg border border-field bg-surface/70 px-3 text-base text-ink outline-none focus:border-brand disabled:opacity-60"
                />
                <button type="submit" disabled={locked || busy === "rename" || name.trim() === account.fullName} className="btn-tactile-hollow inline-flex min-h-[48px] items-center justify-center gap-2 px-5">
                  {busy === "rename" && <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  {t("Save name")}
                </button>
              </form>
              <Status note={notes.rename} />
            </Card>

            <Card title={t("Passphrase")} note={t("At least 10 characters. Changing it signs you out on every other device.")}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run("passphrase", { action: "passphrase", current, next }, "Passphrase changed. Other devices are signed out.", () => {
                    setCurrent("");
                    setNext("");
                  });
                }}
                className="flex flex-col gap-3"
              >
                <Field id="current-pass" label={t("Current passphrase")} value={current} onChange={setCurrent} show={show} disabled={locked} autoComplete="current-password" invalid={notes.passphrase?.field === "current"} />
                <Field id="new-pass" label={t("New passphrase")} value={next} onChange={setNext} show={show} disabled={locked} autoComplete="new-password" invalid={notes.passphrase?.field === "next"} />
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={locked || busy === "passphrase" || !current || next.length < 10} className="btn-primary-action min-h-[48px]">
                    {busy === "passphrase" && <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    {t("Change passphrase")}
                  </button>
                  <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink-muted hover:text-ink">
                    {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    {t(show ? "Hide" : "Show")}
                  </button>
                </div>
              </form>
              <Status note={notes.passphrase} />
            </Card>

            <Card title={t("Sign out everywhere")} note={t("Signed in on a shared or lost device? This ends every session. You stay signed in here.")}>
              <button
                type="button"
                disabled={locked || busy === "everywhere"}
                onClick={() => void run("everywhere", { action: "signout_everywhere" }, "Done. Other devices are signed out within a minute.")}
                className="btn-tactile-hollow inline-flex min-h-[48px] items-center justify-center gap-2 self-start px-5"
              >
                {busy === "everywhere" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                {t("Sign out everywhere")}
              </button>
              <Status note={notes.everywhere} />
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="glass-card flex flex-col gap-3 p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {note && <p className="text-sm text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Field(p: { id: string; label: string; value: string; onChange: (v: string) => void; show: boolean; disabled: boolean; autoComplete: string; invalid: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={p.id} className="text-sm font-medium text-ink">
        {p.label}
      </label>
      <input
        id={p.id}
        type={p.show ? "text" : "password"}
        value={p.value}
        maxLength={200}
        disabled={p.disabled}
        autoComplete={p.autoComplete}
        aria-invalid={p.invalid || undefined}
        onChange={(e) => p.onChange(e.target.value)}
        className={`min-h-[48px] rounded-lg border bg-surface/70 px-3 text-base text-ink outline-none focus:border-brand disabled:opacity-60 ${p.invalid ? "border-danger" : "border-field"}`}
      />
    </div>
  );
}

function Status({ note }: { note: Note }) {
  return (
    <div aria-live="polite">
      {note && (
        <p className={`flex items-start gap-2 text-sm ${note.kind === "ok" ? "text-success" : "text-danger"}`}>
          {note.kind === "ok" ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          {note.text}
        </p>
      )}
    </div>
  );
}
