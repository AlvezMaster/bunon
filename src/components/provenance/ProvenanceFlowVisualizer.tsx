"use client";

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SupplyChainTier, TierId } from "@/lib/styles";
import { TIER_LABEL } from "@/lib/labels";
import { t } from "@/lib/i18n";

interface ProvenanceFlowVisualizerProps {
  tiers: SupplyChainTier[];
  selectedNodeId: string;
  onSelectNode: (id: TierId) => void;
}

/**
 * A row of small buttons, one per supplier, from raw material to the garment factory. Each tier's
 * status comes from the order data, not from any demo constant, and is shown by icon and word.
 */
export default function ProvenanceFlowVisualizer({ tiers, selectedNodeId, onSelectNode }: ProvenanceFlowVisualizerProps) {
  const ordered = [...tiers].sort((a, b) => b.tierNumber - a.tierNumber);

  return (
    <ol aria-label={t("Suppliers, from raw material to garment factory")} className="m-0 flex list-none flex-wrap gap-2 p-0">
      {ordered.map((tier) => {
        const isExpired = tier.status === "expired";
        const isSelected = selectedNodeId === tier.id;
        return (
          <li key={tier.id}>
            <button
              type="button"
              onClick={() => onSelectNode(tier.id)}
              aria-pressed={isSelected}
              className={`flex min-h-[44px] items-center gap-2 rounded-[3px] border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                isSelected
                  ? "border-brand bg-brand-soft font-semibold text-brand"
                  : isExpired
                    ? "border-danger text-danger hover:bg-danger-soft"
                    : "border-line text-ink hover:border-line-strong"
              }`}
            >
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              )}
              <span>{t(TIER_LABEL[tier.id])}</span>
              {isExpired ? (
                <span className="text-xs font-semibold text-danger">{t("Expired")}</span>
              ) : (
                <span className="sr-only">({t("Valid")})</span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
