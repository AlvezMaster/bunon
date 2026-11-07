"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  Check,
  FileText,
  Network,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  Terminal as TerminalIcon,
  Cpu,
  RefreshCw,
  Building2,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface StyleItem {
  id: string;
  code: string;
  title: string;
  material: string;
  cluster: string;
  factory: string;
  orderVolume: string;
  status: "valid" | "warning";
  statusText: string;
  dppId: string;
  merkleRoot: string;
  certifications: {
    name: string;
    validUntil: string;
    status: "valid" | "warning";
    notes: string;
  }[];
  metrics: {
    recycledContentPct: number;
    co2Kg: number;
    livingWageRatio: number;
    waterRecycledPct: number;
  };
  tierBreakdown: {
    tier: number;
    name: string;
    facility: string;
    location: string;
  }[];
}

const STYLES_CATALOG: StyleItem[] = [
  {
    id: "style-1",
    code: "DN-2026",
    title: "Mens Relaxed Fit Organic Denim Jacket",
    material: "100% Certified Organic Cotton Denim (13.5 oz)",
    cluster: "Ashulia Industrial Zone, Dhaka",
    factory: "Ashulia Eco Apparels Ltd (Unit 2)",
    orderVolume: "24,000 pcs",
    status: "valid",
    statusText: "🟢 100% Valid & ESPR Ready",
    dppId: "DPP-EU-BD-2026-DN8842",
    merkleRoot: "0x8fa9...30f1",
    certifications: [
      { name: "GOTS v7.0", validUntil: "Dec 2026", status: "valid", notes: "100% Certified Organic Fiber" },
      { name: "OEKO-TEX Std 100", validUntil: "Sep 2026", status: "valid", notes: "Annex 4 Product Class I" },
      { name: "amfori BSCI", validUntil: "Feb 2027", status: "valid", notes: "A-Grade (Score: 96.4/100)" },
      { name: "ZDHC Level 3", validUntil: "Nov 2026", status: "valid", notes: "Zero Hazardous Discharge" },
    ],
    metrics: {
      recycledContentPct: 0,
      co2Kg: 2.14,
      livingWageRatio: 1.28,
      waterRecycledPct: 94.2,
    },
    tierBreakdown: [
      { tier: 0, name: "Cut & Sew (CMT)", facility: "Ashulia Eco Apparels Ltd", location: "Ashulia, Dhaka" },
      { tier: 1, name: "Fabric & Dyeing", facility: "Shanta Denim Mills Ltd", location: "Bhaluka, Mymensingh" },
      { tier: 2, name: "Yarn Spinning", facility: "Square Yarns Unit 4", location: "Gazipur, Dhaka" },
      { tier: 3, name: "Ginning & Lint", facility: "Kashimpur Ginning Cons.", location: "Jessore" },
      { tier: 4, name: "Organic Farm", facility: "BGD-Organic Farmer Guild", location: "Faridpur Cooperative" },
    ],
  },
  {
    id: "style-2",
    code: "KN-4012",
    title: "100% Combed Cotton Jersey Crewneck",
    material: "100% Combed Ring-Spun Organic Cotton (180 GSM)",
    cluster: "Gazipur Industrial Belt",
    factory: "Apex Smart Textiles Complex",
    orderVolume: "50,000 pcs",
    status: "valid",
    statusText: "🟢 Valid & ESPR Ready",
    dppId: "DPP-EU-BD-2026-KN4012",
    merkleRoot: "0x3db5...b381",
    certifications: [
      { name: "OEKO-TEX Std 100", validUntil: "Nov 2026", status: "valid", notes: "Safe for sensitive skin" },
      { name: "WRAP Gold", validUntil: "Oct 2026", status: "valid", notes: "Social & Ethical Compliance" },
      { name: "BSCI A-Grade", validUntil: "Jan 2027", status: "valid", notes: "Audited & Verified" },
      { name: "ZDHC Level 3", validUntil: "Dec 2026", status: "valid", notes: "MRSL v3.1 Verified" },
    ],
    metrics: {
      recycledContentPct: 0,
      co2Kg: 1.85,
      livingWageRatio: 1.22,
      waterRecycledPct: 91.0,
    },
    tierBreakdown: [
      { tier: 0, name: "Cut & Sew (CMT)", facility: "Apex Smart Textiles", location: "Gazipur, Dhaka" },
      { tier: 1, name: "Knitting & Dyeing", facility: "Apex Knit Dyeing Unit", location: "Gazipur, Dhaka" },
      { tier: 2, name: "Spinning", facility: "Matin Spinning Mills PLC", location: "Kashimpur, Gazipur" },
      { tier: 3, name: "Ginning", facility: "Padma Fiber Mills", location: "Kushtia" },
      { tier: 4, name: "Cotton Origin", facility: "Verified Organic Growers", location: "Jhenaidah" },
    ],
  },
  {
    id: "style-3",
    code: "HD-8901",
    title: "Recycled Fleece Pullover Hoodie",
    material: "68% Post-Consumer PET Recycled Fleece + 32% BCI Cotton",
    cluster: "Narayanganj Dyeing & Knitting Cluster",
    factory: "Pioneer Recycled Fiber & Apparel Ltd",
    orderVolume: "18,000 pcs",
    status: "warning",
    statusText: "🟡 1 Cert Pending Renewal",
    dppId: "DPP-EU-BD-2026-HD8901",
    merkleRoot: "0x12c4...1c32",
    certifications: [
      { name: "GRS (Recycled)", validUntil: "Dec 2026", status: "valid", notes: "68% Certified Recycled PET" },
      { name: "OEKO-TEX Std 100", validUntil: "Aug 2026", status: "valid", notes: "Certified Class II" },
      { name: "ZDHC Level 3", validUntil: "Mar 31, 2026", status: "warning", notes: "Renewal Audit Underway (TÜV SÜD)" },
      { name: "BSCI B-Grade", validUntil: "Jun 2026", status: "valid", notes: "Minor corrective action in progress" },
    ],
    metrics: {
      recycledContentPct: 68,
      co2Kg: 1.62,
      livingWageRatio: 1.18,
      waterRecycledPct: 88.5,
    },
    tierBreakdown: [
      { tier: 0, name: "Cut & Sew (CMT)", facility: "Pioneer Recycled Apparel", location: "Narayanganj" },
      { tier: 1, name: "Recycled Dyeing", facility: "Eco-Tech Narayanganj Mill", location: "Narayanganj" },
      { tier: 2, name: "Polyester Extrusion", facility: "Bengal Synthetic Yarns", location: "Munshiganj" },
      { tier: 3, name: "PET Flake Washing", facility: "Dhaka Bottle Recycling Plant", location: "Dhamrai" },
      { tier: 4, name: "Bottle Collection", facility: "Clean Bangladesh Network", location: "National Network" },
    ],
  },
  {
    id: "style-4",
    code: "TW-1055",
    title: "Enzyme Washed Chino Trousers",
    material: "98% Organic Cotton Twill + 2% Elastane (240 GSM)",
    cluster: "Chittagong Export Processing Zone (CEPZ)",
    factory: "Pacific Casuals Export Zone Unit-A",
    orderVolume: "32,000 pcs",
    status: "valid",
    statusText: "🟢 100% Valid (BSCI A-Grade)",
    dppId: "DPP-EU-BD-2026-TW1055",
    merkleRoot: "0x77ee...f890",
    certifications: [
      { name: "BSCI A-Grade", validUntil: "Jan 2027", status: "valid", notes: "Score 98/100 (Zero Defect Audit)" },
      { name: "GOTS v7.0", validUntil: "Aug 2026", status: "valid", notes: "Organic Twill Verified" },
      { name: "OEKO-TEX Std 100", validUntil: "Nov 2026", status: "valid", notes: "Harmless Eco-Wash" },
      { name: "ZDHC Level 3", validUntil: "Oct 2026", status: "valid", notes: "Full In-Line Filtration" },
    ],
    metrics: {
      recycledContentPct: 0,
      co2Kg: 2.38,
      livingWageRatio: 1.34,
      waterRecycledPct: 96.0,
    },
    tierBreakdown: [
      { tier: 0, name: "Cut & Sew (CMT)", facility: "Pacific Casuals Unit-A", location: "Chittagong EPZ" },
      { tier: 1, name: "Twill Weaving & Wash", facility: "KDS Textile Finishing", location: "Chittagong Industrial Area" },
      { tier: 2, name: "Spinning", facility: "Pahartali Textile Mills", location: "Chittagong" },
      { tier: 3, name: "Raw Fiber Processing", facility: "CEPZ Bonded Warehouse", location: "Chittagong Port" },
      { tier: 4, name: "Organic Farm Origin", facility: "Verified Organic Growers", location: "Meherpur" },
    ],
  },
];

