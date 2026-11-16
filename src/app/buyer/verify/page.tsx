"use client";

import { t } from "@/lib/i18n";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Download,
  LogIn,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import MerkleTreeVisualizer from "@/components/merkle/MerkleTreeVisualizer";
import { getStyleData, listStyles, visibleOrders, type StyleData, type TierId } from "@/lib/styles";
import { useBunonStore, type SessionUser } from "@/lib/store";
import {
  buildProvenanceTree,
  orderedTiers,
  tierInclusionProof,
  verifyTierInclusion,
  type ProvenanceTree,
} from "@/lib/provenance";
import { useProvenanceTree } from "@/lib/use-provenance";
import { findCertificateByNumber, formatIsoDate } from "@/lib/certificate-registry";
import { shortHash } from "@/lib/crypto";
import { fetchLedger, postLedgerEvent } from "@/lib/ledger-client";

// ============================================================================ types

type CheckId = "merkle" | "registry" | "ledger" | "completeness";
type CheckState = "pending" | "running" | "passed" | "failed";

interface CheckOutcome {
  state: CheckState;
  summary: string;
  failures: string[];
}

interface LeafRecord {
  tierId: TierId;
  tierNumber: number;
  facilityName: string;
  certNumber: string;
  leafHash: string;
  inclusionVerified: boolean;
}

type LedgerRecord =
  | { kind: "idle" }
  | { kind: "posting" }
  | { kind: "sealed"; blockId: string; blockHash: string }
  | { kind: "error"; message: string }
  | { kind: "not-recorded"; role: SessionUser["role"] | null };

interface AuditRun {
  runId: number;
  /** Serialised style the run was computed for; results are only shown while it still matches. */
  styleKey: string;
  style: StyleData;
  phase: "running" | "done";
  checks: Record<CheckId, CheckOutcome>;
  root: string | null;
  leaves: LeafRecord[];
  cleared: boolean | null;
  generatedAt: string | null;
  record: LedgerRecord;
}

const CHECK_ORDER: CheckId[] = ["merkle", "registry", "ledger", "completeness"];

/** `title` reads as a plain sentence when the check passes, `failTitle` when it fails; the rest is for Technical details. */
const CHECK_META: Record<CheckId, { title: string; failTitle: string; standard: string; source: string }> = {
  merkle: {
    title: "Supplier records match",
    failTitle: "Supplier records do not match",
    standard: "SHA-256 leaf per tier → inclusion proof → root",
    source: "Recomputed in this browser (Web Crypto)",
  },
  registry: {
    title: "Certificates in date",
    failTitle: "Certificate problem found",
    standard: "Registered, not revoked, in force today",
    source: "Simulated issuer registry (demo)",
  },
  ledger: {
    title: "Activity record intact",
    failTitle: "Activity record problem",
    standard: "Every block hash recomputes and links to its parent",
    source: "Bunon ledger",
  },
  completeness: {
    title: "Report complete",
    failTitle: "Report incomplete",
    standard: "Product passport fields & tier certificate references",
    source: "Passport record",
  },
};

const STAGE_MS = 260;
const EXPECTED_TIERS = 5;

// ============================================================================ checks (pure)

