"use client";

import { t } from "@/lib/i18n";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Check,
  Minus,
  Cpu,
  Database,
} from "lucide-react";
import { useBunonStore } from "@/lib/store";
import type { SupplyChainTier, TierRenewal } from "@/lib/styles";
import type { IngestResponse } from "@/app/api/ingest/route";
import { CERTIFICATE_DOCUMENT_FIXTURES, type CertificateScenario } from "@/lib/fixtures/certificate-documents";
import { formatIsoDate, type TrafficLight, type VerificationCheck } from "@/lib/certificate-registry";
import { shortHash } from "@/lib/crypto";

interface DocumentIngestionEngineProps {
  isOpen: boolean;
  onClose: () => void;
  styleCode: string;
  tier: SupplyChainTier;
}

type DocumentSource = { kind: "scenario"; scenario: CertificateScenario } | { kind: "file"; file: File };

type InstallOutcome =
  | { kind: "installed"; certNumber: string; validThrough: string | null; light: TrafficLight }
  | { kind: "wrong-tier"; message: string }
  | { kind: "not-verified"; message: string };

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const SAMPLES: Array<{ scenario: CertificateScenario; label: string; description: string }> = [
  { scenario: "valid", label: "Sample 1", description: "Renewed scope certificate" },
  { scenario: "expired", label: "Sample 2", description: "Previous certificate" },
  { scenario: "tampered", label: "Sample 3", description: "Altered copy of the renewal" },
];

