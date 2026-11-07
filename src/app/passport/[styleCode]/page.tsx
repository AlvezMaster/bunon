"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ArrowLeft,
  ExternalLink,
  Leaf,
  Sparkles,
  Factory,
  Anchor,
  Truck,
  Droplets,
  Scale,
  QrCode,
  FileText,
  Lock,
  Globe,
  Share2,
  Layers,
  Award,
  BadgeCheck,
  Shirt,
  Scissors,
  Wrench,
  Thermometer,
  RotateCcw,
  Hash,
  Database
} from "lucide-react";

export default function DigitalProductPassportPage() {
  const params = useParams();
  const rawStyleCode = params?.styleCode as string | undefined;
  const styleCode = rawStyleCode ? decodeURIComponent(rawStyleCode).toUpperCase() : "DN-2026";

  const [activeTab, setActiveTab] = useState<"materials" | "durability" | "traceability">("materials");
  const [copiedHash, setCopiedHash] = useState(false);
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);

  const merkleRoot = "0x7f4b82a10c9e21df904321bcde45aa81938b";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(merkleRoot);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-x-hidden antialiased">
      {/* Background radial gradients for subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Section 1: Top Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all active:scale-[0.97] shadow-sm backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Bunon</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EU ESPR / CIRPASS Conforming DPP</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-medium transition-all active:scale-[0.97] shadow-sm hover:border-slate-600"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs transition-all active:scale-[0.97]"
              title="Share / Copy Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Section 2: Hero Garment Header Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/80 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
            <QrCode className="w-56 h-56 text-white" />
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold tracking-wider uppercase">
                STYLE: {styleCode}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium">
                Season: Spring / Summer 2026
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                Live Customs Passport
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-display">
                Mens Relaxed Fit Organic Denim Jacket
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Registered under European Union Eco-design for Sustainable Products Regulation (ESPR Directive 2024/1781) & CIRPASS Digital Product Passport standard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tier-1 Manufacturer
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Ashulia Export Apparel Ltd, Dhaka, Bangladesh
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  BGMEA License: <span className="text-slate-300">BGMEA-REG-84210</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Consignee / Target Brand
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Inditex / H&M Group European Distribution
                </div>
                <div className="text-xs text-slate-400">
                  EORI Verified: <span className="text-slate-300 font-mono">NL824102941B01</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Trust Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Cryptographically Reconciled & GOTS Registry Verified
                  </div>
                  <div className="text-[11px] text-slate-400">
                    All supply chain tiers anchored on zero-knowledge cryptographic state.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
                <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="font-mono text-[11px] text-slate-400 truncate max-w-[210px] sm:max-w-[280px]">
                  {merkleRoot}
                </div>
                <button
                  onClick={handleCopyHash}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-all active:scale-[0.97]"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Tabbed Exploration */}
        <section className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("materials")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                activeTab === "materials"
                  ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Leaf className="w-4 h-4" />
              <span>Material & ESG</span>
            </button>
            <button
              onClick={() => setActiveTab("durability")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                activeTab === "durability"
                  ? "bg-slate-800 text-cyan-400 shadow-md border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Durability & Care</span>
            </button>
            <button
              onClick={() => setActiveTab("traceability")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                activeTab === "traceability"
                  ? "bg-slate-800 text-indigo-400 shadow-md border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Traceability Journey</span>
            </button>
          </div>

          {/* TAB 1: Material Composition & Sustainability */}
          {activeTab === "materials" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
              {/* Circular Breakdown & Fibers */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-emerald-400" />
                    Fiber Composition
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Mono-Material Shell
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200">GOTS Certified Organic Cotton (Shell)</span>
                      <span className="text-emerald-400 font-mono font-bold">100.0%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-full" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Rain-fed organic cultivation in Rangpur region. Zero synthetic GMO seeds or organophosphate pesticides.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200">Recycled Zinc Alloy (YKK Fasteners & Rivets)</span>
                      <span className="text-cyan-400 font-mono font-bold">85.4%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full w-[85.4%]" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Global Recycled Standard (GRS) v4.0 certified post-industrial recycled metal.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200">Zero Hazardous Discharge (ZDHC MRSL Level 3)</span>
                      <span className="text-emerald-400 font-mono font-bold">0% Detected</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-emerald-500 rounded-full w-0" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Clean chemistry batch testing via OEKO-TEX Standard 100 Class I (safe for sensitive skin).
                    </p>
                  </div>
                </div>
              </div>

              {/* Carbon & Environmental Impact */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      LCA Carbon & Water Footprint
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">ISO 14067 LCA</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Cradle-to-Gate Carbon Equivalent
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-emerald-400 font-mono">4.8</span>
                      <span className="text-sm font-medium text-slate-300">kg CO2e / garment</span>
                    </div>
                    <div className="mt-2 text-xs text-emerald-400/90 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      42% below conventional denim industry average (8.3 kg CO2e)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">Water Consumption</div>
                      <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">380 Liters</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">-74% vs Conventional</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">Renewable Energy Ratio</div>
                      <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">68.2% Solar</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Rooftop Solar PV Microgrid</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300/90 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified against Higg FEM (Facility Environmental Module) 2025 verified audit score: 94.6/100.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Physical Durability & Care */}
          {activeTab === "durability" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-300">
              {/* Metric 1 */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Tensile Tear Strength</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">42.0 N</div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">ISO 13937-2 Certified</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Heavy-duty ring-spun warp and weft warp withstands up to 42 Newtons of tear force, engineered for 10+ years of active wear.
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Colorfastness to Washing</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">Grade 4-5</div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">ISO 105-C06 Standard</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-exhaustion natural indigo dyeing ensures maximum shade retention without dye bleeding into domestic wash cycles.
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Repairability Index</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">8.4 / 10</div>
                  <div className="text-xs text-indigo-400 font-semibold mt-1">French AGEC Law Standard</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Standardized copper-shank rivet hardware can be disassembled using standard hand tools. Free replacement buttons available via brand portal.
                </p>
              </div>

              {/* Care Instructions & End of Life */}
              <div className="md:col-span-3 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-cyan-400" />
                    Recommended Consumer Care Guidelines
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span><strong>Wash Cold (30°C / 85°F):</strong> Wash inside-out with similar dark colors to preserve natural indigo patina.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span><strong>Line Dry Only:</strong> Avoid tumble drying; hang dry in shaded airflow to retain cotton fiber tensile strength.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span><strong>Spot Clean & Freeze:</strong> Only wash when soiled. Spot cleaning prolongs garment lifespan significantly.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    Circular End-of-Life Instructions
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This denim jacket is 98.5% mono-material cellulose. When no longer wearable, return to any EU brand partner drop-point for mechanical fiber recycling or deposit in designated municipal textile recycling streams.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                    Recycling Category: Category 6203 / Pure Cotton Fabric Scrap
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Traceability Journey (Farm to Port) */}
          {activeTab === "traceability" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Verifiable Farm-to-Port Custody Chain
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cryptographic chain-of-custody recorded at each transformation node.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                  <span>6 of 6 Verified Epochs</span>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-indigo-500">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Step 1 • Raw Cotton Cultivation</span>
                      <span className="text-[11px] font-mono text-slate-500">Epoch: 2025-Q3</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">Rangpur Organic Farmer Collective</div>
                    <div className="text-xs text-slate-400">Rangpur Division, Northern Bangladesh</div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                        <Award className="w-3 h-3" /> GOTS-AG-7102
                      </span>
                      <span className="text-[11px] text-slate-400">Certified Organic Raw Fiber</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Step 2 • Ring Spinning & Combing</span>
                      <span className="text-[11px] font-mono text-slate-500">Epoch: 2025-Q4</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">Apex Spinning Mills Ltd</div>
                    <div className="text-xs text-slate-400">Narayanganj Industrial Zone, Dhaka</div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                        <Award className="w-3 h-3" /> GOTS-BD-9104
                      </span>
                      <span className="text-[11px] text-slate-400">Ne 16/1 Ring-Spun Organic Yarn</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Step 3 • Clean Indigo Dyeing & Weaving</span>
                      <span className="text-[11px] font-mono text-slate-500">Epoch: 2026-01</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">Dhaka Eco-Tex Dyeing Ltd</div>
                    <div className="text-xs text-slate-400">Gazipur Eco-Industrial Cluster</div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-[11px] font-mono border border-cyan-500/20">
                        <Award className="w-3 h-3" /> OEKO-26-90412
                      </span>
                      <span className="text-[11px] text-slate-400">ZDHC Level 3 Certified Zero Discharge</span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Step 4 • Trims & Hardware Forging</span>
                      <span className="text-[11px] font-mono text-slate-500">Epoch: 2026-01</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">YKK Trim Division Bangladesh</div>
                    <div className="text-xs text-slate-400">Savar Export Processing Zone (DEPZ)</div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-[11px] font-mono border border-cyan-500/20">
                        <Award className="w-3 h-3" /> GRS-TR-4410
                      </span>
                      <span className="text-[11px] text-slate-400">85.4% Recycled Zinc Alloy Zipper & Rivets</span>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-indigo-400 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step 5 • Cut, Make & Trim (Garment Assembly)</span>
                      <span className="text-[11px] font-mono text-slate-500">Epoch: 2026-02</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">Ashulia Export Apparel Ltd</div>
                    <div className="text-xs text-slate-400">Ashulia, Dhaka, Bangladesh</div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[11px] font-mono border border-indigo-500/20">
                        <Award className="w-3 h-3" /> BSCI 98.4 (A-Grade)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                        LEED Platinum Factory
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-indigo-400 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step 6 • Port of Entry Clearance</span>
                      <span className="text-[11px] font-mono text-slate-500">Epoch: 2026-03</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-100">Port of Rotterdam (ECT Delta Terminal)</div>
                    <div className="text-xs text-slate-400">Rotterdam, The Netherlands (EU Single Market Entry)</div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Customs DPP Cleared
                      </span>
                      <span className="text-[11px] text-slate-400">TARIC: 6203.32.9000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Cryptographic Proof Drawer / Footer */}
        <section className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cloudflare R2 Immutable Vault Proofs
                </h3>
                <p className="text-xs text-slate-400">
                  Raw cryptographically signed audit certificates and zero-knowledge batch proofs.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-500">
              SHA-256 Content-Addressed
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                title: "GOTS v7.0 Scope Certificate",
                issuer: "Control Union Inspections B.V.",
                hash: "0x8fa10b99c2...41a3",
                fullHash: "0x8fa10b99c2419401bfec2718903e127641a3998b",
                date: "2025-11-14 09:24 UTC",
                certNo: "PRJ 842109/01"
              },
              {
                title: "OEKO-TEX ECO PASSPORT Test",
                issuer: "Hohenstein Institute Germany",
                hash: "0x44dc18ae77...912f",
                fullHash: "0x44dc18ae772183cbafe190104192bca9912f4510",
                date: "2026-01-08 14:12 UTC",
                certNo: "26.0.90412"
              },
              {
                title: "LEED Platinum Energy Audit",
                issuer: "U.S. Green Building Council (USGBC)",
                hash: "0x91ef380bca...8812",
                fullHash: "0x91ef380bca2931048bc82103847aa1828812cc93",
                date: "2025-12-20 18:30 UTC",
                certNo: "LEED-BD-2025-99"
              }
            ].map((proof, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{proof.title}</span>
                    <Lock className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[11px] text-slate-400">{proof.issuer}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ref: {proof.certNo}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-indigo-400 truncate max-w-[140px]" title={proof.fullHash}>
                    {proof.hash}
                  </div>
                  <a
                    href={`https://r2.bunon.io/vault/${proof.certNo.replace(/\s+/g, "_")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white font-medium hover:underline"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              Bunon Trust Layer v2.4 • Connected to EU DPP Registry Gateway • Node: <span className="font-mono text-slate-400">eu-central-dpp-node-04</span>
            </div>
            <div>
              Latest Consensus Sync: <span className="font-mono text-slate-400">2026-03-15 04:12:09 UTC</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
