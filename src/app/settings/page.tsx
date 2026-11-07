"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  ShieldCheck,
  Lock,
  Globe,
  Database,
  Radio,
  Zap,
  Server,
  Terminal,
  Key,
  CheckCircle2,
  RefreshCw,
  Send,
  ExternalLink,
  Sliders,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Gauge,
  HardDrive,
  Workflow,
  Sparkles
} from "lucide-react";

export default function SettingsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    status: "success" | "idle";
    message: string;
    latency: number;
    timestamp: string;
  } | null>(null);

  // Simulated node restart
  const [isRestartingMPS, setIsRestartingMPS] = useState(false);
  const [mpsSuccess, setMpsSuccess] = useState(false);

  // Copy Helper
  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Test n8n Webhook
  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookTestResult({
        status: "success",
        message: 'HTTP 200 OK — Evidence Chase Triggered for supplier WhatsApp ID "+880 1711-XXXXXX"',
        latency: 48,
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => {
        setWebhookTestResult(null);
      }, 6000);
    }, 1100);
  };

  // Quick reload MPS runtime
  const handleReloadMPS = () => {
    setIsRestartingMPS(true);
    setTimeout(() => {
      setIsRestartingMPS(false);
      setMpsSuccess(true);
      setTimeout(() => setMpsSuccess(false), 2500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#090c15] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[340px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed top-64 right-1/4 w-[450px] h-[250px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

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
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sovereign Node
                </span>
              </div>
              <p className="text-xs text-slate-400">
                On-Premises Hardware Control & Infrastructure Topology
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
            className="px-3.5 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Audit Logs & Merkle Proofs
          </Link>
          <Link
            href="/settings"
            className="px-3.5 py-1.5 rounded-lg font-medium bg-indigo-600 text-white shadow-sm transition-all"
          >
            Sovereign Node Settings
          </Link>
        </nav>

        {/* Telemetry Pills */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Apple Silicon M2 • 16-bit FP16</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cloudflare Tunnel: Active</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Page Title & Node Identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-white">Sovereign Node & Infrastructure</h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Node ID: ashulia-cluster-042
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Local compliance hardware running at export factory premises in Ashulia, Dhaka. All commercial terms, margins, and supplier tech packs remain strictly on-premise.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Unified RAM: <strong className="text-white">2.1 GB / 16.0 GB</strong></span>
            </div>
            <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Throughput: <strong className="text-white">28.4 tok/s</strong></span>
            </div>
          </div>
        </div>

        {/* SECTION 1: On-Premise ML Node (Apple Silicon M2) */}
        <section className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  On-Premise Machine Learning Node (Apple Silicon M2)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Metal Performance Shaders
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Native 16-bit local weights running entirely inside factory boundary with zero cloud LLM exposure.
                </p>
              </div>
            </div>

            <button
              onClick={handleReloadMPS}
              disabled={isRestartingMPS}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                mpsSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : isRestartingMPS
                  ? "bg-indigo-900/40 text-indigo-300 border-indigo-500/30 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRestartingMPS ? "animate-spin" : ""}`} />
              {isRestartingMPS ? "Reloading Weights..." : mpsSuccess ? "✓ Runtime Healthy" : "Reload MPS Runtime"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* Active Model */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Active Model Weights</span>
              <p className="text-sm font-bold text-white mt-1 font-mono">Bunon-1B (Native 16-bit)</p>
              <span className="text-[11px] text-indigo-300/80 mt-0.5 block">Format: bfloat16 / FP16 Q8 Quantized</span>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Context Window</span>
                <span className="font-mono text-slate-200">8,192 tokens</span>
              </div>
            </div>

            {/* Inference Runtime */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Inference Runtime</span>
              <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Apple Metal (MPS) via Ollama
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Unified memory bandwidth: 100 GB/s</span>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Thermal Throttling</span>
                <span className="font-mono text-emerald-400 font-semibold">Zero (Nominal 41°C)</span>
              </div>
            </div>

            {/* Host & Port Socket */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Local Socket Endpoint</span>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-bold text-white font-mono">127.0.0.1:11434</p>
                <button
                  onClick={() => handleCopy("http://127.0.0.1:11434", "socket")}
                  className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                  title="Copy Socket Address"
                >
                  {copiedKey === "socket" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Status: Connected • 28.4 tokens/sec</span>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Response Latency</span>
                <span className="font-mono text-cyan-400">35ms TTFT</span>
              </div>
            </div>
          </div>

          {/* Privacy Boundary Locked Feature */}
          <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Air-Gap Privacy Boundary (Proprietary Data Protection)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Purchase orders, FOB price negotiations, and technical pack tolerances never leave this local physical node under any circumstances.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                HARDWARE_LOCKED
              </span>
              <div className="w-11 h-6 bg-emerald-500 rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Cloudflare Zero Trust & Tunnel Ingress */}
        <section className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cloudflare Zero Trust & Tunnel Ingress
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Healthy Ingress
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Encrypted tunnel connecting European customs and verified buyers directly to the factory Passport registry without public IP exposure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Tunnel Name */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Cloudflare Tunnel Name</span>
              <p className="text-xs font-mono font-bold text-white mt-1">ashulia-cluster-node-042</p>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Connector ID: 88f2-39c0</span>
            </div>

            {/* Public Hostname */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Public Hostname Route</span>
              <div className="flex items-center justify-between mt-1">
                <a
                  href="https://tunnel.bunon-rmg.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono font-bold text-cyan-400 hover:underline truncate"
                >
                  tunnel.bunon-rmg.com
                </a>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Protocols: HTTP/3 (QUIC)</span>
            </div>

            {/* Rate Limiting */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Rate Limiting Policy</span>
              <p className="text-xs font-bold text-slate-200 mt-1">60 req/min per buyer IP</p>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Token Bucket Active</span>
            </div>

            {/* SSL Termination */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">SSL Termination</span>
              <p className="text-xs font-bold text-slate-200 mt-1">Cloudflare Edge</p>
              <span className="text-[10px] text-indigo-300 font-mono mt-1 block">TLS 1.3 Strict • 256-bit</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: Evidence Vault (Cloudflare R2) */}
        <section className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/8">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Evidence Vault (Cloudflare R2 Object Storage)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Zero-Egress
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable storage for original lab tests, transaction certificates, and signed audit PDFs verified with SHA-256 Merkle root hashing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">R2 Target Bucket</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono font-bold text-white">bunon-evidence-vault</span>
                <button
                  onClick={() => handleCopy("bunon-evidence-vault", "r2bucket")}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedKey === "r2bucket" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Location: Western Europe / Frankfurt Edge</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Storage Class & Egress</span>
              <p className="text-xs font-bold text-white mt-1">Standard Zero-Egress</p>
              <p className="text-[11px] text-emerald-400 mt-1">0.00 USD egress fees across EU customs audits</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Cryptographic Encryption</span>
              <p className="text-xs font-bold text-white mt-1">AES-256-GCM / SHA-256</p>
              <p className="text-[11px] text-indigo-300 mt-1">Merkle root signed per shipment batch</p>
            </div>
          </div>
        </section>

        {/* SECTION 4: Automation & Webhook Gateway (n8n) */}
        <section className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Automation & Webhook Gateway (n8n Engine)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Listener
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orchestrates supplier chases via WhatsApp Business API, auto-downloads certificates, and feeds on-prem OCR.
                </p>
              </div>
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={handleTestWebhook}
              disabled={isTestingWebhook}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all border ${
                isTestingWebhook
                  ? "bg-amber-900/40 text-amber-300 border-amber-500/40 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/30 shadow-indigo-600/20"
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${isTestingWebhook ? "animate-bounce" : ""}`} />
              <span>{isTestingWebhook ? "Executing Webhook..." : "Test Webhook Trigger"}</span>
            </button>
          </div>

          {/* Webhook Response Toast */}
          {webhookTestResult && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 animate-fadeIn flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white">{webhookTestResult.message}</p>
                  <p className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
                    Triggered at {webhookTestResult.timestamp} • Latency: {webhookTestResult.latency}ms
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DISPATCH_SUCCESS
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Webhook URL */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Local Webhook Endpoint</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono font-bold text-white truncate">
                  http://localhost:5678/webhook/evidence-chase
                </span>
                <button
                  onClick={() => handleCopy("http://localhost:5678/webhook/evidence-chase", "webhookUrl")}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === "webhookUrl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Trigger: Certificate Discrepancy &gt; 48 hours</p>
            </div>

            {/* WhatsApp Business Gateway */}
            <div className="glass-card rounded-xl p-4 border border-white/6">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">WhatsApp Business Gateway</span>
              <p className="text-xs font-bold text-white mt-1">Meta Cloud API / Twilio Integration</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-400 font-mono">Gateway Number:</span>
                <span className="font-mono text-emerald-400 font-semibold">+880 1711-XXXXXX</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
