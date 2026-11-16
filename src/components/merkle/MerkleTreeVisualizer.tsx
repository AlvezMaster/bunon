"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronUp, Copy, Loader2, Shield, X } from "lucide-react";
import { auditPathNodeIds, type MerkleNode } from "@/lib/merkle";
import { tierInclusionProof, verifyTierInclusion, type ProvenanceTree, type TierInclusionProof } from "@/lib/provenance";
import { shortHash } from "@/lib/crypto";
import type { SupplyChainTier, TierId } from "@/lib/styles";
import { t } from "@/lib/i18n";

export interface MerkleTreeVisualizerProps {
  /** The style's real SHA-256 provenance tree; null while it is being computed. */
  tree: ProvenanceTree | null;
  /** Current tier records (labels and certificate status). */
  tiers: SupplyChainTier[];
  selectedTierId: string | null;
  onSelectTier: (id: TierId) => void;
}

interface LayoutNode {
  node: MerkleNode;
  /** Inclusive range of leaf columns this node sits above. */
  start: number;
  end: number;
  /** Horizontal centres of the node's distinct children, as % of the node's own span. */
  childCenters: number[];
}

/** Places every node of the real tree on a grid whose columns are the leaves, root on top. */
function buildLayout(prov: ProvenanceTree): { rows: LayoutNode[][]; leafCount: number; byId: Map<string, MerkleNode> } {
  const { nodes, levels } = prov.tree;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const spans = new Map<string, [number, number]>();
  const rowsByLevel: LayoutNode[][] = levels.map(() => []);

  const ordered = [...nodes].sort((a, b) => a.level - b.level || a.index - b.index);
  for (const node of ordered) {
    let span: [number, number];
    let childCenters: number[] = [];
    if (node.level === 0 || !node.left || !node.right) {
      span = [node.index, node.index];
    } else {
      const left = spans.get(node.left) ?? [0, 0];
      const right = spans.get(node.right) ?? left;
      span = [left[0], right[1]];
      const width = span[1] - span[0] + 1;
      const childIds = node.left === node.right ? [node.left] : [node.left, node.right];
      childCenters = childIds.map((id) => {
        const s = spans.get(id) ?? left;
        const center = (s[0] + s[1] + 1) / 2;
        return ((center - span[0]) / width) * 100;
      });
    }
    spans.set(node.id, span);
    rowsByLevel[node.level].push({ node, start: span[0], end: span[1], childCenters });
  }

  // Root level first, leaves last.
  return { rows: [...rowsByLevel].reverse(), leafCount: levels[0].length, byId };
}

function Connector({ childCenters, onPath }: { childCenters: number[]; onPath: boolean }) {
  const line = onPath ? "bg-accent" : "bg-success-soft";
  const border = onPath ? "border-brand" : "border-line-strong";
  if (childCenters.length < 2) {
    return (
      <div className="relative h-3 w-full" aria-hidden="true">
        <span className={`absolute left-1/2 top-0 h-3 w-px ${line}`} />
      </div>
    );
  }
  const [l, r] = childCenters;
  return (
    <div className="relative h-3 w-full" aria-hidden="true">
      <span className={`absolute left-1/2 top-0 h-1.5 w-px ${line}`} />
      <span
        className={`absolute top-1.5 h-1.5 border-x border-t ${border}`}
        style={{ left: `${l}%`, right: `${100 - r}%` }}
      />
    </div>
  );
}

type CopyState = { hash: string; state: "copied" | "failed" } | null;

