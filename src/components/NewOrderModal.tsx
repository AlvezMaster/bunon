"use client";

import { t } from "@/lib/i18n";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Check, AlertTriangle, AlertOctagon, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { useBunonStore } from "@/lib/store";
import {
  createCustomStyle,
  DEFAULT_STYLE_CODE,
  normalizeStyleCode,
  styleClearance,
  STYLES_CATALOG,
} from "@/lib/styles";
import { buildProvenanceTree } from "@/lib/provenance";
import { postLedgerEvent, type LedgerPostResult } from "@/lib/ledger-client";
import { shortHash } from "@/lib/crypto";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreatedOrder {
  code: string;
  root: string;
  ledger: LedgerPostResult;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inputClass =
  "w-full mt-1 min-h-[44px] p-2.5 rounded-[3px] bg-canvas border border-line text-ink text-base sm:text-sm focus:border-brand outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";
const labelClass = "text-sm font-medium text-ink";

// The supplier chain every new order starts from (createCustomStyle's default template).
const TEMPLATE = STYLES_CATALOG[DEFAULT_STYLE_CODE];
const TEMPLATE_EXPIRED = styleClearance(TEMPLATE).expiredTiers;

export default function NewOrderModal({ isOpen, onClose }: NewOrderModalProps) {
  const addCustomStyle = useBunonStore((s) => s.addCustomStyle);
  // Orders can only be for a buyer this factory is linked to.
  const partners = useBunonStore((s) => s.partners);
  const linkedBuyers = partners.filter((p) => p.status === "active" || p.status === "unlink_pending");
  const [buyerOrgId, setBuyerOrgId] = useState<string>("");
  const buyerChoice = buyerOrgId || linkedBuyers[0]?.orgId || "";
  const customStyles = useBunonStore((s) => s.customStyles);

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  const [styleCode, setStyleCode] = useState<string>("PO-2027-NEW");
  const [title, setTitle] = useState<string>("Organic Twill Overshirt");
  const [garmentType, setGarmentType] = useState<string>("Woven Outerwear");
  const [volume, setVolume] = useState<string>("35,000 PCS");
  const [destination, setDestination] = useState<string>("Rotterdam (NL)");
  const [fiberComposition, setFiberComposition] = useState<string>("100% GOTS Organic Cotton Twill");

  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Focus moves into the form on open and back to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isOpen]);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const validateCode = (raw: string): string | null => {
    const code = normalizeStyleCode(raw);
    if (!code) return t("Enter an order number.");
    if (STYLES_CATALOG[code] || customStyles[code]) return `${t("Order")} ${code} ${t("already exists. Choose a different number.")}`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const error = validateCode(styleCode);
    setCodeError(error);
    if (error) {
      firstFieldRef.current?.focus();
      return;
    }

    setSubmitting(true);
    const buyer = linkedBuyers.find((p) => p.orgId === buyerChoice);
    const style = { ...createCustomStyle({ code: styleCode, title, garmentType, volume, destination, fiberComposition, buyer: buyer?.name }), buyerOrgId: buyer?.orgId };
    // The order exists only once the server has saved it.
    const saved = await addCustomStyle(style);
    if (!saved.ok) {
      setCodeError(saved.error ? t(saved.error) : t("The order could not be saved. Try again."));
      setSubmitting(false);
      firstFieldRef.current?.focus();
      return;
    }

    let root = "";
    let ledger: LedgerPostResult;
    try {
      root = (await buildProvenanceTree(style)).root;
      ledger = await postLedgerEvent({
        type: "ORDER BOM INGESTION",
        status: "verified",
        styleCode: style.code,
        payloadHash: root,
        summary: `New order ${style.code}: ${style.volume} ${style.title} (${style.garmentType}) for ${style.destination}, fibre ${style.fiberComposition}. Supplier chain copied from ${TEMPLATE.code} (${style.tiers.length} tiers); Merkle root ${shortHash(root)}.`,
      });
    } catch {
      ledger = { ok: false, status: 0, error: t("This browser could not prepare the order record.") };
    }

    setCreated({ code: style.code, root, ledger });
    setSubmitting(false);
  };

  const templateNote =
    TEMPLATE_EXPIRED.length > 0
      ? ` That includes ${TEMPLATE_EXPIRED.map((tier) => `Tier ${tier.tierNumber} (${tier.facilityName}, certificate ${tier.certNumber}, expired)`).join(", ")}, so the new order starts held until it is renewed.`
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop: a real button (pointer only; keyboard users have Escape and the close button). */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/85 backdrop-blur-sm cursor-default"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-headline"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="relative bg-surface/95 border border-brand rounded-[4px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 flex flex-col gap-6 shadow-[0_20px_60px_rgba(17,26,54,0.16)] backdrop-blur-xl text-ink"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="min-w-0">
            <h2 id="new-order-headline" className="font-display text-2xl font-semibold text-ink">
              {t("Add a new order")}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {t("Fill in the order details. The supplier list is copied from order")} {TEMPLATE.code}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 hover:bg-canvas text-ink-muted hover:text-ink border border-[var(--border-hairline)] rounded-[3px] ${focusRing}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {created ? (
          <div className="flex flex-col gap-4 text-sm" aria-live="polite">
            <div className="p-3 rounded-[3px] bg-surface-2 border border-line-strong flex items-start gap-2">
              <Check className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {t("Order")} {created.code} {t("is saved and is now the open order.")}
              </span>
            </div>

            {created.ledger.ok ? (
              <div className="p-3 rounded-[3px] bg-canvas/80 border border-line flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {t("Saved in the ledger as")} {created.ledger.block.id}.
                </span>
              </div>
            ) : (
              <div role="alert" className="p-3 rounded-[3px] bg-danger-soft border border-danger flex items-start gap-2 text-danger">
                <AlertOctagon className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {t("Not saved in the ledger.")} {created.ledger.error}
                </span>
              </div>
            )}

            {(created.root || created.ledger.ok) && (
              <details className="text-xs">
                <summary className={`cursor-pointer min-h-[44px] flex items-center font-semibold text-ink-muted rounded-[3px] ${focusRing}`}>
                  {t("Technical details")}
                </summary>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pt-1">
                  {created.root && (
                    <>
                      <dt className="text-ink-muted">Merkle root</dt>
                      <dd className="font-mono tabular-nums text-ink" title={created.root}>
                        {shortHash(created.root)}
                      </dd>
                    </>
                  )}
                  {created.ledger.ok && (
                    <>
                      <dt className="text-ink-muted">Ledger hash</dt>
                      <dd className="font-mono tabular-nums text-ink" title={created.ledger.block.hash}>
                        {shortHash(created.ledger.block.hash)} ({created.ledger.source} store)
                      </dd>
                    </>
                  )}
                </dl>
              </details>
            )}

            <button type="button" onClick={onClose} className={`btn-primary-action w-full rounded-[4px] ${focusRing}`}>
              <span>
                {t("Open order")} {created.code}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-order-code" className={labelClass}>
                  {t("Order number")}
                </label>
                <input
                  ref={firstFieldRef}
                  id="new-order-code"
                  type="text"
                  value={styleCode}
                  onChange={(e) => {
                    setStyleCode(e.target.value);
                    if (codeError) setCodeError(null);
                  }}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? "new-order-code-error" : undefined}
                  className={`${inputClass} font-mono uppercase ${codeError ? "border-danger" : ""}`}
                />
                {codeError && (
                  <p id="new-order-code-error" className="mt-1 flex items-center gap-1 text-sm text-danger">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{codeError}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new-order-volume" className={labelClass}>
                  {t("Quantity")}
                </label>
                <input
                  id="new-order-volume"
                  type="text"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-order-buyer" className={labelClass}>
                {t("Buyer")}
              </label>
              <select id="new-order-buyer" value={buyerChoice} onChange={(e) => setBuyerOrgId(e.target.value)} className={inputClass}>
                {linkedBuyers.map((p) => (
                  <option key={p.orgId} value={p.orgId}>
                    {p.name.replace(/\s*\(.*\)\s*$/, "")}
                  </option>
                ))}
                <option value="none">{t("No buyer yet")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-order-title" className={labelClass}>
                {t("Garment name")}
              </label>
              <input
                id="new-order-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-order-type" className={labelClass}>
                  {t("Garment type")}
                </label>
                <input
                  id="new-order-type"
                  type="text"
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="new-order-destination" className={labelClass}>
                  {t("Destination port")}
                </label>
                <input
                  id="new-order-destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-order-fibre" className={labelClass}>
                {t("Fibre")}
              </label>
              <input
                id="new-order-fibre"
                type="text"
                value={fiberComposition}
                onChange={(e) => setFiberComposition(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {TEMPLATE_EXPIRED.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-ink-muted">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <span>{t("The new order starts on hold until its expired supplier certificate is renewed.")}</span>
              </p>
            )}

            <details className="text-xs">
              <summary className={`cursor-pointer min-h-[44px] flex items-center font-semibold text-ink-muted rounded-[3px] ${focusRing}`}>
                {t("Technical details")}
              </summary>
              <p className="pt-1 text-ink-muted">
                The new order copies the {TEMPLATE.tiers.length}-tier supplier chain of order {TEMPLATE.code} ({TEMPLATE.title}).
                {templateNote} Its SHA-256 Merkle root is computed in your browser and recorded in the ledger when you are
                signed in to a factory account; the order is saved for both the factory and the buyer.
              </p>
            </details>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`btn-primary-action w-full rounded-[4px] disabled:opacity-60 disabled:cursor-wait ${focusRing}`}
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Check className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{t(submitting ? "Creating order…" : "Create order")}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
