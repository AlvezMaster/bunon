"use client";

import { useEffect, useState } from "react";
import { buildProvenanceTree, type ProvenanceTree } from "./provenance.ts";
import type { StyleData } from "./styles.ts";

/**
 * Builds the style's real SHA-256 Merkle tree in the browser (Web Crypto) and rebuilds it whenever
 * the tier facts change, e.g. after a certificate renewal. Returns null while computing.
 */
export function useProvenanceTree(style: StyleData | null): ProvenanceTree | null {
  const [tree, setTree] = useState<ProvenanceTree | null>(null);
  const key = style ? `${style.code}:${JSON.stringify(style.tiers)}` : "";

  useEffect(() => {
    let cancelled = false;
    if (!style) {
      setTree(null);
      return;
    }
    buildProvenanceTree(style)
      .then((t) => {
        if (!cancelled) setTree(t);
      })
      .catch((err) => console.error("[bunon/provenance] tree build failed:", err));
    return () => {
      cancelled = true;
    };
    // `key` captures every fact that feeds the tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return tree;
}