const PRESET_QUERIES = [
  "Which styles in Ashulia cluster meet EU recycled polyester thresholds (>60%) with zero hazardous chemical discharge?",
  "Show all 100% GOTS organic cotton styles with living wage verified > 1.25x",
  "Inspect styles with pending certificate renewals before EU customs dispatch",
];

export default function BuyerTerminalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    query: string;
    matchingStyleCodes: string[];
    summary: string;
    auditLog: string[];
  } | null>(null);

  const [selectedStyleModal, setSelectedStyleModal] = useState<StyleItem | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [mcpTab, setMcpTab] = useState<"claude" | "curl">("claude");
  const [mcpLiveOutput, setMcpLiveOutput] = useState<string | null>(null);
  const [isCallingMcp, setIsCallingMcp] = useState(false);
  const [dossierExporting, setDossierExporting] = useState<string | null>(null);

  // Filter styles based on search & category
  const filteredStyles = useMemo(() => {
    return STYLES_CATALOG.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.certifications.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedFilter === "VALID") return item.status === "valid";
      if (selectedFilter === "WARNING") return item.status === "warning";
      if (selectedFilter === "GOTS") return item.certifications.some((c) => c.name.includes("GOTS"));
      if (selectedFilter === "OEKO-TEX") return item.certifications.some((c) => c.name.includes("OEKO-TEX"));
      if (selectedFilter === "BSCI") return item.certifications.some((c) => c.name.includes("BSCI"));
      if (selectedFilter === "ZDHC") return item.certifications.some((c) => c.name.includes("ZDHC"));

      return true;
    });
  }, [searchQuery, selectedFilter]);

  // Execute AI Natural Language Query
  const handleRunAiQuery = (promptToRun?: string) => {
    const query = promptToRun || aiPrompt;
    if (!query.trim()) return;

    setIsAiProcessing(true);
    setAiResult(null);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let matchedCodes: string[] = [];
      let summary = "";
      let auditLog: string[] = [];

      if (lower.includes("recycled") || lower.includes("polyester") || lower.includes(">60%")) {
        matchedCodes = ["HD-8901"];
        summary =
          "Found 1 style matching Recycled Polyester criteria: Style #HD-8901 contains 68% Post-Consumer PET Fleece (exceeds >60% EU threshold). Note: ZDHC Level 3 certificate renewal is scheduled with TÜV SÜD for March 18, 2026.";
        auditLog = [
          "Merkle Proof leaf verify: 0x12c4998fa01e925b4408dc993bf2008741e974cb (MATCH)",
          "GRS Certificate #CU-881290 valid through Dec 2026 (Recycled content: 68.0%)",
          "ESPR Digital Product Passport #DPP-EU-BD-2026-HD8901 flagged for renewal inspection",
        ];
      } else if (lower.includes("gots") || lower.includes("living wage") || lower.includes("1.25") || lower.includes("ashulia")) {
        matchedCodes = ["DN-2026", "TW-1055"];
        summary =
          "Identified 2 export styles with 100% GOTS Organic Certification and verified living wage multipliers exceeding 1.25x statutory threshold (DN-2026 @ 1.28x, TW-1055 @ 1.34x). Zero hazardous chemical discharge verified across all tier-1 processing units.";
        auditLog = [
          "Querying Cluster: Ashulia & Chittagong EPZ nodes",
          "Cryptographic verification of GOTS License CU-849201: SUCCESS",
          "Worker biometric compensation index check: 1.28x & 1.34x verified via mobile payroll logs",
          "ESPR EU Green Customs Channel clearance probability: 99.8%",
        ];
      } else if (lower.includes("renewal") || lower.includes("pending")) {
        matchedCodes = ["HD-8901"];
        summary =
          "1 style currently requires renewal action before European Port entry: Style #HD-8901 (ZDHC Level 3 MRSL expires Mar 31, 2026; physical factory audit logged for Mar 18).";
        auditLog = [
          "Scan completed across 4 registered styles in Bunon Merkle Graph",
          "Style #HD-8901 marked as Secondary Audit Priority at Hamburg / Rotterdam customs",
          "3 of 4 styles hold green-lane status",
        ];
      } else {
        matchedCodes = ["DN-2026", "KN-4012", "TW-1055"];
        summary =
          `Evaluated Bunon Merkle graph for query: "${query}". 3 of 4 export styles meet immediate unrestricted EU ESPR cross-border clearance. All supply chain tiers 0-4 are cryptographically anchored.`;
        auditLog = [
          "Root state: 0x8fa921c5b8e90a98341dfb34208e923e4f71a93d",
          "Verified against EU Ecodesign Directive (ESPR 2024/1781)",
          "All audit certificates signed by accredited CBs (Control Union, TESTEX, amfori)",
        ];
      }

      setAiResult({
        query,
        matchingStyleCodes: matchedCodes,
        summary,
        auditLog,
      });
      setIsAiProcessing(false);
    }, 700);
  };

  // Download Compliance Dossier
  const handleDownloadDossier = (style: StyleItem) => {
    setDossierExporting(style.code);
    setTimeout(() => {
      const dossierContent = {
        title: "BUNON EUROPEAN UNION COMPLIANCE DOSSIER & MERKLE PROOF",
        timestamp: new Date().toISOString(),
        style_code: style.code,
        style_name: style.title,
        digital_product_passport_id: style.dppId,
        merkle_root_hash: style.merkleRoot,
        factory_entity: style.factory,
        cluster: style.cluster,
        espr_verification_status: style.status === "valid" ? "100% VERIFIED_COMPLIANT" : "CONDITIONAL_APPROVAL",
        certifications: style.certifications,
        metrics: style.metrics,
        supply_chain_provenance: style.tierBreakdown,
        cryptographic_signature: "ECDSA_SECP256K1_0x99e8a71b2d45c60912f99a81",
        notice: "Compliant with EU Corporate Sustainability Due Diligence Directive (CSDDD) & ESPR 2024/1781",
      };

      const blob = new Blob([JSON.stringify(dossierContent, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BUNON-DOSSIER-${style.code}-MERKLE-VERIFIED.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDossierExporting(null);
    }, 600);
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Test live MCP endpoint
  const handleTestMcpLive = async () => {
    setIsCallingMcp(true);
    setMcpLiveOutput(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "buyer-demo-1",
          method: "tools/call",
          params: {
            name: "verify_style_compliance",
            arguments: { style_code: "DN-2026" },
          },
        }),
      });
      const data = await res.json();
      setMcpLiveOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setMcpLiveOutput(
        JSON.stringify({ error: err instanceof Error ? err.message : "Failed to reach MCP route" }, null, 2)
      );
    } finally {
      setIsCallingMcp(false);
    }
  };

  const claudeDesktopConfig = `{
  "mcpServers": {
    "bunon-rmg": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://tunnel.bunon-rmg.com/api/mcp"
      ]
    }
  }
}`;

  const curlCommand = `curl -X POST https://tunnel.bunon-rmg.com/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "verify_style_compliance",
      "arguments": { "style_code": "DN-2026" }
    }
  }'`;

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navigation & Status Bar */}
      <header className="border-b border-white/[0.08] bg-[#0c101b]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <div className="w-full h-full bg-[#0d1322] rounded-[11px] flex items-center justify-center">
                <Network className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  BUNON
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  EU Sourcing Terminal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                European Importers & Sourcing Directorate (H&M, Inditex, M&S)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/[0.06] text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloudflare Tunnel:</span>
              <span className="text-emerald-400 font-semibold">tunnel.bunon-rmg.com</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Merkle Root: Sync 2026.11</span>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById("mcp-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="pressable px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Connect MCP</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Context Banner */}
        <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-white/[0.08] shadow-2xl">
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>EU ESPR & CSDDD Cryptographic Verification Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Trace Ready-Made Garment (RMG) Provenance Across Bangladesh
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Verify chemical safety, GOTS & OEKO-TEX certificate validity, carbon emissions per piece, and living wage
              benchmarks for export styles with instant cryptographic Merkle proofs down to Tier 4 ginning and farm cooperatives.
            </p>
          </div>
        </div>

        {/* AI Query Input ("Ask Bunon Merkle Graph...") */}
        <section className="glass-panel rounded-2xl p-6 border border-emerald-500/20 bg-[#0e1626]/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                Natural Language Merkle Graph Query
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Agent Model Context Protocol Ready
            </span>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunAiQuery()}
                placeholder="Ask Bunon Merkle Graph: e.g., Which styles in Ashulia cluster meet EU recycled polyester thresholds (>60%) with zero hazardous chemical discharge?"
                className="w-full bg-[#080d18] border border-white/[0.12] focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
              />
            </div>
            <button
              onClick={() => handleRunAiQuery()}
              disabled={isAiProcessing}
              className="pressable sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isAiProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Evaluating Graph...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Execute Query</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Prompts Pills */}
          <div className="mt-3 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-slate-400 font-medium">Try queries:</span>
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(preset);
                  handleRunAiQuery(preset);
                }}
                className="pressable text-left px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/[0.06] hover:border-emerald-500/40 text-slate-300 transition-colors"
              >
                {preset.length > 60 ? preset.slice(0, 60) + "..." : preset}
              </button>
            ))}
          </div>

          {/* Interactive AI Simulation Output */}
          {aiResult && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-[#07101e] p-4.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Bunon Merkle Graph Verification Complete
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Consensus Confirmed</span>
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">{aiResult.summary}</p>

              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs space-y-1 border border-white/[0.04]">
                <div className="text-slate-400 font-semibold mb-1">// Cryptographic Audit Trail</div>
                {aiResult.auditLog.map((log, i) => (
                  <div key={i} className="text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <span>Matching style highlighted below:</span>
                {aiResult.matchingStyleCodes.map((code) => (
                  <span
                    key={code}
                    className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                  >
                    #{code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Catalog Search & Filters */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Export Style Catalog</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {filteredStyles.length} styles ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct export styles ready for European customs dispatch under the EU Ecodesign Directive (ESPR)
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by code, fabric, or cert..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#0f172a] border border-white/[0.1] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-white/[0.08] text-xs">
                <button
                  onClick={() => setSelectedFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFilter === "ALL" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter("VALID")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFilter === "VALID" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🟢 100% Valid
                </button>
                <button
                  onClick={() => setSelectedFilter("WARNING")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFilter === "WARNING" ? "bg-amber-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🟡 Pending
                </button>
                <button
                  onClick={() => setSelectedFilter("GOTS")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFilter === "GOTS" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  GOTS
                </button>
                <button
                  onClick={() => setSelectedFilter("OEKO-TEX")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFilter === "OEKO-TEX" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  OEKO-TEX
                </button>
                <button
                  onClick={() => setSelectedFilter("BSCI")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedFilter === "BSCI" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  BSCI
                </button>
              </div>
            </div>
          </div>

          {/* Style Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredStyles.map((item) => {
              const isAiHighlighted = aiResult?.matchingStyleCodes.includes(item.code);
              return (
                <div
                  key={item.id}
                  className={`glass-panel rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                    isAiHighlighted
                      ? "border-emerald-400/70 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/40 bg-[#0e1b2a]"
                      : "border-white/[0.08] hover:border-white/[0.15]"
                  }`}
                >
                  <div>
                    {/* Top Row: Style Code & Status */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white font-mono tracking-wide">
                            Style #{item.code}
                          </span>
                          {isAiHighlighted && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> AI Match
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200 mt-0.5">{item.title}</h3>
                      </div>

                      <div
                        className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap border ${
                          item.status === "valid"
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-950/70 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {item.statusText}
                      </div>
                    </div>

                    {/* Material & Cluster Info */}
                    <p className="text-xs text-slate-300 mb-3 line-clamp-1">{item.material}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-black/25 rounded-xl p-3 border border-white/[0.04] mb-3 font-sans">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Factory & Cluster</span>
                        <span className="text-slate-200 font-medium">{item.factory}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Export Volume</span>
                        <span className="text-slate-200 font-medium">{item.orderVolume}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Carbon Intensity</span>
                        <span className="text-emerald-400 font-mono font-medium">{item.metrics.co2Kg} kg CO₂ / pc</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Living Wage Ratio</span>
                        <span className="text-emerald-400 font-mono font-medium">{item.metrics.livingWageRatio}x Benchmark</span>
                      </div>
                    </div>

                    {/* Certification Badges */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Verified Accreditations
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.certifications.map((c, i) => (
                          <span
                            key={i}
                            title={`${c.notes} (Valid until: ${c.validUntil})`}
                            className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 font-mono ${
                              c.status === "valid"
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/20"
                                : "bg-amber-950/40 text-amber-300 border-amber-500/20"
                            }`}
                          >
                            {c.status === "valid" ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                            )}
                            <span>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Export Button */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedStyleModal(item)}
                      className="pressable text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inspect Tiers & DPP</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      onClick={() => handleDownloadDossier(item)}
                      disabled={dossierExporting === item.code}
                      className="pressable px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {dossierExporting === item.code ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Export Dossier (ZIP/PDF)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Connect via Model Context Protocol (MCP) Section */}
        <section id="mcp-section" className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/[0.08] relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <TerminalIcon className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Connect via Model Context Protocol (MCP)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Query Bunon Merkle verification natively inside Claude Desktop, Cursor, or autonomous LLM supply chain agents.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Endpoint:</span>
              <code className="text-xs font-mono px-2.5 py-1 rounded bg-black/50 border border-white/[0.1] text-cyan-300">
                https://tunnel.bunon-rmg.com/api/mcp
              </code>
              <button
                onClick={() => handleCopy("https://tunnel.bunon-rmg.com/api/mcp", "endpoint")}
                className="pressable p-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                title="Copy Endpoint"
              >
                {copiedSnippet === "endpoint" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Config Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setMcpTab("claude")}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    mcpTab === "claude"
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Claude Desktop Config (`claude_desktop_config.json`)
                </button>
                <button
                  onClick={() => setMcpTab("curl")}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    mcpTab === "curl"
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Terminal cURL (JSON-RPC 2.0)
                </button>
              </div>

              <button
                onClick={() => handleCopy(mcpTab === "claude" ? claudeDesktopConfig : curlCommand, mcpTab)}
                className="pressable text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08]"
              >
                {copiedSnippet === mcpTab ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Config</span>
                  </>
                )}
              </button>
            </div>

            {/* Code View */}
            <div className="relative rounded-xl bg-[#060911] border border-white/[0.06] p-4 font-mono text-xs text-slate-200 overflow-x-auto">
              <pre>{mcpTab === "claude" ? claudeDesktopConfig : curlCommand}</pre>
            </div>

            {/* Live Test Trigger Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                3 Tools Exposed:{" "}
                <code className="text-emerald-300">verify_style_compliance</code>,{" "}
                <code className="text-emerald-300">query_supply_chain_tier</code>,{" "}
                <code className="text-emerald-300">get_factory_esg_score</code>
              </div>

              <button
                onClick={handleTestMcpLive}
                disabled={isCallingMcp}
                className="pressable px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow transition-all disabled:opacity-50"
              >
                {isCallingMcp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Calling /api/mcp...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Live MCP Request Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Live MCP JSON Output */}
            {mcpLiveOutput && (
              <div className="mt-3 p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 font-mono text-xs animate-in fade-in">
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live Streamable JSON-RPC 2.0 Response from /api/mcp:</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto max-h-60 leading-relaxed">{mcpLiveOutput}</pre>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Detail Modal for Tier Breakdown & DPP Inspection */}
      {selectedStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl glass-panel bg-[#0d1424] border border-white/[0.12] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white font-mono">
                    Style #{selectedStyleModal.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    {selectedStyleModal.dppId}
                  </span>
                </div>
                <h3 className="text-sm text-slate-300 mt-1">{selectedStyleModal.title}</h3>
              </div>

              <button
                onClick={() => setSelectedStyleModal(null)}
                className="pressable p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Merkle Root Signature */}
            <div className="bg-black/40 rounded-xl p-3 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
                  Cryptographic Merkle Root
                </span>
                <span className="text-emerald-400 font-bold">{selectedStyleModal.merkleRoot}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
                  Customs Fast-Track
                </span>
                <span className="text-slate-200">Green Channel Approved</span>
              </div>
            </div>

            {/* Upstream Tiers 0 to 4 */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Supply Chain Tiers (Tier 0 to Tier 4)</span>
              </h4>

              <div className="space-y-2.5">
                {selectedStyleModal.tierBreakdown.map((t) => (
                  <div
                    key={t.tier}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400">
                        T{t.tier}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{t.name}</div>
                        <div className="text-slate-400 text-[11px]">{t.facility}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{t.location}</div>
                      <div className="text-emerald-400 font-mono text-[10px]">Leaf Hash: 0x98a...291</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Certified Standards Detail
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedStyleModal.certifications.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/40 border border-white/[0.04]">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{c.name}</span>
                      <span className="text-[11px] text-slate-400">Exp: {c.validUntil}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setSelectedStyleModal(null)}
                className="pressable px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadDossier(selectedStyleModal);
                }}
                className="pressable px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Compliance Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
