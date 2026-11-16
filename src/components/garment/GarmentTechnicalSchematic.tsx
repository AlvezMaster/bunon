"use client";

import React from "react";
import { motion } from "framer-motion";
import type { StyleData } from "@/lib/styles";

export type GarmentAnchorId = "fiber-composition" | "chemical-safety" | "repairability-index";

export interface GarmentAnchor {
  id: GarmentAnchorId;
  number: string;
  category: string;
  title: string;
  value: string;
  standard: string;
  xPercent: number; // For blueprint pin placement
  yPercent: number;
}

/** Builds the three hotspot anchors from the style's own passport data (no hardcoded garment text). */
export function buildSchematicAnchors(style: StyleData): GarmentAnchor[] {
  return [
    {
      id: "fiber-composition",
      number: "01",
      category: "FIBRE COMPOSITION & ORIGIN",
      title: style.fiberComposition,
      value: style.specifications.materials,
      standard: style.fiberStandard,
      xPercent: 32,
      yPercent: 35,
    },
    {
      id: "chemical-safety",
      number: "02",
      category: "DYEING & CHEMICAL SAFETY",
      title: style.chemicalSafety,
      value: style.specifications.dyeing,
      standard: style.chemicalStandard,
      xPercent: 68,
      yPercent: 48,
    },
    {
      id: "repairability-index",
      number: "03",
      category: "CIRCULARITY & REPAIRABILITY",
      title: `Repairability ${style.repairabilityScore}`,
      value: style.specifications.circularity,
      standard: style.repairabilityGrade,
      xPercent: 50,
      yPercent: 78,
    },
  ];
}

export default function GarmentTechnicalSchematic({
  style,
  activeAnchorId,
  onSelectAnchor,
}: {
  style: StyleData;
  activeAnchorId: string | null;
  onSelectAnchor: (id: GarmentAnchorId) => void;
}) {
  const anchors = buildSchematicAnchors(style);
  const currentAnchor = anchors.find((a) => a.id === activeAnchorId) ?? anchors[0];

  return (
    <div className="w-full h-full min-h-[380px] p-5 flex flex-col justify-between font-mono relative select-none bg-canvas/60 rounded-[4px] backdrop-blur-md">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
        <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
          CAD blueprint · specification schematic
        </span>
        <span className="text-[10px] text-brand bg-surface px-2 py-0.5 rounded-[3px] border border-[var(--border-hairline)] uppercase">
          {style.garmentType}
        </span>
      </div>

      {/* Center Garment Technical Illustration with Interactive Pins */}
      <div className="relative my-6 flex items-center justify-center min-h-[220px]">
        {/* Generic upper-body garment silhouette */}
        <svg
          viewBox="0 0 400 320"
          aria-hidden="true"
          className="w-full max-w-[340px] h-auto text-success/50 stroke-current fill-none stroke-[1.5]"
        >
          {/* Collar */}
          <path d="M 160 50 L 200 80 L 240 50 L 215 40 L 185 40 Z" fill="#FFFFFF" fillOpacity="0.4" />

          {/* Main Body */}
          <path d="M 150 50 L 120 70 L 60 120 L 80 160 L 120 130 L 120 280 L 280 280 L 280 130 L 320 160 L 340 120 L 280 70 L 250 50 Z" />

          {/* Center Placket & Seams */}
          <line x1="200" y1="80" x2="200" y2="280" strokeDasharray="4 2" stroke="#157A3B" strokeOpacity="0.6" />

          {/* Pockets */}
          <rect x="140" y="110" width="36" height="42" rx="4" />
          <rect x="224" y="110" width="36" height="42" rx="4" />

          {/* Waistband */}
          <line x1="120" y1="260" x2="280" y2="260" stroke="#BCC4D3" />
        </svg>

        {/* Hotspot pins: 44px hit target around a 28px visual dot */}
        {anchors.map((anchor) => {
          const isActive = anchor.id === currentAnchor.id;

          return (
            <motion.button
              key={anchor.id}
              type="button"
              onClick={() => onSelectAnchor(anchor.id)}
              aria-pressed={isActive}
              aria-label={`${anchor.number}: ${anchor.category.toLowerCase()} (${anchor.title})`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                top: `${anchor.yPercent}%`,
                left: `${anchor.xPercent}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full cursor-pointer flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span
                className={`w-7 h-7 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
                  isActive
                    ? "bg-accent text-white ring-4 ring-brand/30"
                    : "bg-surface text-ink border border-[var(--border-hairline)] hover:border-ink"
                }`}
              >
                {anchor.number}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Active Anchor HUD Card */}
      <div
        className="p-3.5 rounded-[4px] bg-surface/90 border border-[var(--border-hairline)] space-y-1 backdrop-blur-md"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3 text-[10px]">
          <span className="text-ink-muted font-bold uppercase">{currentAnchor.category}</span>
          <span className="text-brand font-bold text-right">{currentAnchor.standard}</span>
        </div>
        <div className="text-xs font-bold text-ink font-display">{currentAnchor.title}</div>
        <p className="text-[11px] text-ink-muted font-sans">{currentAnchor.value}</p>
      </div>
    </div>
  );
}