const LIGHT_UI: Record<TrafficLight, { word: string; note: string; Icon: typeof ShieldCheck; box: string; icon: string }> = {
  green: {
    word: "GREEN",
    note: "Fingerprint matches the issuer's sealed copy and the certificate is in force.",
    Icon: ShieldCheck,
    box: "bg-surface-2 border-line-strong text-ink",
    icon: "text-ink-muted",
  },
  amber: {
    word: "AMBER",
    note: "Verified from the document content only; the issuer has no sealed fingerprint on file. Confirm with the registry.",
    Icon: AlertTriangle,
    box: "bg-warning-soft border-brand text-ink",
    icon: "text-brand",
  },
  red: {
    word: "RED",
    note: "Rejected. The certificate cannot be used for this order.",
    Icon: AlertOctagon,
    box: "bg-danger-soft border-danger text-danger",
    icon: "text-danger",
  },
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CheckRow({ check }: { check: VerificationCheck }) {
  const state = check.pass === true ? "PASS" : check.pass === false ? "FAIL" : "N/A";
  const Icon = check.pass === true ? Check : check.pass === false ? X : Minus;
  const tone = check.pass === true ? "text-ink-muted" : check.pass === false ? "text-danger" : "text-ink-muted/80";
  return (
    <li className="flex items-start gap-2 py-1.5 border-b border-[var(--border-hairline)] last:border-b-0">
      <span className={`flex items-center gap-1 shrink-0 w-[52px] font-bold ${tone}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {state}
      </span>
      <span className="min-w-0">
        <span className="block text-ink">{check.label}</span>
        <span className="block text-ink-muted font-sans break-words">{check.detail}</span>
      </span>
    </li>
  );
}

export default function DocumentIngestionEngine({ isOpen, onClose, styleCode, tier }: DocumentIngestionEngineProps) {
  const installRenewal = useBunonStore((s) => s.installRenewal);

  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  const [source, setSource] = useState<DocumentSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<IngestResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<InstallOutcome | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Focus moves into the dialog on open and back to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isOpen]);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const isTierExpired = tier.status === "expired";

  const chooseSource = (next: DocumentSource) => {
    setSource(next);
    setResponse(null);
    setOutcome(null);
    setRequestError(null);
  };

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setSource(null);
      setResponse(null);
      setOutcome(null);
      setRequestError(`${file.name} is ${formatBytes(file.size)}; the limit is 15 MB.`);
      return;
    }
    chooseSource({ kind: "file", file });
  };

  /** Installs the renewal only when the API verified it AND it belongs to this exact tier. */
  const decideOutcome = (data: IngestResponse): InstallOutcome => {
    const entry = data.result.assessment.entry;
    const r = data.renewal;
    if (r && entry && entry.licensee === tier.facilityName && r.tierId === tier.id) {
      const renewal: TierRenewal = {
        certNumber: r.certNumber,
        certType: r.certType,
        validThrough: r.validThrough,
        documentSha256: r.documentSha256,
        ingestedAt: r.ingestedAt,
        engine: r.engine,
      };
      installRenewal(styleCode, tier.id, renewal);
      return { kind: "installed", certNumber: r.certNumber, validThrough: r.validThrough, light: data.result.assessment.light };
    }
    if (r && entry) {
      const why =
        entry.licensee !== tier.facilityName
          ? `${entry.certNumber} is registered to ${entry.licensee}, not to ${tier.facilityName}.`
          : `${entry.certNumber} is registered for a different supply-chain tier than Tier ${tier.tierNumber}.`;
      return {
        kind: "wrong-tier",
        message: `This certificate does not belong to this tier. ${why} Nothing on order ${styleCode} was changed.`,
      };
    }
    return {
      kind: "not-verified",
      message: `The certificate did not pass verification, so nothing on order ${styleCode} was changed. Tier ${tier.tierNumber} (${tier.facilityName}) remains ${tier.status}.`,
    };
  };

  const runIngestion = async () => {
    if (!source || loading) return;
    setLoading(true);
    setResponse(null);
    setOutcome(null);
    setRequestError(null);
    try {
      let res: Response;
      if (source.kind === "scenario") {
        res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario: source.scenario, styleCode }),
        });
      } else {
        const form = new FormData();
        form.append("file", source.file);
        form.append("styleCode", styleCode);
        res = await fetch("/api/ingest", { method: "POST", body: form });
      }
      const json: unknown = await res.json().catch(() => null);
      const body = json as (Partial<IngestResponse> & { error?: unknown }) | null;
      if (!res.ok || !body || body.success !== true || !body.result) {
        setRequestError(typeof body?.error === "string" ? body.error : `Ingestion failed (HTTP ${res.status}).`);
        return;
      }
      const data = body as IngestResponse;
      setResponse(data);
      setOutcome(decideOutcome(data));
    } catch {
      setRequestError("Network error: the ingestion service could not be reached.");
    } finally {
      setLoading(false);
    }
  };

  const result = response?.result ?? null;
  const light = result ? LIGHT_UI[result.assessment.light] : null;
  const extractionRows: Array<[string, string]> = result
    ? [
        ["Certificate number", result.extraction.certificateNumber],
        ["Issuer", result.extraction.issuer],
        ["Standard", result.extraction.standard],
        ["Licensee", result.extraction.licensee],
        ["Valid until", result.extraction.validUntil ? formatIsoDate(result.extraction.validUntil) : ""],
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop: a real button (pointer only; keyboard users have Escape and the close button). */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/85 backdrop-blur-sm cursor-default"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingestion-headline"
        aria-describedby="ingestion-target"
        tabIndex={-1}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="relative bg-surface/95 border border-brand rounded-[4px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 flex flex-col gap-6 shadow-[0_20px_60px_rgba(17,26,54,0.16)] backdrop-blur-xl text-ink outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="min-w-0">
            <h2 id="ingestion-headline" className="font-display text-2xl font-semibold text-ink">
              {t("Upload a renewed certificate")}
            </h2>
            <p id="ingestion-target" className="mt-1 text-sm text-ink-muted">
              {tier.facilityName} ·{" "}
              {isTierExpired
                ? `${t("current certificate expired")} ${formatIsoDate(tier.validThrough)}`
                : `${t("current certificate valid until")} ${formatIsoDate(tier.validThrough)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 hover:bg-canvas text-ink-muted hover:text-ink border border-[var(--border-hairline)] rounded-[3px] ${focusRing}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* File picker / drop zone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.json,.png,.jpg,.jpeg,application/pdf,text/plain,application/json,image/png,image/jpeg"
            onChange={(e) => {
              chooseFile(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              chooseFile(e.dataTransfer.files?.[0]);
            }}
            disabled={loading}
            aria-pressed={source?.kind === "file"}
            className={`w-full p-8 border-2 border-dashed rounded-[4px] text-center transition-colors space-y-2 backdrop-blur-md ${focusRing} ${
              source?.kind === "file"
                ? "border-brand bg-surface-2/70"
                : "border-[var(--border-hairline)] hover:border-brand bg-canvas/70"
            }`}
          >
            <Upload className="w-6 h-6 text-ink-muted mx-auto" aria-hidden="true" />
            <span className="block text-base font-semibold text-ink">{t("Drop the new certificate here")}</span>
            <span className="block text-sm text-ink-muted">{t("or click to choose a file (PDF or a photo)")}</span>
          </button>
        </div>

        {/* Sample documents */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted" id="sample-docs-label">
            {t("No file? Try a demo file:")}
          </span>
          <div role="group" aria-labelledby="sample-docs-label" className="flex flex-wrap gap-2">
            {SAMPLES.map((sample) => {
              const selected = source?.kind === "scenario" && source.scenario === sample.scenario;
              const label = { valid: "Valid renewal", expired: "Old, expired copy", tampered: "Altered copy" }[sample.scenario];
              return (
                <button
                  type="button"
                  key={sample.scenario}
                  onClick={() => chooseSource({ kind: "scenario", scenario: sample.scenario })}
                  disabled={loading}
                  aria-pressed={selected}
                  className={`min-h-[44px] rounded-[3px] border px-3 transition-colors ${focusRing} ${
                    selected ? "border-brand bg-brand-soft font-semibold text-brand" : "border-line text-ink hover:border-line-strong"
                  }`}
                >
                  {t(label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected document */}
        {source && !result && (
          <div className="p-4 rounded-[3px] bg-canvas/80 border border-[var(--border-hairline)] flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
              <span className="font-bold text-ink truncate">
                {source.kind === "file" ? source.file.name : CERTIFICATE_DOCUMENT_FIXTURES[source.scenario].fileName}
              </span>
            </span>
            <span className="text-ink-muted text-[11px] shrink-0 tabular-nums">
              {source.kind === "file" ? formatBytes(source.file.size) : "sample"}
            </span>
          </div>
        )}

        {/* Request error */}
        {requestError && (
          <div role="alert" className="p-3 rounded-[3px] bg-danger-soft border border-danger flex items-center gap-2 text-xs text-danger">
            <AlertOctagon className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
            <span>{requestError}</span>
          </div>
        )}

        {/* Screen-reader status for the async verification */}
        <p className="sr-only" aria-live="polite">
          {loading
            ? "Verifying certificate."
            : result && light
              ? `${light.word} light. ${result.assessment.headline} ${outcome && outcome.kind !== "installed" ? outcome.message : ""}`
              : ""}
        </p>

        {/* Real pipeline result */}
        {result && light && response && (
          <div className="flex flex-col gap-4 text-xs">
            {/* Traffic light + headline */}
            <div className={`p-4 rounded-[3px] border flex items-start gap-3 ${light.box}`}>
              <light.Icon className={`w-5 h-5 shrink-0 mt-0.5 ${light.icon}`} aria-hidden="true" />
              <div className="space-y-1">
                <div className="font-bold tracking-wider">{light.word} Light</div>
                <p className="font-sans text-ink">{result.assessment.headline}</p>
                <p className="font-sans text-[11px] opacity-90">{light.note}</p>
              </div>
            </div>

            {/* Document & engine */}
            <dl className="p-4 rounded-[3px] bg-canvas/80 border border-[var(--border-hairline)] grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-ink-muted">Document</dt>
              <dd className="text-ink truncate">
                {result.fileName} · <span className="tabular-nums">{formatBytes(result.sizeBytes)}</span>
              </dd>
</dl>
            <details className="text-xs">
              <summary className="cursor-pointer min-h-[44px] flex items-center font-sans font-semibold text-ink-muted">{t("Technical details")}</summary>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pt-1">
              <dt className="text-ink-muted">SHA-256</dt>
              <dd className="text-brand tabular-nums" title={result.documentSha256}>
                {shortHash(result.documentSha256, 14, 6)}
              </dd>
              <dt className="text-ink-muted">Extraction</dt>
              <dd className="text-ink">
                {result.engine === "ollama" ? `Local model ${result.model ?? "(unnamed)"}` : "Rules engine"}
                <span className="text-ink-muted tabular-nums"> · {result.timings.totalMs}&nbsp;ms</span>
              </dd>
              {result.engine === "ollama" && (
                <>
                  <dt className="text-ink-muted">Rules cross-check</dt>
                  <dd className="text-ink">
                    Certificate number {result.agreement.certificateNumber ? "agrees" : "differs"}, valid-until{" "}
                    {result.agreement.validUntil ? "agrees" : "differs"}
                  </dd>
                </>
              )}
                          </dl>
            </details>

            {/* Extracted fields */}
            <div className="p-4 rounded-[3px] bg-canvas/80 border border-[var(--border-hairline)]">
              <h3 className="text-[10px] text-ink-muted uppercase mb-2">Extracted fields</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                {extractionRows.map(([label, value]) => (
                  <React.Fragment key={label}>
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className={value ? "text-ink break-words" : "text-ink-muted italic"}>{value || "Not found"}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>

            {/* Checks */}
            <div className="p-4 rounded-[3px] bg-canvas/80 border border-[var(--border-hairline)]">
              <h3 className="text-[10px] text-ink-muted uppercase mb-1">Verification checks</h3>
              <ul className="list-none m-0 p-0">
                {result.assessment.checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <ul className="list-none m-0 p-3 rounded-[3px] bg-warning-soft border border-brand/60 space-y-1 text-ink">
                {result.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Ledger outcome */}
            <div className="p-3 rounded-[3px] bg-canvas/80 border border-[var(--border-hairline)] flex items-start gap-2">
              <Database className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
              {response.ledger.sealed ? (
                <span className="text-ink">
                  {t("Saved in the ledger as")} {response.ledger.block.id}.
                </span>
              ) : (
                <span className="text-danger">{t("Not saved in the ledger.")} {response.ledger.reason}</span>
              )}
            </div>

            {/* What happened to the tier */}
            {outcome?.kind === "installed" && (
              <div className="p-3 rounded-[3px] bg-surface-2 border border-line-strong flex items-start gap-2 text-ink">
                <CheckCircle2 className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                <span className="font-sans">
                  {t("Renewed.")} {outcome.certNumber} {t("is now on file for order")} {styleCode}
                  {outcome.validThrough ? `, ${t("valid through")} ${formatIsoDate(outcome.validThrough)}` : ""}.{" "}
                  {t("The buyer sees it straight away and can re-run their checks.")}{" "}
                  <a href={`/passport/${styleCode}`} className="font-semibold text-brand underline">
                    {t("Open the report")}
                  </a>
                  {outcome.light === "amber" ? " Confirm the certificate with the issuer registry before shipping." : ""}
                </span>
              </div>
            )}
            {outcome && outcome.kind !== "installed" && (
              <div className="p-3 rounded-[3px] bg-danger-soft border border-danger flex items-start gap-2 text-danger">
                <AlertOctagon className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
                <span className="font-sans">{outcome.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Primary action */}
        {outcome?.kind === "installed" ? (
          <button type="button" onClick={onClose} className={`btn-primary-verified w-full rounded-[4px] ${focusRing}`}>
            <span>Back to order {styleCode}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : source ? (
          <button
            type="button"
            onClick={runIngestion}
            disabled={loading}
            aria-busy={loading}
            className={`btn-primary-action w-full rounded-[4px] disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>Verifying certificate…</span>
              </>
            ) : (
              <>
                <span>{t("Check this certificate")}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        ) : null}
        {loading && (
          <p className="text-center font-sans text-xs text-ink-muted">
            {t("A local AI model is reading the document. This can take up to a minute; keep this window open.")}
          </p>
        )}
      </motion.div>
    </div>
  );
}