export default function MerkleTreeVisualizer({ tree, tiers, selectedTierId, onSelectTier }: MerkleTreeVisualizerProps) {
  const tierById = useMemo(() => new Map<string, SupplyChainTier>(tiers.map((tier) => [tier.id, tier])), [tiers]);
  const layout = useMemo(() => (tree ? buildLayout(tree) : null), [tree]);

  const selectedLeafId: TierId | null =
    tree && selectedTierId && (tree.leafOrder as string[]).includes(selectedTierId) ? (selectedTierId as TierId) : null;

  /** Leaf → root node ids of the selected leaf's audit path. */
  const pathIdList = useMemo(
    () => (tree && selectedLeafId ? auditPathNodeIds(tree.tree, selectedLeafId) : []),
    [tree, selectedLeafId]
  );
  const pathIds = useMemo(() => new Set(pathIdList), [pathIdList]);

  const proof: TierInclusionProof | null = useMemo(
    () => (tree && selectedLeafId ? tierInclusionProof(tree, selectedLeafId) : null),
    [tree, selectedLeafId]
  );
  const proofKey = proof ? `${proof.root}:${proof.tierId}:${proof.leafHash}` : "";

  // Recompute the root from the leaf + sibling path (real SHA-256) whenever the selection changes.
  const [verification, setVerification] = useState<{ key: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (!proof) return;
    let cancelled = false;
    const key = `${proof.root}:${proof.tierId}:${proof.leafHash}`;
    verifyTierInclusion(proof)
      .then((ok) => {
        if (!cancelled) setVerification({ key, ok });
      })
      .catch(() => {
        if (!cancelled) setVerification({ key, ok: false });
      });
    return () => {
      cancelled = true;
    };
  }, [proof]);
  const proofVerified: boolean | null = verification && verification.key === proofKey ? verification.ok : null;

  const [copy, setCopy] = useState<CopyState>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  const handleCopy = async (hash: string) => {
    let state: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(hash);
    } catch {
      state = "failed";
    }
    setCopy({ hash, state });
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopy(null), 1800);
  };

  // ---------------------------------------------------------------- loading
  if (!tree || !layout) {
    return (
      <div className="w-full p-4 sm:p-5 space-y-4" role="status" aria-live="polite" aria-busy="true">
        <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Computing SHA-256 Merkle tree…</span>
        </div>
        <div className="space-y-3" aria-hidden="true">
          <div className="mx-auto h-12 w-48 rounded-[4px] bg-surface/70 border border-[var(--border-hairline)]" />
          <div className="grid grid-cols-2 gap-2 px-8">
            <div className="h-6 rounded-[3px] bg-surface/50" />
            <div className="h-6 rounded-[3px] bg-surface/50" />
          </div>
          <div className="grid grid-cols-3 gap-2 px-4">
            <div className="h-6 rounded-[3px] bg-surface/50" />
            <div className="h-6 rounded-[3px] bg-surface/50" />
            <div className="h-6 rounded-[3px] bg-surface/50" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-[76px] rounded-[4px] bg-canvas/70 border border-[var(--border-hairline)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const gridStyle = { gridTemplateColumns: `repeat(${layout.leafCount}, minmax(0, 1fr))` };
  const selectedTier = selectedLeafId ? tierById.get(selectedLeafId) ?? null : null;
  const selectedExpired = selectedLeafId
    ? selectedTier?.status === "expired" || tree.expiredTierIds.includes(selectedLeafId)
    : false;
  const copyState = proof && copy && copy.hash === proof.leafHash ? copy.state : null;

  return (
    <div className="w-full p-4 sm:p-5 space-y-4">
      {/* Tree: root on top, intermediate levels, leaves at the bottom */}
      <div
        className="space-y-0"
        role="group"
        aria-label={`Merkle tree with ${layout.leafCount} leaves and root ${shortHash(tree.root)}`}
      >
        {layout.rows.map((row, rowIdx) => {
          const isLeafRow = rowIdx === layout.rows.length - 1;
          const isRootRow = rowIdx === 0;
          return (
            <div key={`row-${rowIdx}`} className="grid gap-x-2" style={gridStyle}>
              {row.map(({ node, start, end, childCenters }) => {
                const onPath = pathIds.has(node.id);
                const gridColumn = `${start + 1} / ${end + 2}`;

                if (isLeafRow) {
                  const tierId = node.leafId as TierId;
                  const tier = tierById.get(tierId);
                  const expired = tier?.status === "expired" || tree.expiredTierIds.includes(tierId);
                  const isSelected = tierId === selectedLeafId;
                  const label = tier ? `Tier ${tier.tierNumber}` : tierId;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectTier(tierId)}
                      aria-pressed={isSelected}
                      aria-label={`${label} leaf: ${tier?.facilityName ?? tierId}${expired ? ", certificate expired" : ""}. Hash ${shortHash(node.hash)}`}
                      style={{ gridColumn }}
                      className={`min-h-[76px] min-w-0 p-2 rounded-[4px] border text-left flex flex-col gap-1 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        isSelected
                          ? "bg-surface-2/90 border-ink ring-1 ring-ink/30"
                          : expired
                            ? "bg-danger-soft/70 border-danger hover:bg-danger-soft"
                            : "bg-canvas/70 border-[var(--border-hairline)] hover:border-line-strong hover:bg-surface/50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-1 font-mono text-[11px] font-bold text-ink">
                        <span>T{tier?.tierNumber ?? "?"}</span>
                        {onPath && <ChevronUp className="w-3 h-3 text-brand" aria-hidden="true" />}
                      </span>
                      <span className="hidden sm:block">
                        <span className="text-[10px] leading-tight text-ink-muted line-clamp-2">
                          {tier?.facilityName ?? tierId}
                        </span>
                      </span>
                      {expired ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-danger">
                          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Expired</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] text-ink-faint truncate">{shortHash(node.hash, 6, 4)}</span>
                      )}
                    </button>
                  );
                }

                return (
                  <div key={node.id} style={{ gridColumn }} className="min-w-0 flex flex-col items-center">
                    {isRootRow ? (
                      <div
                        className={`max-w-full px-4 py-2 rounded-[4px] border flex items-center gap-2.5 bg-surface/80 backdrop-blur-md shadow-[0_4px_16px_rgba(42,58,143,0.15)] ${
                          onPath ? "border-brand" : "border-brand/60"
                        }`}
                      >
                        <Shield className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-ink-muted font-bold">{t("Merkle root")}</div>
                          <div className="font-mono text-xs font-bold text-ink truncate tabular-nums">
                            {shortHash(node.hash, 12, 6)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-full px-1.5 py-1 rounded-[3px] border font-mono text-[10px] flex items-center gap-0.5 overflow-hidden ${
                          onPath
                            ? "border-brand bg-surface-2 text-ink font-bold"
                            : "border-[var(--border-hairline)] bg-canvas/70 text-ink-muted"
                        }`}
                      >
                        {onPath && <ChevronUp className="w-3 h-3 shrink-0 text-brand" aria-hidden="true" />}
                        <span className="truncate">{shortHash(node.hash, 6, 4)}</span>
                      </div>
                    )}
                    <Connector childCenters={childCenters} onPath={onPath} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-faint">
        <span className="flex items-center gap-1">
          <ChevronUp className="w-3 h-3 text-brand" aria-hidden="true" />
          Audit path of the selected leaf
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-danger" aria-hidden="true" />
          Expired certificate
        </span>
        <span>Odd nodes are paired with themselves.</span>
      </div>

      {/* Selected leaf: inclusion proof */}
      {proof && selectedTier ? (
        <div className="p-3 rounded-[4px] bg-canvas/85 border border-[var(--border-hairline)] space-y-3 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-ink-faint">
                Selected leaf · Tier {selectedTier.tierNumber}
              </div>
              <div className="font-bold text-ink">{selectedTier.facilityName}</div>
              <div className="text-[11px] text-ink-muted">
                {selectedTier.certType} · <span className="font-mono">{selectedTier.certNumber}</span>
              </div>
            </div>
            {selectedExpired ? (
              <span className="px-2 py-0.5 rounded-[3px] border border-danger bg-danger-soft text-danger text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                Certificate expired
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-[3px] border border-line-strong bg-surface text-ink-muted text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" aria-hidden="true" />
                Certificate on file
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] text-ink-faint mb-0.5">Leaf hash (SHA-256)</div>
              <div className="font-mono text-[11px] text-ink break-all tabular-nums">{proof.leafHash}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(proof.leafHash)}
              aria-label={t("Copy full leaf hash")}
              className="btn-tactile-hollow min-h-[44px] px-3 text-[11px] flex items-center gap-1.5 shrink-0"
            >
              {copyState === "copied" ? (
                <Check className="w-3 h-3 text-ink-muted" aria-hidden="true" />
              ) : copyState === "failed" ? (
                <X className="w-3 h-3 text-danger" aria-hidden="true" />
              ) : (
                <Copy className="w-3 h-3" aria-hidden="true" />
              )}
              <span aria-live="polite">{copyState === "copied" ? t("Copied") : copyState === "failed" ? t("Copy failed") : t("Copy")}</span>
            </button>
          </div>

          <div>
            <div className="text-[10px] text-ink-faint mb-1">
              Inclusion proof · {proof.proof.length} step{proof.proof.length === 1 ? "" : "s"}
            </div>
            <ol className="space-y-1">
              {proof.proof.map((step, i) => {
                const parentId = pathIdList[i + 1];
                const parentHash = parentId ? layout.byId.get(parentId)?.hash : undefined;
                const sameAsRunning = step.hash === layout.byId.get(pathIdList[i] ?? "")?.hash;
                return (
                  <li key={`${proof.tierId}-step-${i}`} className="text-[11px] text-ink-muted leading-relaxed">
                    <span className="text-ink-faint">{i + 1}.</span>{" "}
                    {step.position === "left" ? "sibling on the left" : "sibling on the right"}{" "}
                    <span className="font-mono text-ink tabular-nums">{shortHash(step.hash, 8, 4)}</span>
                    {sameAsRunning && <span className="text-ink-faint"> (self-paired)</span>}
                    {parentHash && (
                      <>
                        {" "}→ <span className="font-mono text-ink tabular-nums">{shortHash(parentHash, 8, 4)}</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            className="pt-2 border-t border-[var(--border-hairline)] flex items-center gap-2 text-[11px]"
            role="status"
            aria-live="polite"
          >
            {proofVerified === null ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" aria-hidden="true" />
                <span className="text-ink-muted">Recomputing root from leaf and proof…</span>
              </>
            ) : proofVerified ? (
              <>
                <Check className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                <span className="text-ink-muted">
                  <strong className="text-ink">Proof valid</strong> · recomputed root matches {shortHash(proof.root)}
                </span>
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 text-danger" aria-hidden="true" />
                <span className="text-danger">
                  <strong>Proof invalid</strong> · recomputed root does not match {shortHash(proof.root)}
                </span>
              </>
            )}
          </div>
          {selectedExpired && proofVerified && (
            <p className="text-[10px] text-ink-faint">
              Inclusion only proves this certificate record is part of the sealed tree; the certificate itself has expired.
            </p>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-[4px] bg-canvas/85 border border-[var(--border-hairline)] text-xs text-ink-muted">
          Select a leaf to inspect its inclusion proof.
        </div>
      )}
    </div>
  );
}
