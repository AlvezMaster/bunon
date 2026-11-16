"use client";

import { t } from "@/lib/i18n";
import React, { useState } from "react";
import { X, Copy, Check, ShieldCheck, AlertTriangle, MapPin, Send, Upload, RefreshCw } from "lucide-react";
import type { SupplyChainTier } from "@/lib/styles";
import { useBunonStore } from "@/lib/store";
import { formatIsoDate } from "@/lib/certificate-registry";
import { shortHash } from "@/lib/crypto";
import { postLedgerEvent, type LedgerPostResult } from "@/lib/ledger-client";
import { TIER_LABEL } from "@/lib/labels";
import { StatusBadge } from "@/components/dashboard/DashboardParts";

interface NodeInspectorDrawerProps {
  styleCode: string;
  tier: SupplyChainTier;
  /** SHA-256 leaf hash of this tier in the order's Merkle tree; null while it is being computed. */
  leafHash: string | null;
  isOpen: boolean;
  onClose: () => void;
  /** Opens the document ingestion dialog for this tier. */
  onUploadRenewal: (tier: SupplyChainTier) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** Outline-based so it is not overridden by the box-shadow of the btn-* classes. */
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function NodeInspectorDrawer({
  styleCode,
  tier,
  leafHash,
  isOpen,
  onClose,
  onUploadRenewal,
}: NodeInspectorDrawerProps) {
  const dispatchChase = useBunonStore((s) => s.dispatchChase);
  const chasedAt = useBunonStore((s) => s.chases[styleCode]?.[tier.id] ?? null);

  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [chasing, setChasing] = useState(false);
  const [chaseResult, setChaseResult] = useState<LedgerPostResult | null>(null);

  if (!isOpen) return null;

  const isExpired = tier.status === "expired";
  const validLabel = formatIsoDate(tier.validThrough);

  const handleCopyHash = async () => {
    if (!leafHash) return;
    try {
      await navigator.clipboard.writeText(leafHash);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 1800);
  };

  const handleDispatchChase = async () => {
    setChasing(true);
    setChaseResult(null);
    dispatchChase(styleCode, tier.id);
    const result = await postLedgerEvent({
      type: "SUPPLIER CHASE",
      status: "verified",
      styleCode,
      summary: `Renewal chase for order ${styleCode}: ${tier.facilityName} (Tier ${tier.tierNumber}), contact ${tier.contactPerson}, ${tier.contactChannel}, asked to supply a renewed ${tier.certType} replacing certificate ${tier.certNumber} (valid through ${validLabel}).`,
    });
    setChaseResult(result);
    setChasing(false);
  };

  return (
    <div className="rounded-[4px] border border-line bg-surface p-5 text-ink sm:p-6">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">{t(TIER_LABEL[tier.id])}</span>
              <StatusBadge tone={isExpired ? "bad" : "ok"}>{isExpired ? "Certificate expired" : "Certificate valid"}</StatusBadge>
            </div>
            <h3 className="mt-1 font-display text-xl font-bold text-ink">{tier.facilityName}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{tier.facilityLocation}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[3px] border border-line text-ink-muted hover:bg-canvas hover:text-ink ${focusRing}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* What is on file */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-ink-muted">{t("Material")}</dt>
          <dd className="text-ink">{tier.material}</dd>
          <dt className="text-ink-muted">{t("Certificate")}</dt>
          <dd className="text-ink">
            {tier.certType} · <span className="font-mono tabular-nums">{tier.certNumber}</span>
          </dd>
          <dt className="text-ink-muted">{t("Valid until")}</dt>
          <dd className={`font-mono tabular-nums ${isExpired ? "font-semibold text-danger" : "text-ink"}`}>{validLabel}</dd>
          <dt className="text-ink-muted">{t("Contact")}</dt>
          <dd className="text-ink">
            {tier.contactPerson} · {tier.contactChannel}
          </dd>
        </dl>

        {/* Expired: what to do next */}
        {isExpired && (
          <div className="flex flex-col gap-3 rounded-[3px] border border-danger bg-danger-soft p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t("Order")} {styleCode} {t("is on hold until a renewed certificate is uploaded.")}
              </span>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onUploadRenewal(tier)}
                className={`btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-sm ${focusRing}`}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>{t("Upload renewed certificate")}</span>
              </button>
              <button
                type="button"
                onClick={handleDispatchChase}
                disabled={chasing}
                aria-busy={chasing}
                className={`btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
              >
                {chasing ? (
                  <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{t(chasedAt ? "Log another renewal reminder" : "Log a renewal reminder")}</span>
              </button>
            </div>

            <div aria-live="polite" className="space-y-2 text-sm">
              {chasedAt ? (
                <p className="text-ink-muted">
                  {t("Reminder last logged")} <span className="font-mono tabular-nums">{formatDateTime(chasedAt)}</span> ·{" "}
                  {tier.contactPerson} ({tier.contactChannel}).{" "}
                  {t("Bunon only records the reminder; no messaging service is connected, so your team sends the request itself.")}
                </p>
              ) : (
                <p className="text-ink-muted">{t("No renewal reminder has been logged for this supplier yet.")}</p>
              )}

              {chaseResult?.ok === true && (
                <p className="flex items-center gap-1.5 text-ink-muted">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t("Saved in the ledger as")} {chaseResult.block.id}.
                  </span>
                </p>
              )}
              {chaseResult?.ok === false && (
                <p className="flex items-center gap-1.5 text-danger">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t("Not saved in the ledger.")} {chaseResult.error} {t("The reminder is saved on this device only.")}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        <details className="text-xs">
          <summary className={`flex min-h-[44px] cursor-pointer items-center font-semibold text-ink-muted rounded-[3px] ${focusRing}`}>
            {t("Technical details")}
          </summary>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-ink-muted">{t("Record fingerprint (SHA-256)")}</span>
            <button
              type="button"
              onClick={handleCopyHash}
              disabled={!leafHash}
              className={`flex min-h-[44px] items-center gap-1 rounded-[3px] px-2 text-brand hover:underline disabled:no-underline disabled:opacity-50 ${focusRing}`}
            >
              {copied === "copied" ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              <span aria-live="polite">{copied === "copied" ? "Copied" : copied === "failed" ? "Copy failed" : "Copy hash"}</span>
            </button>
          </div>
          <p
            className="mt-1 rounded-[3px] border border-line bg-canvas p-2 font-mono tabular-nums text-ink"
            title={leafHash ?? undefined}
          >
            {leafHash ? shortHash(leafHash, 18, 8) : "Computing…"}
          </p>
          <p className="mt-1 text-ink-muted">
            SHA-256 leaf of order {styleCode}&apos;s Merkle tree, computed in your browser from this tier&apos;s facility,
            standard, certificate number, validity and material.
          </p>
        </details>
      </div>
    </div>
  );
}
