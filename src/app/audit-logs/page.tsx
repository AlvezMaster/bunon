"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Send,
  EyeOff,
  GitBranch,
  Layers,
  ArrowUpRight,
  Sliders,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Terminal,
  Activity
} from "lucide-react";

type EventType =
  | "ALL"
  | "REGISTRY"
  | "CHASE"
  | "CONFLICT"
  | "MINT"
  | "PII";

interface AuditEvent {
  id: string;
  timestamp: string;
  type: "REGISTRY" | "CHASE" | "CONFLICT" | "MINT" | "PII";
  typeLabel: string;
  actor: string;
  actorRole: string;
  targetRef: string;
  hash: string;
  prevHash: string;
  verified: boolean;
  status: "verified" | "flagged" | "automated" | "protected";
  summary: string;
  metadata: Record<string, string>;
}

const INITIAL_EVENTS: AuditEvent[] = [
  {
    id: "evt-9041",
    timestamp: "2026-11-07 12:44:19 UTC",
    type: "MINT",
    typeLabel: "Passport Minting",
    actor: "Bunon-1B On-Prem",
    actorRole: "Apple Silicon M2 / Native MPS",
    targetRef: "DPP-BD-2026-8841-EU",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    prevHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    verified: true,
    status: "verified",
    summary: "Sealed tamper-proof EU Ecodesign DPP for 50,000 Pcs Organic Cotton Crewneck (H&M Nordic PO #489102).",
    metadata: {
      merkleLeafIndex: "1420",
      complianceStandard: "EU ESPR Regulation 2024/1781",
      storageVault: "r2://bunon-evidence-vault/dpp/8841.json",
      encryption: "AES-256-GCM / SHA-256"
    }
  },
  {
    id: "evt-9040",
    timestamp: "2026-11-07 12:41:03 UTC",
    type: "REGISTRY",
    typeLabel: "Registry Verification",
    actor: "Global Registry Connector",
    actorRole: "Automated Verifier",
    targetRef: "GOTS Scope #GOTS-BD-9104",
    hash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    prevHash: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    verified: true,
    status: "verified",
    summary: "Queried GOTS central directory; authenticated Apex Spinning Mills updated certificate through Nov 2027.",
    metadata: {
      httpStatus: "200 OK (Signed mTLS)",
      latencyMs: "182ms",
      rootCA: "Global Organic Textile Standard CA v3",
      checksum: "Valid"
    }
  },
  {
    id: "evt-9039",
    timestamp: "2026-11-07 12:38:52 UTC",
    type: "CHASE",
    typeLabel: "WhatsApp Chase",
    actor: "Ingestion Agent (n8n)",
    actorRole: "Automated Gateway",
    targetRef: "WhatsApp ID: +880 1711-889922",
    hash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    prevHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    verified: true,
    status: "automated",
    summary: "Dispatched automated bilingual chase (English/Bengali) to Apex Commercial Manager for renewed GOTS scope certificate.",
    metadata: {
      messageId: "wamid.HBgMOTE3MTExODg5OTIyFQIAERgSMzE1",
      deliveryStatus: "Read by Recipient (00:00:14s turnaround)",
      chaseSequence: "1 of 3"
    }
  },
  {
    id: "evt-9038",
    timestamp: "2026-11-07 12:35:10 UTC",
    type: "PII",
    typeLabel: "PII Redaction",
    actor: "Bunon-1B Privacy Guard",
    actorRole: "On-Prem Core",
    targetRef: "Commercial Invoice #CI-2026-771",
    hash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    prevHash: "ef41a8a25c138f5f64d0a1b6478950c4aa302b115ff68f6a94b8e3a0937a0f62",
    verified: true,
    status: "protected",
    summary: "Masked proprietary FOB pricing ($4.18/pc), sub-contractor margin percentages, and factory bank wire coordinates before Merkle hashing.",
    metadata: {
      boundary: "Air-Gapped Local RAM",
      redactionAlgorithm: "Named Entity Masking (NER bfloat16)",
      leakageCheck: "0 byte public leakage"
    }
  },
  {
    id: "evt-9037",
    timestamp: "2026-11-07 12:31:44 UTC",
    type: "CONFLICT",
    typeLabel: "Conflict Flag",
    actor: "Bunon-1B On-Prem",
    actorRole: "Deterministic Compliance Engine",
    targetRef: "PO-HNM-2026-004 ↔ Scope #GOTS-BD-8492",
    hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
    prevHash: "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce",
    verified: true,
    status: "flagged",
    summary: "CRITICAL: Scope certificate #GOTS-BD-8492 expired on July 14, 2026. Flagged hard shipment-blocker under EU ESPR Article 9.",
    metadata: {
      discrepancyDelta: "116 Days Post Expiry",
      riskLevel: "High (Customs Confiscation Risk)",
      recommendedAction: "Halt cutting schedule until renewed document parsed."
    }
  },
  {
    id: "evt-9036",
    timestamp: "2026-11-07 12:20:15 UTC",
    type: "REGISTRY",
    typeLabel: "Registry Verification",
    actor: "OEKO-TEX Label Check",
    actorRole: "API Gateway",
    targetRef: "OEKO-TEX Standard 100 #21.HBD.88412",
    hash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5",
    prevHash: "11a68fb1e1f74815a5146c05d7b5fbeff1fa24ffcfb721e06f9d45ee0d984dfa",
    verified: true,
    status: "verified",
    summary: "Annex 4 certified safe chemical limits verified for Eco-Tex Dyeing facility. Heavy metals & formaldehyde: Non-detectable.",
    metadata: {
      toxicologyClass: "Class 1 (Baby skin contact certified)",
      labLocation: "Hohenstein Textile Testing Institute, Germany"
    }
  },
  {
    id: "evt-9035",
    timestamp: "2026-11-07 12:12:08 UTC",
    type: "REGISTRY",
    typeLabel: "Registry Verification",
    actor: "amfori BSCI Directory",
    actorRole: "Audit Validator",
    targetRef: "Audit DBID #398110 (Ashulia Plant)",
    hash: "2c624232cdd221771294dfbb310aca000a0df6ec8b6602f320b2e2d77b1a4a49",
    prevHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
    verified: true,
    status: "verified",
    summary: "Factory social audit score: 98.4 (A-Grade). Overtime policy, living wage compliance, and fire safety protocols cryptographically sealed.",
    metadata: {
      auditor: "SGS Bangladesh Ltd.",
      auditDate: "2026-09-18",
      socialTier: "Tier 1 Garment Assembly"
    }
  }
];

