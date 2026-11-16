"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, Link2, RefreshCw, Unlink } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, StatusBadge } from "@/components/dashboard/DashboardParts";
import { OrgAvatar, orgName, useDay } from "@/components/questions/shared";
import { useBunonStore } from "@/lib/store";
import { t } from "@/lib/i18n";

interface Profile {
  district: string;
  workers: number;
  association: string;
  membershipNo: string;
  tradeLicence: string;
  bin: string;
  erc: string;
  difeLicence: string;
  declaredAt: string;
}
interface LinkRow {
  id: string;
  status: "active" | "unlink_pending" | "unlinked";
  createdAt: string;
  via: "seed" | "invite";
  partner: { id: string; name: string };
  profile: Profile | null;
  unlink: { byMe: boolean; requestedAt: string; effectiveAt: string } | null;
  unlinkedAt: string | null;
  exportUntil: string | null;
}
interface InviteRow {
  id: string;
  note: string;
  createdAt: string;
  expiresAt: string;
  state: "open" | "used" | "revoked" | "expired";
  usedBy: string | null;
}
interface Payload {
  me: { orgId: string; role: "factory" | "buyer"; name: string };
  links: LinkRow[];
  invites: InviteRow[];
}

/** "in 11 h 40 min" */
function untilText(iso: string): string {
  const mins = Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 60000));
  const h = Math.floor(mins / 60);
  return `${t("in")} ${h ? `${h} ${t("h")} ` : ""}${mins % 60} ${t("min")}`;
}