function pending(): CheckOutcome {
  return { state: "pending", summary: "", failures: [] };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Local calendar date as YYYY-MM-DD (for ISO string comparison). */
function localIsoDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function styleKeyOf(style: StyleData | null): string {
  return style ? JSON.stringify(style) : "";
}

async function runMerkleCheck(style: StyleData): Promise<{ outcome: CheckOutcome; root: string | null; leaves: LeafRecord[] }> {
  try {
    const prov: ProvenanceTree = await buildProvenanceTree(style);
    const leaves: LeafRecord[] = [];
    for (const tier of orderedTiers(style)) {
      const proof = tierInclusionProof(prov, tier.id);
      const ok = await verifyTierInclusion(proof);
      leaves.push({
        tierId: tier.id,
        tierNumber: tier.tierNumber,
        facilityName: tier.facilityName,
        certNumber: tier.certNumber,
        leafHash: proof.leafHash,
        inclusionVerified: ok,
      });
    }
    const failures = leaves
      .filter((l) => !l.inclusionVerified)
      .map((l) => `${l.facilityName}: record does not match what was sealed`);
    if (leaves.length !== EXPECTED_TIERS) {
      failures.push(`Expected ${EXPECTED_TIERS} supplier records, found ${leaves.length}`);
    }
    const verified = leaves.filter((l) => l.inclusionVerified).length;
    return {
      outcome: {
        state: failures.length === 0 ? "passed" : "failed",
        summary: `${verified} of ${leaves.length} supplier records match their sealed fingerprint.`,
        failures,
      },
      root: prov.root,
      leaves,
    };
  } catch (err) {
    return {
      outcome: { state: "failed", summary: "The supplier records could not be checked in this browser.", failures: [errorMessage(err)] },
      root: null,
      leaves: [],
    };
  }
}

function runRegistryCheck(style: StyleData, today: string): CheckOutcome {
  const failures: string[] = [];
  const tiers = orderedTiers(style);
  for (const tier of tiers) {
    const reasons: string[] = [];
    const entry = findCertificateByNumber(tier.certNumber);
    if (!entry) {
      reasons.push(`certificate ${tier.certNumber || "(none)"} is not in the issuer registry`);
    } else {
      if (entry.status === "revoked") reasons.push(`${entry.certNumber} was revoked by ${entry.issuer}`);
      if (entry.validUntil !== null && entry.validUntil < today) {
        reasons.push(`${entry.certNumber} expired on ${formatIsoDate(entry.validUntil)}`);
      } else if (entry.status === "expired") {
        reasons.push(`${entry.certNumber} is listed as expired by ${entry.issuer}`);
      }
      if (entry.validFrom && entry.validFrom > today) {
        reasons.push(`${entry.certNumber} is not valid before ${formatIsoDate(entry.validFrom)}`);
      }
      const facility = tier.facilityName.toLowerCase();
      if (!entry.licenseeKey.every((token) => facility.includes(token))) {
        reasons.push(`${entry.certNumber} is registered to ${entry.licensee}`);
      }
    }
    if (tier.status === "expired") reasons.push("the supplier record marks this certificate as expired");
    if (reasons.length > 0) failures.push(`${tier.facilityName}: ${reasons.join("; ")}`);
  }
  const total = tiers.length;
  return {
    state: failures.length === 0 && total > 0 ? "passed" : "failed",
    summary:
      failures.length === 0
        ? `All ${total} supplier certificates are registered and in force on ${formatIsoDate(today)}.`
        : `${failures.length} of ${total} supplier certificates fail as of ${formatIsoDate(today)}.`,
    failures: total === 0 ? ["No supplier certificates on file"] : failures,
  };
}

async function runLedgerCheck(): Promise<CheckOutcome> {
  try {
    const snapshot = await fetchLedger();
    const v = snapshot.verification;
    if (!v) throw new Error("Ledger response did not include a chain verification.");
    const source = snapshot.source === "postgres" ? "PostgreSQL" : "In-memory demo store";
    if (v.ok) {
      return {
        state: "passed",
        summary: `${v.checked} ${v.checked === 1 ? "entry" : "entries"} checked: no entry has been altered. Source: ${source}.`,
        failures: [],
      };
    }
    return {
      state: "failed",
      summary: `Ledger altered${v.brokenAt !== null ? ` at block ${v.brokenAt}` : ""} (${v.checked} blocks checked). Source: ${source}.`,
      failures: [v.reason ?? "Chain verification failed."],
    };
  } catch (err) {
    return { state: "failed", summary: "The audit ledger could not be read.", failures: [errorMessage(err)] };
  }
}

const REQUIRED_FIELDS: { key: "fiberComposition" | "chemicalStandard" | "carbonFootprint" | "hsCode" | "passportId" | "importerEori"; label: string }[] = [
  { key: "fiberComposition", label: "fibre composition" },
  { key: "chemicalStandard", label: "chemical standard" },
  { key: "carbonFootprint", label: "carbon footprint" },
  { key: "hsCode", label: "HS code" },
  { key: "passportId", label: "passport ID" },
  { key: "importerEori", label: "importer EORI" },
];

function runCompletenessCheck(style: StyleData): CheckOutcome {
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = style[field.key];
    if (typeof value !== "string" || !value.trim()) missing.push(`Missing ${field.label}`);
  }
  const tiers = orderedTiers(style);
  if (tiers.length === 0) missing.push("No supplier records on file");
  for (const tier of tiers) {
    if (!tier.certNumber?.trim()) missing.push(`${tier.facilityName?.trim() || "A supplier"}: missing certificate number`);
    if (!tier.facilityName?.trim()) missing.push("A supplier record is missing its facility name");
  }
  const fieldCount = REQUIRED_FIELDS.length + tiers.length * 2;
  return {
    state: missing.length === 0 ? "passed" : "failed",
    summary:
      missing.length === 0
        ? `All ${fieldCount} required fields are present.`
        : `${missing.length} of ${fieldCount} required fields are missing.`,
    failures: missing,
  };
}

