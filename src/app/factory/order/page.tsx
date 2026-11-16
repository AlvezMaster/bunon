"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { StatusBadge } from "@/components/dashboard/DashboardParts";
import NodeInspectorDrawer from "@/components/NodeInspectorDrawer";
import DocumentIngestionEngine from "@/components/DocumentIngestionEngine";
import NewOrderModal from "@/components/NewOrderModal";
import ProvenanceFlowVisualizer from "@/components/provenance/ProvenanceFlowVisualizer";
import { useBunonStore } from "@/lib/store";
import { isOwnOrder, DEFAULT_STYLE_CODE, getStyleData, listStyles, STYLES_CATALOG, styleClearance, type TierId } from "@/lib/styles";
import { useProvenanceTree } from "@/lib/use-provenance";
import { formatIsoDate } from "@/lib/certificate-registry";
import { ArrowRight, RotateCcw, Plus, ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function SupplierDashboardPage() {
  const activeSupplierStyleId = useBunonStore((s) => s.activeSupplierStyleId);
  const setActiveSupplierStyleId = useBunonStore((s) => s.setActiveSupplierStyleId);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const resetStyleCompliance = useBunonStore((s) => s.resetStyleCompliance);
  const activeNodeId = useBunonStore((s) => s.activeNodeId);
  const setActiveNodeId = useBunonStore((s) => s.setActiveNodeId);
  const session = useBunonStore((s) => s.session);
  const sessionChecked = useBunonStore((s) => s.sessionChecked);

  const [ingestionTierId, setIngestionTierId] = useState<TierId | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const allStyles = useMemo(
    () => listStyles(customStyles, renewals).filter((s) => !session || isOwnOrder(s, session.organization)),
    [customStyles, renewals, session]
  );
  // Active order with any ingested renewals applied. A code that is unknown, or belongs to another
  // factory, falls back to this factory's first order (then to DN-2026).
  const style = useMemo(
    () =>
      allStyles.find((s) => s.code === activeSupplierStyleId) ??
      allStyles[0] ??
      getStyleData(DEFAULT_STYLE_CODE, customStyles, renewals) ??
      STYLES_CATALOG[DEFAULT_STYLE_CODE],
    [activeSupplierStyleId, allStyles, customStyles, renewals]
  );

  // Deep links from the dashboard: ?fix=<tierId> opens the upload panel for that certificate,
  // ?new=1 opens the new-order form. The query is cleared so a refresh does not reopen them.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fix = params.get("fix");
    const wantsNew = params.get("new") === "1";
    if (!fix && !wantsNew) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (fix) {
      setActiveNodeId(fix as TierId);
      setIngestionTierId(fix as TierId);
    } else {
      setShowNewOrderModal(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearance = styleClearance(style);
  const expiredTiers = clearance.expiredTiers;
  const firstExpired = expiredTiers[0] ?? null;
  const isConflict = !clearance.cleared;
  const hasRenewals = Object.keys(renewals[style.code] ?? {}).length > 0;

  const tree = useProvenanceTree(style);
  const treeForStyle = tree && tree.styleCode === style.code ? tree : null;

  const selectedTier = style.tiers.find((t) => t.id === activeNodeId) ?? firstExpired ?? style.tiers[0];
  const ingestionTier = ingestionTierId ? (style.tiers.find((t) => t.id === ingestionTierId) ?? null) : null;
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col gap-12 pt-10">
        <Link href="/factory/orders" className="-mb-8 inline-flex min-h-[44px] w-fit items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("All orders")}
        </Link>

        {/* Stable title: which order this is, then its status, one line of context and the one action */}
        <section className="flex max-w-4xl flex-col gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm tabular-nums text-ink-muted">#{style.code}</span>
              <StatusBadge tone={isConflict ? "bad" : "ok"}>{isConflict ? "On hold" : "Ready"}</StatusBadge>
              <DemoDataBadge />
            </div>
            <h1 className="display-title text-ink">{style.title}</h1>
            <p className="max-w-[60ch] text-base leading-relaxed text-ink-muted">
              {style.buyer} · {style.volume}
            </p>
            {isConflict && firstExpired ? (
              <p className="max-w-[60ch] text-base leading-relaxed text-ink">
                <strong>{t(expiredTiers.length > 1 ? "Supplier certificates expired." : "Supplier certificate expired.")}</strong>{" "}
                {firstExpired.facilityName} · {t("current certificate expired")}{" "}
                <span className="font-mono tabular-nums">{formatIsoDate(firstExpired.validThrough)}</span>
                {expiredTiers.length > 1 ? ` (+${expiredTiers.length - 1} ${t("more")})` : ""}.{" "}
                {t("The buyer cannot confirm this order until a valid certificate is on file.")}
              </p>
            ) : (
              <p className="max-w-[60ch] text-base leading-relaxed text-ink">
                <strong>{t("Every supplier certificate is in date.")}</strong> {t("Nothing on file is holding this order.")}
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {isConflict && firstExpired ? (
              <button
                type="button"
                onClick={() => setIngestionTierId(firstExpired.id)}
                className={`btn-primary-action rounded-[4px] ${focusRing}`}
              >
                <span>{t("Upload the renewed certificate")}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <Link href={`/passport/${style.code}`} className={`btn-primary-action rounded-[4px] ${focusRing}`}>
                <span>{t("View product report")}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            {!isConflict && hasRenewals && (
              <button
                type="button"
                onClick={() => resetStyleCompliance(style.code)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-[3px] px-2 text-sm text-ink-muted hover:text-ink hover:underline ${focusRing}`}
              >
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {t("Reset demo renewals")} <span className="text-xs">({t("The ledger keeps its history")})</span>
                </span>
              </button>
            )}
          </div>

          {sessionChecked && !session && (
            <p className="text-sm text-ink-muted">
              {t("Not signed in: saving to the ledger needs a")}{" "}
              <Link href="/login" className={`rounded-[4px] text-brand underline ${focusRing}`}>
                {t("factory sign-in")}
              </Link>
            </p>
          )}
        </section>

        {/* All suppliers, folded away so the page leads with the one action that matters */}
        <details className="glass-card p-4 sm:p-5">
          <summary className={`flex min-h-[44px] cursor-pointer items-center rounded-[3px] text-sm font-semibold text-ink ${focusRing}`}>
            {t("All suppliers for this order")} ({style.tiers.length})
          </summary>
          <div className="flex flex-col gap-4 pt-4">
            <ProvenanceFlowVisualizer
              tiers={style.tiers}
              selectedNodeId={selectedTier.id}
              onSelectNode={(nodeId) => {
                setActiveNodeId(nodeId);
                setIsInspectorOpen(true);
              }}
            />
            <NodeInspectorDrawer
              key={`${style.code}:${selectedTier.id}`}
              styleCode={style.code}
              tier={selectedTier}
              leafHash={treeForStyle?.leafHashes[selectedTier.id] ?? null}
              isOpen={isInspectorOpen}
              onClose={() => setIsInspectorOpen(false)}
              onUploadRenewal={(tier) => setIngestionTierId(tier.id)}
            />
          </div>
        </details>
      </main>

      {/* DOCUMENT INTAKE & VERIFICATION ENGINE */}
      {ingestionTier && (
        <DocumentIngestionEngine
          isOpen
          onClose={() => setIngestionTierId(null)}
          styleCode={style.code}
          tier={ingestionTier}
        />
      )}

      {/* NEW ORDER / BOM MODAL */}
      {showNewOrderModal && <NewOrderModal isOpen onClose={() => setShowNewOrderModal(false)} />}
    </div>
  );
}