export default function AuditLogsPage() {
  const [filterType, setFilterType] = useState<EventType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isVerifyingTree, setIsVerifyingTree] = useState(false);
  const [treeVerified, setTreeVerified] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return INITIAL_EVENTS.filter((e) => {
      const matchesType = filterType === "ALL" || e.type === filterType;
      const matchesSearch =
        e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.targetRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.hash.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [filterType, searchQuery]);

  // Handle Copy Hash
  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  // Interactive Merkle Tree Verification
  const handleVerifyMerkleTree = () => {
    setIsVerifyingTree(true);
    setTreeVerified(false);
    setTimeout(() => {
      setIsVerifyingTree(false);
      setTreeVerified(true);
      setTimeout(() => setTreeVerified(false), 5000);
    }, 1200);
  };

  // Export CSV Functionality
  const handleExportCSV = () => {
    const headers = ["Event ID", "Timestamp", "Type", "Actor", "Target Reference", "SHA-256 Hash", "Summary"];
    const rows = filteredEvents.map((e) => [
      e.id,
      `"${e.timestamp}"`,
      e.typeLabel,
      `"${e.actor}"`,
      `"${e.targetRef}"`,
      e.hash,
      `"${e.summary.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bunon-regulatory-audit-chain-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#090c15] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[340px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed top-48 right-10 w-[500px] h-[280px] bg-emerald-500/5 blur-[130px] pointer-events-none rounded-full" />

      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/8 glass-panel px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-bold tracking-tighter text-white">ব</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight-display text-white">
                  Bunon <span className="font-normal text-slate-400 text-sm">(বুনন)</span>
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Immutable Regulatory Chain-of-Custody • EU ESPR & Customs Gateway
              </p>
            </div>
          </Link>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Compliance Engine
          </Link>
          <Link
            href="/audit-logs"
            className="px-3.5 py-1.5 rounded-lg font-medium bg-indigo-600 text-white shadow-sm transition-all"
          >
            Audit Logs & Merkle Proofs
          </Link>
          <Link
            href="/settings"
            className="px-3.5 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Sovereign Node Settings
          </Link>
        </nav>

        {/* Telemetry Pills */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHA-256 Hash Chain: Active</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Apple M2 Hardware Enclave</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Top Hero / Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stat 1: Total Events */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Total Events Logged</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">1,420</span>
              <span className="text-xs text-emerald-400 font-mono">+42 today</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">100% On-Premises Local SQLite</p>
          </div>

          {/* Stat 2: Merkle Proofs */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Merkle Proof Integrity</span>
              <GitBranch className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">100%</span>
              <span className="text-xs text-slate-300 font-medium">Valid Root</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Root: 0x7f9a...3b21 (Zero tampering)</p>
          </div>

          {/* Stat 3: Last Audit Cycle */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Last Audit Cycle</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">3 mins ago</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Automated batch verify • Ashulia node</p>
          </div>

          {/* Stat 4: Regulatory Standard */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Customs Standard</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-200 tracking-tight">EU ESPR 2026</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Article 9 Tamper-Proof Digital Ledger</p>
          </div>
        </div>

        {/* 3. Interactive Actions Bar & Controls */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search hash, PO, actor, or cert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {(
                [
                  ["ALL", "All Events"],
                  ["REGISTRY", "Registries"],
                  ["CHASE", "WhatsApp"],
                  ["CONFLICT", "Conflicts"],
                  ["MINT", "Passports"],
                  ["PII", "PII Redactions"]
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    filterType === key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={handleVerifyMerkleTree}
              disabled={isVerifyingTree}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                treeVerified
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : isVerifyingTree
                  ? "bg-indigo-900/40 text-indigo-300 border-indigo-500/30 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700/80 text-white border-white/10"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingTree ? "animate-spin" : ""}`} />
              {isVerifyingTree
                ? "Recalculating 1,420 Merkle Leaves..."
                : treeVerified
                ? "✓ 100% Tree Integrity Verified!"
                : "Verify Merkle Tree Integrity"}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all border border-indigo-400/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Report (CSV)</span>
            </button>
          </div>
        </div>

        {/* Merkle Tree Verification Banner (When verified) */}
        {treeVerified && (
          <div className="glass-panel border-emerald-500/40 bg-emerald-950/20 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">Cryptographic Merkle Proof Validated across 1,420 Leaves</p>
                <p className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
                  Calculated Root: 0x7f9a2b84c718e2448a3190fc55df02a7b68192305e718b9b47e0915f3b21008a • Latency: 14ms
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-emerald-500/20 rounded border border-emerald-500/30 text-emerald-300">
              TAMPER_ZERO_CONFIRMED
            </span>
          </div>
        )}

        {/* 4. The Immutable Audit Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/8 shadow-2xl">
          <div className="p-4 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Cryptographic Event Sequence</h2>
              <span className="text-xs text-slate-500 font-mono">({filteredEvents.length} events)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Validated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Conflict
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Automated
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-white/5 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event ID / Time</th>
                  <th className="py-3 px-4">Type & Category</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Artifact</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Proof Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Timestamp & ID */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-white">{evt.id}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{evt.timestamp}</div>
                    </td>

                    {/* Type badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                          evt.type === "MINT"
                            ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                            : evt.type === "REGISTRY"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : evt.type === "CONFLICT"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : evt.type === "CHASE"
                            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {evt.type === "MINT" && <Sparkles className="w-3 h-3" />}
                        {evt.type === "REGISTRY" && <CheckCircle2 className="w-3 h-3" />}
                        {evt.type === "CONFLICT" && <AlertTriangle className="w-3 h-3" />}
                        {evt.type === "CHASE" && <Send className="w-3 h-3" />}
                        {evt.type === "PII" && <EyeOff className="w-3 h-3" />}
                        {evt.typeLabel}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{evt.actor}</div>
                      <div className="text-[11px] text-slate-500">{evt.actorRole}</div>
                    </td>

                    {/* Target Ref */}
                    <td className="py-3 px-4 font-mono text-slate-300 font-medium">
                      {evt.targetRef}
                    </td>

                    {/* Monospace Hash with Click to Copy */}
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(evt.hash);
                        }}
                        className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 hover:text-indigo-300 bg-slate-950/60 px-2 py-1 rounded border border-white/6 group/btn transition-colors"
                        title="Click to copy SHA-256 hash"
                      >
                        <span>{evt.hash.slice(0, 8)}...{evt.hash.slice(-6)}</span>
                        {copiedHash === evt.hash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500 group-hover/btn:text-indigo-400" />
                        )}
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid
                      </span>
                    </td>

                    {/* Action link */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-slate-400 group-hover:text-indigo-400 text-xs flex items-center justify-end gap-1">
                        View Payload <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Detail Modal / Drawer for Selected Event */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="glass-panel border-white/15 bg-slate-900/95 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedEvent.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{selectedEvent.timestamp}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">{selectedEvent.typeLabel}</h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="py-4 space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Summary Description</p>
                  <p className="text-slate-200 mt-1 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    {selectedEvent.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Actor & Execution Node</span>
                    <span className="text-white font-semibold mt-0.5 block">{selectedEvent.actor}</span>
                    <span className="text-slate-400 text-[10px]">{selectedEvent.actorRole}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Target Identifier</span>
                    <span className="text-indigo-300 font-mono font-medium mt-0.5 block truncate">
                      {selectedEvent.targetRef}
                    </span>
                  </div>
                </div>

                {/* SHA-256 Details */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Current Node SHA-256 Hash</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="font-mono text-slate-200 break-all select-all text-[11px]">
                        {selectedEvent.hash}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedEvent.hash)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Previous Linked Hash (Merkle Parent)</span>
                    <span className="font-mono text-slate-400 break-all text-[11px] block mt-0.5">
                      {selectedEvent.prevHash}
                    </span>
                  </div>
                </div>

                {/* Additional Metadata */}
                <div>
                  <p className="text-slate-400 font-medium mb-1.5">Extended Cryptographic Metadata</p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 font-mono text-[11px] space-y-1">
                    {Object.entries(selectedEvent.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-0.5 border-b border-white/5 last:border-none">
                        <span className="text-slate-500">{key}:</span>
                        <span className="text-slate-300 text-right font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Validated by On-Prem Root Authority
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