function ledgerSummary(style: StyleData, checks: Record<CheckId, CheckOutcome>, cleared: boolean): string {
  const names: Record<CheckId, string> = { merkle: "supplier records", registry: "certificates", ledger: "activity record", completeness: "report data" };
  const failed = (Object.keys(names) as CheckId[]).filter((id) => checks[id].state !== "passed");
  const text = cleared
    ? `Buyer checked ${style.code}: all four checks passed.`
    : `Buyer checked ${style.code}: on hold. Failed: ${failed.map((id) => `${names[id]} (${checks[id].summary})`).join("; ")}`;
  return text.length > 1990 ? `${text.slice(0, 1989)}…` : text;
}

function buildAttestation(run: AuditRun, session: SessionUser | null) {
  const s = run.style;
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "BuyerAuditAttestation"],
    issuer: {
      id: "urn:bunon:buyer-terminal",
      name: session ? `${session.fullName} (${session.organization})` : "Bunon buyer terminal (not signed in)",
    },
    issuanceDate: run.generatedAt,
    generatedAt: run.generatedAt,
    note:
      "UNSIGNED. This file carries no digital signature and is not a cryptographic proof of its own authenticity. " +
      "The Merkle root and leaf hashes can be re-derived independently: each leaf is SHA-256 over the tier's canonical JSON " +
      "(styleCode, tierId, tierNumber, facilityName, standard, certNumber, validThrough, material); parents are " +
      "SHA-256(left || right) over the 0x-hex strings, odd nodes paired with themselves.",
    credentialSubject: {
      id: `urn:bunon:passport:${s.code}`,
      styleCode: s.code,
      title: s.title,
      passportId: s.passportId,
      volume: s.volume,
      destinationPort: s.destination,
      hsTariffCode: s.hsCode,
      exporterBin: s.exporterBin,
      importerEori: s.importerEori,
      fiberComposition: s.fiberComposition,
      chemicalStandard: s.chemicalStandard,
      carbonFootprint: s.carbonFootprint,
      merkleRoot: run.root,
      leafHashes: run.leaves.map((l) => ({
        tierId: l.tierId,
        tierNumber: l.tierNumber,
        facilityName: l.facilityName,
        certNumber: l.certNumber,
        leafHash: l.leafHash,
        inclusionProofVerified: l.inclusionVerified,
      })),
      checks: CHECK_ORDER.map((id) => ({
        id,
        name: CHECK_META[id].title,
        result: run.checks[id].state === "passed" ? "pass" : "fail",
        summary: run.checks[id].summary,
        failures: run.checks[id].failures,
      })),
      clearanceStatus: run.cleared ? "CLEARED" : "HELD",
      ledgerRecord:
        run.record.kind === "sealed"
          ? { recorded: true, blockId: run.record.blockId, blockHash: run.record.blockHash }
          : { recorded: false },
    },
  };
}

// ============================================================================ UI bits

function StatusChip({ state }: { state: CheckState }) {
  const base = "inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border px-3 py-1 text-xs font-semibold";
  if (state === "passed") {
    return (
      <span className={`${base} border-line-strong bg-surface text-ink-muted`}>
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t("Passed")}</span>
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className={`${base} border-danger bg-danger-soft text-danger`}>
        <X className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t("Failed")}</span>
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className={`${base} border-brand bg-surface-2 text-brand`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <span>{t("Checking…")}</span>
      </span>
    );
  }
  return <span className={`${base} border-[var(--border-hairline)] text-ink-faint`}>{t("Waiting")}</span>;
}

// ============================================================================ page

