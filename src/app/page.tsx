"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  QrCode,
  ExternalLink,
  Cpu,
  Layers,
  Database,
  RefreshCw,
  Sparkles,
  Lock,
  ChevronRight,
  FileCheck,
  Download,
  Share2,
  Info,
  X,
  Smartphone,
  Eye,
  Check
} from "lucide-react";

type Stage = "initial" | "analyzing" | "conflict" | "resolving" | "verified";

interface SupplyNode {
  id: string;
  name: string;
  tier: string;
  certType: string;
  certNo: string;
  status: "verified" | "conflict" | "pending";
  x: number;
  y: number;
  details: string;
}

export default function BunonPage() {
  const [stage, setStage] = useState<Stage>("conflict");
  const [activeTab, setActiveTab] = useState<"questionnaire" | "passport" | "graph">("graph");
  const [selectedNode, setSelectedNode] = useState<SupplyNode | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [chaseSent, setChaseSent] = useState(false);
  const [portalMode, setPortalMode] = useState<"merchandiser" | "buyer">("merchandiser");

  // Supply Chain Graph Nodes
  const [nodes, setNodes] = useState<SupplyNode[]>([
    {
      id: "t4-cotton",
      name: "Rangpur Organic Farm",
      tier: "Tier 4: Raw Material",
      certType: "GOTS Raw",
      certNo: "GOTS-AG-7102",
      status: "verified",
      x: 60,
      y: 90,
      details: "100% Rain-fed organic cotton. Harvest batch verified via GOTS global registry."
    },
    {
      id: "t3-yarn",
      name: "Apex Spinning Mills",
      tier: "Tier 3: Yarn Spinning",
      certType: "GOTS Yarn Scope",
      certNo: "GOTS-BD-8492",
      status: "conflict", // The hero conflict!
      x: 180,
      y: 50,
      details: "Scope certificate #GOTS-BD-8492 EXPIRED on July 14, 2026. Conflict with PO requirement."
    },
    {
      id: "t2-dyeing",
      name: "Dhaka Eco-Tex Dyeing",
      tier: "Tier 2: Dyeing & Finishing",
      certType: "OEKO-TEX Std 100",
      certNo: "OEKO-26-90412",
      status: "verified",
      x: 300,
      y: 110,
      details: "Zero discharge of hazardous chemicals (ZDHC Level 3 compliance confirmed)."
    },
    {
      id: "t1-trims",
      name: "YKK Dhaka Trim Division",
      tier: "Tier 1: Trims & Accessories",
      certType: "GRS Recycled Zinc",
      certNo: "GRS-TR-4410",
      status: "pending",
      x: 410,
      y: 60,
      details: "Recycled metal content documentation extracted from PDF; awaiting registry ping."
    },
    {
      id: "t0-factory",
      name: "Ashulia Export Apparel Ltd",
      tier: "Tier 0: Garment Assembly",
      certType: "BSCI / WRAP A-Grade",
      certNo: "WRAP-BD-99120",
      status: "verified",
      x: 520,
      y: 130,
      details: "LEED Platinum Certified Export Facility. 4,200 unionized workers, digital wage audit clean."
    },
    {
      id: "buyer-port",
      name: "Inditex / H&M (Rotterdam)",
      tier: "Buyer Gateway",
      certType: "EU ESPR / DPP Spec",
      certNo: "EU-DPP-2026-X",
      status: "verified",
      x: 630,
      y: 80,
      details: "Destination port customs compliance gateway for Spring/Summer 2027 collection."
    }
  ]);

  // Handle Resolving the Conflict
  const handleResolveConflict = () => {
    setStage("resolving");
    setTimeout(() => {
      // Update the node from conflict to verified
      setNodes((prev) =>
        prev.map((n) =>
          n.id === "t3-yarn"
            ? {
                ...n,
                status: "verified",
                certNo: "GOTS-BD-9104",
                details: "Updated valid Scope Certificate #GOTS-BD-9104 received via WhatsApp. Valid through Nov 2027."
              }
            : n.id === "t1-trims"
            ? { ...n, status: "verified" }
            : n
        )
      );
      setStage("verified");
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 1800);
  };

  const handleTriggerChase = () => {
    setChaseSent(true);
  };

  return (
    <div className="min-h-screen bg-[#090c15] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Ambient Light Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[320px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="fixed top-32 right-1/4 w-[450px] h-[250px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* 1. Global Navigation & On-Prem Sovereign Status */}
      <header className="sticky top-0 z-40 border-b border-white/8 glass-panel px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <span className="text-xl font-bold tracking-tighter text-white">ব</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight-display text-white">
                Bunon <span className="font-normal text-slate-400 text-sm">(বুনন)</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                v1.2.0 • On-Prem
              </span>
            </div>
            <p className="text-xs text-slate-400">
              On-Premises Compliance Shield & DPP Forge • Ashulia Export Cluster
            </p>
          </div>
        </div>

        {/* Center: Live Architecture Telemetry Pills */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Apple M2 • Bunon-1B (16-bit FP16)</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vault: Cloudflare R2 (SHA-256)</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Trust Tunnel: Active</span>
          </div>
        </div>

        {/* Right View Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 p-1 rounded-xl border border-white/10 flex items-center text-xs">
            <button
              onClick={() => setPortalMode("merchandiser")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                portalMode === "merchandiser"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Merchandiser Portal
            </button>
            <button
              onClick={() => setPortalMode("buyer")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                portalMode === "buyer"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EU Buyer Terminal
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6 relative z-10">
        
        {/* Style Banner / Breadcrumb */}
        <div className="glass-card rounded-2xl p-4 lg:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-indigo-400 font-mono text-sm font-semibold">
              #DN26
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Target Style Production
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">PO #HM-EU-89241</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight-display text-white">
                Mens Relaxed Fit Organic Denim Jacket
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Buyer: <strong className="text-slate-200">Inditex / H&M Group</strong> • Destination:{" "}
                <strong className="text-slate-200">Rotterdam Distribution Hub</strong> • 24,000 Pcs
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/8 text-center min-w-[90px]">
              <span className="text-[10px] uppercase text-slate-400 block font-mono">BOM Items</span>
              <span className="text-base font-bold text-white">38</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/8 text-center min-w-[90px]">
              <span className="text-[10px] uppercase text-slate-400 block font-mono">Certs Audited</span>
              <span className="text-base font-bold text-white">14</span>
            </div>
            <div className={`px-3.5 py-2 rounded-xl border text-center min-w-[120px] transition-colors ${
              stage === "verified"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              <span className="text-[10px] uppercase block font-mono">Verification</span>
              <span className="text-sm font-bold flex items-center justify-center gap-1">
                {stage === "verified" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> 100% Valid
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> 1 Conflict
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* HERO SPLIT WORKSPACE: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* COLUMN 1: Factory Document Ingestion Vault (3.5 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Document Ingestion Vault</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Cloudflare R2 Encrypted</span>
              </div>

              {/* Upload Dropzone */}
              <div className="border border-dashed border-indigo-500/30 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06] rounded-xl p-4 text-center cursor-pointer transition-colors group">
                <div className="w-9 h-9 mx-auto rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-200">
                  Drop Factory Folder (PDFs, BOMs, Mill Certs)
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Extracted locally on M2 Apple Silicon with zero IP leak
                </p>
              </div>

              {/* Ingested Document List */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-1">
                  Active Corpus Files (5 of 24)
                </div>

                {/* Doc 1 */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/6 flex items-center justify-between text-xs hover:border-white/12 transition-colors">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">TechPack_DN2026_Rev3.pdf</p>
                      <span className="text-[10px] text-slate-500 font-mono">BOM: 38 items • H&M Spec</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    🟢 Parsed
                  </span>
                </div>

                {/* Doc 2: The Conflicted Cert */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  stage === "verified"
                    ? "bg-slate-900/60 border-emerald-500/30"
                    : "bg-rose-950/20 border-rose-500/40"
                }`}>
                  <div className="flex items-center gap-2.5 truncate">
                    {stage === "verified" ? (
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">
                        {stage === "verified" ? "GOTS_ScopeCert_Apex_2027.pdf" : "GOTS_ScopeCert_Apex_8492.pdf"}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {stage === "verified" ? "Apex Yarn • Valid to Nov 2027" : "Apex Yarn • Expired July 2026"}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${
                    stage === "verified"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}>
                    {stage === "verified" ? "🟢 Verified" : "🔴 Conflict"}
                  </span>
                </div>

                {/* Doc 3 */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/6 flex items-center justify-between text-xs hover:border-white/12 transition-colors">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">OEKO_TEX_DhakaEcoTex_Std100.pdf</p>
                      <span className="text-[10px] text-slate-500 font-mono">Dyeing Mill • ZDHC Level 3</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    🟢 Registry
                  </span>
                </div>

                {/* Doc 4 */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/6 flex items-center justify-between text-xs hover:border-white/12 transition-colors">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">GRS_Recycled_Trim_YKK.pdf</p>
                      <span className="text-[10px] text-slate-500 font-mono">Buttons & Zippers • Zinc 85%</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    🟡 Extracted
                  </span>
                </div>

                {/* Doc 5 */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/6 flex items-center justify-between text-xs hover:border-white/12 transition-colors">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">BSCI_SocialAudit_Ashulia_2026.pdf</p>
                      <span className="text-[10px] text-slate-500 font-mono">Factory Score: 98.4 (A-Grade)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    🟢 Registry
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 & 3: The Verification Engine & Knowledge Graph (8.5 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* HERO ALERT CARD: Certificate Conflict Flag vs Verified State */}
            {stage !== "verified" ? (
              <div className="glass-panel border-rose-500/30 bg-rose-950/20 rounded-2xl p-5 relative overflow-hidden transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] pointer-events-none" />
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
                        Registry Verification Discrepancy Found
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        Traffic-Light: 🔴 Conflict
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      Fabric Claim: 100% GOTS Organic Cotton • Scope Certificate Expired
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Tech pack claims 100% GOTS Organic Cotton for this denim batch. However, live lookup against the{" "}
                      <strong className="text-white">Global Organic Textile Standard (GOTS) Public Registry</strong>{" "}
                      reveals Scope Certificate <code className="text-rose-300 bg-black/40 px-1 py-0.5 rounded">#GOTS-BD-8492</code>{" "}
                      issued to <em>Apex Spinning Mills</em> expired on <strong>July 14, 2026</strong>.
                    </p>

                    {/* Impact Note */}
                    <div className="mt-3 p-2.5 rounded-lg bg-black/30 border border-rose-500/20 text-xs text-rose-200/90 flex items-center gap-2">
                      <Info className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Export Risk: Buyer customs reject in Rotterdam. Potential shipment cancellation.</span>
                    </div>

                    {/* Action Triggers */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {!chaseSent ? (
                        <button
                          onClick={handleTriggerChase}
                          className="pressable px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Evidence Chase via WhatsApp & Email (n8n)</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                            <Check className="w-4 h-4" /> WhatsApp Sent to Apex Spinning (+880 1711-XXXXXX)
                          </span>
                          <button
                            onClick={handleResolveConflict}
                            disabled={stage === "resolving"}
                            className="pressable px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                          >
                            {stage === "resolving" ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Re-Auditing Registry API...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Simulate Supplier Upload of Cert #GOTS-BD-9104</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel border-emerald-500/40 bg-emerald-950/20 rounded-2xl p-5 relative overflow-hidden transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                          Provenance Verification Complete
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          All Tiers 🟢 Valid
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        Style #DN-2026 Fully Reconciled & Ready for EU Export
                      </h3>
                      <p className="text-xs text-slate-300">
                        Updated GOTS Certificate #GOTS-BD-9104 verified against official registry. SHA-256 Merkle root locked.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowQRModal(true)}
                    className="pressable px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Digital Product Passport</span>
                  </button>
                </div>
              </div>
            )}

            {/* TABBED INTERFACE: Graph View / Questionnaire / DPP */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between border-b border-white/8 pb-3 gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("graph")}
                    className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      activeTab === "graph"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Supply Chain Provenance Graph (Graph RAG)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("questionnaire")}
                    className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      activeTab === "questionnaire"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Auto-Filled Buyer ESG Questionnaire (30s)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("passport")}
                    className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      activeTab === "passport"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>EU Product Passport (JSON-LD)</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {nodes.filter((n) => n.status === "verified").length} of {nodes.length} Tiers Valid
                </span>
              </div>

              {/* TAB CONTENT 1: Interactive Knowledge Graph */}
              {activeTab === "graph" && (
                <div className="flex flex-col gap-3">
                  <div className="h-64 w-full bg-slate-950/80 rounded-xl border border-white/6 p-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400 z-10">
                      <span>Multi-Tier Supply Chain Graph Visualizer</span>
                      <span className="text-[10px] font-mono text-indigo-400">
                        Click node for verified registry payload
                      </span>
                    </div>

                    {/* SVG Interactive Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="12%" y1="55%" x2="28%" y2="40%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="28%" y1="40%" x2="48%" y2="60%" stroke={stage === "verified" ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.4)"} strokeWidth="2" />
                      <line x1="48%" y1="60%" x2="68%" y2="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="68%" y1="42%" x2="85%" y2="65%" stroke="rgba(16,185,129,0.3)" strokeWidth="2" />
                    </svg>

                    {/* Interactive Node Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 z-10 my-auto">
                      {nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`pressable p-3 rounded-xl border text-left flex flex-col justify-between h-28 transition-all ${
                            node.status === "conflict"
                              ? "bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/50"
                              : node.status === "verified"
                              ? "bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500/60"
                              : "bg-slate-900/80 border-amber-500/30 hover:border-amber-500/60"
                          } ${selectedNode?.id === node.id ? "ring-2 ring-indigo-500" : ""}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono uppercase text-slate-400">
                                {node.tier.split(":")[0]}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  node.status === "conflict"
                                    ? "bg-rose-500 animate-ping"
                                    : node.status === "verified"
                                    ? "bg-emerald-400"
                                    : "bg-amber-400"
                                }`}
                              />
                            </div>
                            <p className="text-xs font-semibold text-slate-200 line-clamp-1">{node.name}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-300 font-mono block">{node.certType}</span>
                            <span className="text-[9px] text-slate-500 font-mono block truncate">{node.certNo}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-slate-500 z-10 pt-2 border-t border-white/4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> 🟢 Registry-Verified
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> 🟡 Document-Extracted
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> 🔴 Certificate Conflict
                      </span>
                    </div>
                  </div>

                  {/* Selected Node Inspector Drawer */}
                  {selectedNode && (
                    <div className="glass-card rounded-xl p-3.5 border-indigo-500/30 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-150">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{selectedNode.name}</span>
                          <span className="text-slate-400">({selectedNode.tier})</span>
                        </div>
                        <p className="text-slate-300 mt-1">{selectedNode.details}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                          <span>Certificate ID: <strong className="text-slate-200">{selectedNode.certNo}</strong></span>
                          <span>•</span>
                          <span>Audit Authority: <strong className="text-slate-200">Official Issuer Gateway</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 2: Auto-Filled Buyer ESG Questionnaire */}
              {activeTab === "questionnaire" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-white/6">
                    <div>
                      <p className="font-semibold text-white">Inditex / H&M Supplier CSDDD Questionnaire 2026/27</p>
                      <p className="text-[11px] text-slate-400">Auto-generated in 28 seconds from 24 raw factory files</p>
                    </div>
                    <button className="pressable px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      <span>Export to Excel & PDF</span>
                    </button>
                  </div>

                  <div className="border border-white/8 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-white/8 font-mono text-[11px]">
                        <tr>
                          <th className="p-2.5">Question Item</th>
                          <th className="p-2.5">Auto-Extracted Value</th>
                          <th className="p-2.5">Evidence Source</th>
                          <th className="p-2.5 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/6 text-slate-300">
                        <tr>
                          <td className="p-2.5 font-medium text-white">Q1: Total Organic Cotton Percentage</td>
                          <td className="p-2.5 text-emerald-400 font-mono">100.0% (GOTS Certified)</td>
                          <td className="p-2.5 text-slate-400">TechPack_Rev3.pdf + ScopeCert_Apex.pdf</td>
                          <td className="p-2.5 text-right text-emerald-400 font-mono">99.8%</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-white">Q2: Chemical Hazard Discharge (ZDHC)</td>
                          <td className="p-2.5 text-emerald-400 font-mono">Level 3 (Zero Hazardous Discharge)</td>
                          <td className="p-2.5 text-slate-400">OEKO_TEX_DhakaEcoTex_Std100.pdf</td>
                          <td className="p-2.5 text-right text-emerald-400 font-mono">99.4%</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-white">Q3: Recycled Content in Trims/Zippers</td>
                          <td className="p-2.5 text-amber-300 font-mono">85.4% Recycled Zinc Alloy</td>
                          <td className="p-2.5 text-slate-400">GRS_Recycled_Trim_YKK.pdf</td>
                          <td className="p-2.5 text-right text-amber-400 font-mono">94.2%</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-white">Q4: Factory Worker Wage Compliance</td>
                          <td className="p-2.5 text-emerald-400 font-mono">100% Digital Wages (bKash/Bank)</td>
                          <td className="p-2.5 text-slate-400">BSCI_SocialAudit_Ashulia_2026.pdf</td>
                          <td className="p-2.5 text-right text-emerald-400 font-mono">100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: Raw ESPR JSON-LD Digital Product Passport */}
              {activeTab === "passport" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">EU CIRPASS / ESPR Standard Schema</span>
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Live Mobile Landing Page</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300/90 overflow-x-auto border border-white/8 max-h-60 leading-relaxed">
{`{
  "@context": "https://ec.europa.eu/digital-product-passport/v1",
  "@type": "TextileProductPassport",
  "passportIdentifier": "urn:dpp:bd:ashulia:dn2026-hm",
  "styleCode": "DN-2026",
  "productName": "Mens Relaxed Fit Organic Denim Jacket",
  "manufacturer": {
    "name": "Ashulia Export Apparel Ltd",
    "countryOfOrigin": "Bangladesh (BD)",
    "bgmeaLicense": "BGMEA-REG-84210"
  },
  "materialsComposition": [
    {
      "component": "Main Fabric",
      "material": "Organic Cotton",
      "percentage": 100,
      "certifications": [
        {
          "standard": "Global Organic Textile Standard (GOTS)",
          "certificateNumber": "${stage === "verified" ? "GOTS-BD-9104" : "GOTS-BD-8492"}",
          "registryStatus": "${stage === "verified" ? "VERIFIED_ACTIVE" : "EXPIRED_FLAGGED"}"
        }
      ]
    }
  ],
  "durabilityMetrics": {
    "tearStrength": "42 N",
    "colorFastnessToWashing": "Grade 4-5",
    "repairabilityIndex": 8.4
  },
  "merkleAuditRoot": "0x7f4b82a10c9e21df904321bcde45aa81938b"
}`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM METRICS: Impact & Why This Wins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Time Saved per Style</p>
              <h4 className="text-lg font-bold text-white">2 Weeks → 30 Seconds</h4>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Buyer Compliance Certainty</p>
              <h4 className="text-lg font-bold text-white">Zero Greenwashing Claims</h4>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Consultant Cost Replaced</p>
              <h4 className="text-lg font-bold text-white">$15,000 / Year Saved</h4>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: Scannable Live QR Code & Digital Product Passport */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-3xl p-6 max-w-sm w-full border border-white/20 flex flex-col items-center text-center relative shadow-2xl">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/30">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Digital Product Passport</h3>
            <p className="text-xs text-slate-400 mt-1">
              Style #DN-2026 • Verified by Bunon Sovereign Node
            </p>

            {/* Crisp QR Code Graphic Simulation */}
            <div className="my-5 p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center">
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-2.5 flex items-center justify-center">
                <div className="w-full h-full border-4 border-indigo-400 rounded-lg p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-indigo-400 rounded-sm" />
                    <div className="w-8 h-8 bg-indigo-400 rounded-sm" />
                  </div>
                  <div className="text-center font-mono text-[9px] text-indigo-300 font-bold">
                    SCAN FOR DPP
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-indigo-400 rounded-sm" />
                    <div className="w-5 h-5 bg-cyan-400 rounded-sm" />
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-600 mt-2 font-semibold">
                urn:dpp:bd:ashulia:dn2026-hm
              </span>
            </div>

            <div className="w-full bg-slate-900/80 rounded-xl p-3 text-left text-xs mb-4 border border-white/6 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">GOTS Organic Cotton:</span>
                <span className="text-emerald-400 font-semibold">100%</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Recycled Trim (GRS):</span>
                <span className="text-emerald-400 font-semibold">85.4%</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Factory Living Wage:</span>
                <span className="text-emerald-400 font-semibold">BSCI Verified</span>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="pressable w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Done & Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