/** The "Your buyers" (factory) and "Your factories" (buyer) page. */
export default function LinksPanel({ role }: { role: "factory" | "buyer" }) {
  const day = useDay();
  const refreshCatalog = useBunonStore((s) => s.refreshCatalog);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/links", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Could not load your links."));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (json.url) {
        setNewUrl(json.url);
        setCopied(false);
        setNote("");
      }
      setConfirming(null);
      await load();
      void refreshCatalog();
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!newUrl) return;
    await navigator.clipboard.writeText(newUrl).catch(() => undefined);
    setCopied(true);
  };

  const openInvites = data?.invites.filter((i) => i.state === "open") ?? [];

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow={role === "factory" ? "Buyers" : "Factories"}
          title={role === "factory" ? "Your buyers" : "Your factories"}
          note={
            role === "factory"
              ? t("Linked buyers see your verified evidence for their orders and send you questionnaires. Invite a buyer with a link.")
              : t("Factories you are linked to. To add one, ask the factory for an invite link.")
          }
        >
          <DemoDataBadge />
        </DashboardHeader>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}

        {role === "factory" && (
          <section className="glass-card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="invite-title">
            <div className="space-y-1">
              <h2 id="invite-title" className="font-display text-xl font-semibold text-ink">
                {t("Invite a buyer")}
              </h2>
              <p className="text-sm text-ink-muted">{t("Each link works once and expires in 7 days. The buyer signs in or creates a free account, then accepts.")}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act("invite", { action: "invite", note });
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="invite-note">
                {t("Who is this invite for?")}
              </label>
              <input
                id="invite-note"
                value={note}
                maxLength={120}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("Who is it for? (optional, only you see this)")}
                className="min-h-[48px] flex-1 rounded-lg border border-field bg-surface/70 px-3 text-base text-ink outline-none focus:border-brand"
              />
              <button type="submit" disabled={busy === "invite"} className="btn-primary-action min-h-[48px]">
                {busy === "invite" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                {t("Create invite link")}
              </button>
            </form>
            {newUrl && (
              <div className="space-y-2 rounded-lg border border-success/40 bg-success-soft p-3">
                <p className="text-sm font-semibold text-success">{t("Invite link ready. Send it to your buyer; it is shown only once.")}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={newUrl} onFocus={(e) => e.currentTarget.select()} aria-label={t("Invite link")} className="min-h-[44px] flex-1 rounded-lg border border-line bg-surface px-3 font-mono text-sm text-ink" />
                  <button type="button" onClick={() => void copy()} className="btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-sm">
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copied ? t("Copied") : t("Copy link")}
                  </button>
                </div>
              </div>
            )}
            {openInvites.length > 0 && (
              <ul className="divide-y divide-line border-t border-line">
                {openInvites.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-ink-muted">
                      <strong className="font-medium text-ink">{i.note || t("Invite link")}</strong> · {t("expires")} {day(i.expiresAt)}
                    </span>
                    <button
                      type="button"
                      disabled={busy === i.id}
                      onClick={() => void act(i.id, { action: "revoke", inviteId: i.id })}
                      className="min-h-[44px] rounded-lg px-3 font-medium text-ink-muted hover:text-danger"
                    >
                      {t("Cancel invite")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {data && data.links.length === 0 && (
          <p className="glass-card p-6 text-ink-muted">
            {role === "factory" ? t("No buyers yet. Create an invite link above and send it to a buyer.") : t("No factories yet. Ask a factory for an invite link.")}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {data?.links.map((l) => {
            const name = orgName(l.partner.name);
            return (
              <li key={l.id} className="glass-card flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <OrgAvatar name={l.partner.name} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-display text-xl font-semibold tracking-tight text-ink">{name}</p>
                    <p className="text-sm text-ink-faint">
                      {t("Linked since")} {day(l.createdAt)}
                      {l.profile
                        ? ` · ${l.profile.district} · ${l.profile.workers.toLocaleString()} ${t("workers")}${l.profile.association !== "none" ? ` · ${l.profile.association}` : ""}`
                        : ""}
                    </p>
                  </div>
                  {l.status === "active" ? (
                    <StatusBadge tone="ok">Linked</StatusBadge>
                  ) : l.status === "unlink_pending" ? (
                    <StatusBadge tone="review">Unlinking</StatusBadge>
                  ) : (
                    <StatusBadge tone="bad">Unlinked</StatusBadge>
                  )}
                </div>

                {l.profile && (
                  <details className="text-sm text-ink-muted">
                    <summary className="flex min-h-[44px] w-fit cursor-pointer items-center font-medium">{t("Factory details (self-declared, not checked by Bunon)")}</summary>
                    <dl className="grid gap-x-6 gap-y-1 pb-2 sm:grid-cols-2">
                      {(
                        [
                          ["Trade licence", l.profile.tradeLicence],
                          ["BIN", l.profile.bin],
                          ["ERC", l.profile.erc],
                          ["DIFE licence", l.profile.difeLicence],
                          ["Membership", l.profile.association === "none" ? "—" : `${l.profile.association} ${l.profile.membershipNo}`],
                          ["Declared", day(l.profile.declaredAt)],
                        ] as const
                      ).map(([k, val]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-ink-faint">{t(k)}:</dt>
                          <dd className="font-mono text-ink">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}

                {l.status === "unlink_pending" && l.unlink && (
                  <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-ink-muted">
                    {l.unlink.byMe
                      ? `${t("You asked to unlink. It happens")} ${untilText(l.unlink.effectiveAt)} ${t("unless you cancel.")}`
                      : `${name} ${t("asked to unlink. It happens")} ${untilText(l.unlink.effectiveAt)}. ${t("You can agree now to unlink straight away.")}`}{" "}
                    {t("New questions are paused until then.")}
                  </p>
                )}
                {l.status === "unlinked" && l.exportUntil && (
                  <p className="rounded-lg border border-line bg-surface-2/60 px-3 py-2.5 text-sm text-ink-muted">
                    {t("Download the shared data before")} <strong className="text-ink">{day(l.exportUntil)}</strong>. {t("After that, Bunon deletes the shared answers for both sides.")}
                  </p>
                )}

                {confirming === l.id ? (
                  <div className="space-y-3 rounded-lg border border-danger/30 bg-danger-soft/50 p-4">
                    <p className="text-sm text-ink">
                      <strong>
                        {t("Unlink from")} {name}?
                      </strong>{" "}
                      {t("Nothing changes for 12 hours and you can cancel during that time. After that you both have 30 days to download the shared data.")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busy === l.id} onClick={() => void act(l.id, { action: "unlink", linkId: l.id })} className="btn-tactile-hollow inline-flex min-h-[44px] items-center gap-2 border-danger px-4 text-sm text-danger">
                        <Unlink className="h-4 w-4" aria-hidden="true" />
                        {t("Unlink")}
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-ink-muted hover:text-ink">
                        {t("Keep linked")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/api/export?linkId=${l.id}`} className={`${l.status === "unlinked" ? "btn-primary-action" : "btn-tactile-hollow"} inline-flex min-h-[44px] items-center gap-2 px-4 text-sm`}>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {t("Download shared data")}
                    </a>
                    {l.status === "active" && (
                      <button type="button" onClick={() => setConfirming(l.id)} className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-ink-muted hover:text-danger">
                        {t("Unlink")}…
                      </button>
                    )}
                    {l.status === "unlink_pending" && l.unlink?.byMe && (
                      <button type="button" disabled={busy === l.id} onClick={() => void act(l.id, { action: "cancel", linkId: l.id })} className="btn-secondary-action min-h-[44px] px-4 text-sm">
                        {t("Cancel unlink")}
                      </button>
                    )}
                    {l.status === "unlink_pending" && l.unlink && !l.unlink.byMe && (
                      <button type="button" disabled={busy === l.id} onClick={() => void act(l.id, { action: "agree", linkId: l.id })} className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-ink-muted hover:text-danger">
                        {t("Agree and unlink now")}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {data && <p className="text-sm text-ink-faint">{t("Either side can unlink at any time. The other side is told, and nothing changes for 12 hours.")}</p>}
      </main>
    </div>
  );
}