export default function BuyerTerminalPage() {
  const activeBuyerStyleId = useBunonStore((s) => s.activeBuyerStyleId);
  const setActiveBuyerStyleId = useBunonStore((s) => s.setActiveBuyerStyleId);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);

  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const allStyles = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  const selectedCode = activeBuyerStyleId;
  const currentStyle = getStyleData(selectedCode, customStyles, renewals);
  // The buyer first picks the supplier factory (tier 0), then one of that factory's orders.
  const factoryOf = (s: StyleData) => s.tiers.find((tier) => tier.tierNumber === 0)?.facilityName ?? "Unknown factory";
  const factories = [...new Set(allStyles.map(factoryOf))];
  const [factory, setFactory] = useState<string | null>(null);
  const factoryStyles = factory ? allStyles.filter((s) => factoryOf(s) === factory) : [];
  const styleInFactory = !!currentStyle && !!factory && factoryOf(currentStyle) === factory;
  const currentKey = styleKeyOf(currentStyle);
  const [renewAsk, setRenewAsk] = useState<{ code: string; state: "sending" | "sent" | "error" } | null>(null);

  // Records a buyer request in the ledger; the factory sees it under Recent activity on its dashboard.
  const askFactoryToRenew = async () => {
    if (!currentStyle) return;
    const code = currentStyle.code;
    const expired = currentStyle.tiers.filter((tier) => tier.status === "expired");
    setRenewAsk({ code, state: "sending" });
    const res = await postLedgerEvent({
      type: "BUYER QUERY",
      status: "flagged",
      styleCode: code,
      payloadHash: null,
      summary: `Buyer asked ${factoryOf(currentStyle)} to renew ${expired.map((tier) => `${tier.certType} ${tier.certNumber} (${tier.facilityName})`).join(", ") || "its expired certificates"} for order ${code}.`,
    });
    setRenewAsk({ code, state: res.ok ? "sent" : "error" });
  };

  // Live tree for the visualiser (independent of the verification run).
  const liveTree = useProvenanceTree(currentStyle);
  const liveTreeMatches =
    !!liveTree &&
    !!currentStyle &&
    liveTree.styleCode === currentStyle.code &&
    liveTree.expiredTierIds.join(",") ===
      orderedTiers(currentStyle)
        .filter((tier) => tier.status === "expired")
        .map((tier) => tier.id)
        .join(",");
  const visualTree = liveTreeMatches ? liveTree : null;

  const [auditRun, setAuditRun] = useState<AuditRun | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<TierId | null>(null);
  const [downloadedProof, setDownloadedProof] = useState(false);

  // Only show results that were computed for exactly the style on screen.
  const run = auditRun && auditRun.styleKey === currentKey ? auditRun : null;
  const isVerifying = run?.phase === "running";
  const verificationDone = run?.phase === "done";

  const effectiveTierId: TierId | null =
    selectedTierId ?? currentStyle?.tiers.find((tier) => tier.status === "expired")?.id ?? null;

  // --- run bookkeeping: every run gets an id; switching style or unmounting invalidates it.
  const runIdRef = useRef(0);
  const stageTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const uiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingRun = () => {
    runIdRef.current += 1;
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current.clear();
  };

  useEffect(() => {
    const timers = stageTimers.current;
    return () => {
      runIdRef.current += 1;
      timers.forEach(clearTimeout);
      timers.clear();
      if (uiTimer.current) clearTimeout(uiTimer.current);
    };
  }, []);

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        stageTimers.current.delete(timer);
        resolve();
      }, ms);
      stageTimers.current.add(timer);
    });

  const handleSelectFactory = (name: string) => {
    setFactory(name);
    const first = allStyles.find((s) => factoryOf(s) === name);
    if (first) handleSelectStyle(first.code);
  };

  // Deep links: /buyer/verify?factory=<name> (dashboard) or ?order=<code> (a product report),
  // which pre-selects both the factory and that order.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("factory");
    const order = allStyles.find((s) => s.code === params.get("order")?.toUpperCase());
    if (order) {
      setFactory(factoryOf(order));
      handleSelectStyle(order.code);
    } else if (wanted && factories.includes(wanted)) handleSelectFactory(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectStyle = (code: string) => {
    cancelPendingRun();
    setActiveBuyerStyleId(code);
    setAuditRun(null);
    setSelectedTierId(null);
    setDownloadedProof(false);
  };

  const handleVerify = async () => {
    const style = currentStyle;
    if (!style) return;
    cancelPendingRun();
    const runId = runIdRef.current;
    const isCurrent = () => runIdRef.current === runId;
    const update = (patch: (r: AuditRun) => Partial<AuditRun>) =>
      setAuditRun((prev) => (prev && prev.runId === runId ? { ...prev, ...patch(prev) } : prev));
    const setCheck = (id: CheckId, outcome: CheckOutcome) =>
      update((r) => ({ checks: { ...r.checks, [id]: outcome } }));

    setDownloadedProof(false);
    setAuditRun({
      runId,
      styleKey: styleKeyOf(style),
      style,
      phase: "running",
      checks: { merkle: pending(), registry: pending(), ledger: pending(), completeness: pending() },
      root: null,
      leaves: [],
      cleared: null,
      generatedAt: null,
      record: { kind: "idle" },
    });

    const running: CheckOutcome = { state: "running", summary: "", failures: [] };

    // 1. Merkle inclusion
    setCheck("merkle", running);
    const [merkle] = await Promise.all([runMerkleCheck(style), wait(STAGE_MS)]);
    if (!isCurrent()) return;
    update(() => ({ root: merkle.root, leaves: merkle.leaves }));
    setCheck("merkle", merkle.outcome);

    // 2. Certificate registry & validity
    setCheck("registry", running);
    const registry = runRegistryCheck(style, localIsoDate());
    await wait(STAGE_MS);
    if (!isCurrent()) return;
    setCheck("registry", registry);

    // 3. Ledger integrity
    setCheck("ledger", running);
    const [ledger] = await Promise.all([runLedgerCheck(), wait(STAGE_MS)]);
    if (!isCurrent()) return;
    setCheck("ledger", ledger);

    // 4. Data completeness
    setCheck("completeness", running);
    const completeness = runCompletenessCheck(style);
    await wait(STAGE_MS);
    if (!isCurrent()) return;
    setCheck("completeness", completeness);

    const checks: Record<CheckId, CheckOutcome> = {
      merkle: merkle.outcome,
      registry,
      ledger,
      completeness,
    };
    const cleared = CHECK_ORDER.every((id) => checks[id].state === "passed");
    const generatedAt = new Date().toISOString();
    const session = useBunonStore.getState().session;
    const isBuyer = session?.role === "buyer";

    update(() => ({
      phase: "done",
      cleared,
      generatedAt,
      record: isBuyer ? { kind: "posting" } : { kind: "not-recorded", role: session?.role ?? null },
    }));


    if (!isBuyer) return;
    const result = await postLedgerEvent({
      type: "BUYER AUDIT VERIFICATION",
      status: cleared ? "verified" : "flagged",
      styleCode: style.code,
      payloadHash: merkle.root,
      summary: ledgerSummary(style, checks, cleared),
    });
    if (!isCurrent()) return;
    update(() => ({
      record: result.ok
        ? { kind: "sealed", blockId: result.block.id, blockHash: result.block.hash }
        : { kind: "error", message: result.error },
    }));
  };

  const handleDownloadAttestationJson = () => {
    if (!run || run.phase !== "done") return;
    const attestation = buildAttestation(run, useBunonStore.getState().session);
    const blob = new Blob([JSON.stringify(attestation, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bunon-buyer-audit-${run.style.code}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedProof(true);
    if (uiTimer.current) clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setDownloadedProof(false), 2500);
  };

  const passedCount = run ? CHECK_ORDER.filter((id) => run.checks[id].state === "passed").length : 0;
  const orderChosen = !!factory && styleInFactory;
  const renewState = renewAsk && currentStyle && renewAsk.code === currentStyle.code ? renewAsk.state : null;
  const reportHref = `/passport/${encodeURIComponent(run?.style.code ?? currentStyle?.code ?? "")}`;
  const quietButton =
    "btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] px-4 text-sm font-semibold";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 flex flex-col gap-8 pt-10">
        <Link href="/buyer" className="-mb-4 inline-flex min-h-[44px] w-fit items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("Back to dashboard")}
        </Link>

        {/* Title, one line of context, then the choices */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="display-title font-bold tracking-tight text-ink">{t("Verify a supplier")}</h1>
            <DemoDataBadge />
          </div>
          <p className="text-base text-ink-muted leading-relaxed max-w-[55ch]">
            {t("Pick the factory and the order. Bunon checks every supplier certificate for you.")}
          </p>
        </header>

        <div className="glass-card p-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="buyer-factory" className="text-sm font-semibold text-ink">
              {t("Choose the factory")}
            </label>
            <select
              id="buyer-factory"
              value={factory ?? ""}
              onChange={(e) => e.target.value && handleSelectFactory(e.target.value)}
              className="min-h-[44px] rounded-[4px] border border-field bg-surface px-3 text-base text-ink"
            >
              <option value="" disabled>
                {t("Select a factory…")}
              </option>
              {factories.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          {factory && (
            <div className="flex flex-col gap-2">
              <label htmlFor="buyer-order" className="text-sm font-semibold text-ink">
                {t("Choose the order")}
              </label>
              <select
                id="buyer-order"
                value={styleInFactory && currentStyle ? currentStyle.code : ""}
                onChange={(e) => handleSelectStyle(e.target.value)}
                className="min-h-[44px] rounded-[4px] border border-field bg-surface px-3 text-base text-ink"
              >
                {factoryStyles.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.title} (#{st.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* The one primary action until the checks have run */}
        {orderChosen && !verificationDone && (
          <div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              aria-busy={isVerifying}
              className="btn-primary-action w-full sm:w-auto rounded-[4px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  <span>{t("Running 4 checks…")}</span>
                </>
              ) : (
                <>
                  <span>{t("Run the 4 checks")}</span>
                  <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Result with one clear next step */}
        <div aria-live="polite">
          {orderChosen && verificationDone && run && (
            <section
              className={`p-5 sm:p-6 rounded-[4px] border flex flex-col gap-4 ${
                run.cleared ? "bg-surface/80 border-line-strong" : "bg-danger-soft/90 border-danger"
              }`}
            >
              <div className="flex items-start gap-3">
                {run.cleared ? (
                  <ShieldCheck className="w-6 h-6 text-ink-muted shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-danger shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0 space-y-1">
                  <h2 className={`font-display text-xl font-semibold ${run.cleared ? "text-ink" : "text-danger"}`}>
                    {run.cleared ? t("Cleared") : t("On hold")}{" "}
                    <span className="font-mono text-base tabular-nums">#{run.style.code}</span>
                  </h2>
                  <p className="text-sm text-ink max-w-[60ch]">
                    {run.cleared
                      ? t("All four checks passed. Nothing on file blocks this order; open the product report for the evidence behind it.")
                      : t("Do not confirm this order yet. Ask the factory to fix the problem below, then run the checks again.")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {run.cleared ? (
                  <Link href={reportHref} className="btn-primary-action rounded-[4px]">
                    <span>{t("Open product report")}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : renewState === "sent" ? (
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink" role="status">
                    <Check className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                    <strong>{t("Request sent")}</strong>
                    <span className="text-ink-muted">{t("The factory sees this on its dashboard.")}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void askFactoryToRenew()}
                    disabled={renewState === "sending"}
                    aria-busy={renewState === "sending"}
                    className="btn-primary-action rounded-[4px] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {renewState === "sending" ? t("Sending…") : t("Ask the factory to renew")}
                  </button>
                )}
                {!run.cleared && (
                  <Link href={reportHref} className={quietButton}>
                    {t("Open product report")}
                  </Link>
                )}
                <button type="button" onClick={handleVerify} className={quietButton}>
                  <RotateCcw className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                  <span>{t("Run again")}</span>
                </button>
              </div>
              {renewState === "error" && (
                <p role="alert" className="text-sm text-danger">
                  {t("Could not send the request. Try again.")}
                </p>
              )}

              {/* Whether this check was saved in the ledger */}
              <div className="flex flex-wrap items-center gap-x-1.5 border-t border-[var(--border-hairline)] pt-3 text-sm text-ink-muted">
                {run.record.kind === "posting" && (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span>{t("Saving the result to the ledger…")}</span>
                  </>
                )}
                {run.record.kind === "sealed" && (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t("Saved in the ledger.")}</span>
                    <Link href="/ledger" className="inline-flex min-h-[44px] items-center font-semibold text-ink underline">
                      {t("View ledger")}
                    </Link>
                  </>
                )}
                {run.record.kind === "error" && (
                  <>
                    <X className="w-3.5 h-3.5 text-danger" aria-hidden="true" />
                    <span className="text-danger">{t("Not saved in the ledger.")}</span>
                    <button type="button" onClick={handleVerify} className="inline-flex min-h-[44px] items-center font-semibold text-ink underline">
                      {t("Try again")}
                    </button>
                  </>
                )}
                {run.record.kind === "not-recorded" && (
                  <>
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {t("Not saved in the ledger.")} {t("Only buyer accounts save their checks.")}
                    </span>
                    <Link href="/login" className="inline-flex min-h-[44px] items-center font-semibold text-ink underline">
                      {t("Sign in as buyer")}
                    </Link>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {/* The four checks, as plain sentences; shown while they run */}
        {orderChosen && run && (
          <section aria-labelledby="checks-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="checks-heading" className="section-index text-xs">
                {t("The four checks")}
              </h2>
              {verificationDone && (
                <span className="text-xs text-ink-muted tabular-nums">
                  {passedCount}/4 {t("passed")}
                </span>
              )}
            </div>
            <ol className="glass-card divide-y divide-[var(--border-hairline)] overflow-hidden">
              {CHECK_ORDER.map((id) => {
                const meta = CHECK_META[id];
                const outcome = run.checks[id];
                const failed = outcome.state === "failed";
                const lines = !failed
                  ? []
                  : id === "ledger"
                    ? [t("The activity record has been changed or could not be read.")]
                    : outcome.failures;
                return (
                  <li key={id} className="flex items-start justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0 space-y-1">
                      <h3 className={`text-base font-semibold ${failed ? "text-danger" : "text-ink"}`}>
                        {t(failed ? meta.failTitle : meta.title)}
                      </h3>
                      {lines.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-4 text-sm text-danger">
                          {lines.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <StatusChip state={outcome.state} />
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Everything an auditor might want, folded away */}
        {orderChosen && verificationDone && run && (
          <details className="glass-card p-4">
            <summary className="cursor-pointer min-h-[44px] flex items-center text-sm font-semibold text-ink-muted">
              {t("Technical details")}
            </summary>
            <div className="flex flex-col gap-6 pt-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-[auto_1fr]">
                {CHECK_ORDER.map((id) => (
                  <React.Fragment key={id}>
                    <dt className="font-semibold text-ink">{t(CHECK_META[id].title)}</dt>
                    <dd className="space-y-0.5 text-ink-muted">
                      <p>{run.checks[id].summary}</p>
                      <p>
                        {CHECK_META[id].standard} · {CHECK_META[id].source}
                      </p>
                      {id === "ledger" &&
                        run.checks.ledger.failures.map((f, i) => (
                          <p key={i} className="text-danger">
                            {f}
                          </p>
                        ))}
                    </dd>
                  </React.Fragment>
                ))}
                {run.root && (
                  <>
                    <dt className="font-semibold text-ink">{t("Merkle root")}</dt>
                    <dd className="font-mono text-ink-muted tabular-nums">{shortHash(run.root)}</dd>
                  </>
                )}
                {run.record.kind === "sealed" && (
                  <>
                    <dt className="font-semibold text-ink">{t("Ledger entry")}</dt>
                    <dd className="font-mono text-ink-muted">{run.record.blockId}</dd>
                  </>
                )}
                {run.record.kind === "error" && (
                  <>
                    <dt className="font-semibold text-ink">{t("Ledger error")}</dt>
                    <dd className="text-danger">{run.record.message}</dd>
                  </>
                )}
              </dl>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                  <h3 className="text-sm font-semibold text-ink">{t("Supplier record proof (Merkle tree)")}</h3>
                  <span className="text-xs text-ink-muted">{t("Select a supplier to inspect")}</span>
                </div>
                {currentStyle && (
                  <MerkleTreeVisualizer
                    tree={visualTree}
                    tiers={currentStyle.tiers}
                    selectedTierId={effectiveTierId}
                    onSelectTier={(id) => setSelectedTierId(id)}
                  />
                )}
              </div>

              <div>
                <button type="button" onClick={handleDownloadAttestationJson} className={quietButton}>
                  <Download className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                  <span>{downloadedProof ? t("Downloaded") : t("Download check results (.json, unsigned)")}</span>
                </button>
              </div>
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
