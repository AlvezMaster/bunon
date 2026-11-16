"use client";

import { t } from "@/lib/i18n";
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import ProductSwitcher from "@/components/ProductSwitcher";
import { getStyleData, normalizeStyleCode, styleClearance, visibleOrders, DEFAULT_STYLE_CODE } from "@/lib/styles";
import { useBunonStore } from "@/lib/store";
import { useProvenanceTree } from "@/lib/use-provenance";
import { shortHash } from "@/lib/crypto";
import { formatIsoDate } from "@/lib/certificate-registry";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Lock,
  Printer,
  QrCode,
  SearchX,
  ShieldCheck,
} from "lucide-react";

// --- store hydration (persisted state is restored right after mount by <StoreHydrator />) ---
const subscribeHydration = (onChange: () => void) => useBunonStore.persist.onFinishHydration(() => onChange());
const getHydrated = () => useBunonStore.persist.hasHydrated();
const getServerHydrated = () => false;

// --- window origin for the QR link (empty on the server and during hydration) ---
const subscribeNoop = () => () => undefined;
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

function decodeStyleParam(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return DEFAULT_STYLE_CODE;
  try {
    return normalizeStyleCode(decodeURIComponent(value)) || DEFAULT_STYLE_CODE;
  } catch {
    return normalizeStyleCode(value) || DEFAULT_STYLE_CODE;
  }
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans pb-24">
      <div className="no-print">
        <Navbar />
      </div>
      {children}
    </div>
  );
}

export default function DigitalProductPassportPage() {
  const params = useParams<{ styleCode: string }>();
  const styleCode = decodeStyleParam(params?.styleCode);

  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);
  const origin = useSyncExternalStore(subscribeNoop, getOrigin, getServerOrigin);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);

  // Custom orders and renewals live in the persisted store, so resolve only once it has hydrated.
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const setActiveSupplierStyleId = useBunonStore((s) => s.setActiveSupplierStyleId);
  const found = hydrated ? getStyleData(styleCode, customStyles, renewals) : null;
  // Factories only see their own products; buyers see every supplier's.
  const style = found ? (visibleOrders([found], session, visibleCodes)[0] ?? null) : null;
  const liveTree = useProvenanceTree(style);
  const tree = liveTree && style && liveTree.styleCode === style.code ? liveTree : null;

  const [copiedHash, setCopiedHash] = useState<"idle" | "copied" | "failed">("idle");
  const [copiedLink, setCopiedLink] = useState<"idle" | "copied" | "failed">("idle");
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const flash = (setter: (v: "idle" | "copied" | "failed") => void, value: "copied" | "failed") => {
    setter(value);
    const t = setTimeout(() => {
      timers.current.delete(t);
      setter("idle");
    }, 2000);
    timers.current.add(t);
  };

  const copyText = async (text: string, setter: (v: "idle" | "copied" | "failed") => void) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(setter, "copied");
    } catch {
      flash(setter, "failed");
    }
  };

  // ------------------------------------------------------------------ loading (pre-hydration)
  if (!hydrated) {
    return (
      <PageShell>
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col gap-8 pt-10" aria-busy="true">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
            <span className="section-index text-xs">{t("Product report")}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted" role="status" aria-live="polite">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>{t("Loading report…")}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card h-[120px]" />
            ))}
          </div>
        </main>
      </PageShell>
    );
  }

  // ------------------------------------------------------------------ unknown style: never fabricate
  if (!style) {
    return (
      <PageShell>
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col gap-8 pt-10">
          <section className="flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <span className="section-index text-xs">{t("Product report")}</span>
              <DemoDataBadge />
            </div>
            <div className="space-y-3 max-w-4xl">
              <h1 className="display-title font-bold tracking-tight text-ink flex items-center gap-3">
                <SearchX className="w-8 h-8 shrink-0 text-danger" aria-hidden="true" />
                {t("Report not found.")}
              </h1>
              <p className="text-base text-ink-muted leading-relaxed max-w-[60ch]">
                {t("There is no report for order")} <strong className="font-mono text-ink">“{styleCode}”</strong>.{" "}
                {t("Bunon only shows reports for orders on file and never makes one up.")}
              </p>
              <p className="text-sm text-ink-faint leading-relaxed max-w-[60ch]">
                {t("Orders a factory adds in this demo are stored in that browser only, and factories only see their own products. Check the code, or pick a product from the reports list.")}
              </p>
            </div>
            <div>
              <Link href="/reports" className="btn-primary-action rounded-[4px]">
                <span>{t("Browse all reports")}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </main>
      </PageShell>
    );
  }

  // ------------------------------------------------------------------ passport
  const clearance = styleClearance(style);
  const conflictFacilities = clearance.expiredTiers.map((tier) => tier.facilityName).join(", ");
  const statusText = clearance.cleared ? "Cleared" : `Held: certificate conflict at ${conflictFacilities}`;
  const passportUrl = origin ? `${origin}/passport/${encodeURIComponent(style.code)}` : "";
  const generatedOn = new Date().toLocaleDateString("en-GB");
  // The one next step: fix the hold when someone signed in can, otherwise print the report.
  const fixIsPrimary = !clearance.cleared && !!session;
  const nextStep = session
    ? {
        href: session.role === "factory" ? "/factory/order" : `/buyer/verify?order=${encodeURIComponent(style.code)}`,
        label: session.role === "factory" ? "Upload the renewed certificate" : "Run the checks on this order",
      }
    : null;

  return (
    <PageShell>
      {/* PRINT-ONLY PASSPORT SUMMARY */}
      <div className="hidden print:block p-8 font-mono text-black bg-white border-4 border-black space-y-6">
        {/* Header Strip */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-600 font-bold">
              Bunon compliance platform · exporter-prepared document
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Product passport summary (draft fields)</h1>
            <p className="text-xs text-gray-700 mt-0.5">
              Supply-chain certificate status · QR data carrier (iso/iec 18004)
            </p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <div>
              <strong>Passport ID:</strong> {style.passportId}
            </div>
            <div>
              <strong>Status:</strong> {statusText.toUpperCase()}
            </div>
            <div>
              <strong>Generated:</strong> {generatedOn}
            </div>
          </div>
        </div>

        {/* QR Code and Key Identifiers Grid */}
        <div className="grid grid-cols-12 gap-6 items-center border-b-2 border-black pb-6">
          <div className="col-span-3 flex flex-col items-center justify-center p-3 border border-black bg-white">
            {passportUrl ? (
              <QRCodeSVG value={passportUrl} size={135} level="H" fgColor="#000000" bgColor="#ffffff" />
            ) : (
              <div className="w-[135px] h-[135px]" />
            )}
            <span className="text-[9px] font-bold mt-1 text-center">Scan to open passport</span>
          </div>

          <div className="col-span-9 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Style code & title:</span>
              <p className="font-bold">
                #{style.code} — {style.title}
              </p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Harmonized tariff (HS) code:</span>
              <p className="font-bold">{style.hsCode}</p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Exporter BIN:</span>
              <p className="font-bold">{style.exporterBin}</p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Importer EORI:</span>
              <p className="font-bold">{style.importerEori}</p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Shipment volume:</span>
              <p className="font-bold">
                {style.volume} ({style.garmentType})
              </p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Buyer & purchase order:</span>
              <p className="font-bold">
                {style.buyer} // {style.purchaseOrder}
              </p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Port of lading:</span>
              <p className="font-bold">{style.portOfLading}</p>
            </div>
            <div>
              <span className="text-gray-600 uppercase text-[10px]">Point of entry:</span>
              <p className="font-bold">
                {style.destination} [{style.portOfEntryCode}]
              </p>
            </div>
          </div>
        </div>

        {/* Technical Material & Environmental Declarations */}
        <div className="grid grid-cols-3 gap-4 border-b-2 border-black pb-4 text-xs">
          <div>
            <span className="text-gray-600 uppercase text-[10px]">Fiber composition:</span>
            <p className="font-bold">{style.fiberComposition}</p>
            <p className="text-xs text-gray-700">{style.fiberStandard}</p>
          </div>
          <div>
            <span className="text-gray-600 uppercase text-[10px]">Chemical safety (MRSL):</span>
            <p className="font-bold">{style.chemicalSafety}</p>
            <p className="text-xs text-gray-700">{style.chemicalStandard}</p>
          </div>
          <div>
            <span className="text-gray-600 uppercase text-[10px]">Carbon intensity:</span>
            <p className="font-bold">{style.carbonFootprint} per unit</p>
            <p className="text-xs text-gray-700">{style.carbonBaselineReduction}</p>
          </div>
        </div>

        {/* Merkle root & status stamp */}
        <div className="pt-2 flex justify-between items-end text-xs">
          <div className="space-y-1 max-w-[420px]">
            <span className="text-gray-600 uppercase text-[10px]">Supply-chain Merkle root (SHA-256):</span>
            <p className="text-xs break-all bg-gray-100 p-2 border border-gray-400">
              {tree ? tree.root : "computing…"}
            </p>
            <p className="text-[9px] text-gray-600">
              Root of a SHA-256 Merkle tree over the {style.tiers.length} supplier-tier certificate records, recomputed
              in the browser that printed this page. Unsigned.
            </p>
          </div>

          <div className="border-2 border-black p-4 text-center min-w-[200px] max-w-[260px]">
            <div className="text-[10px] font-bold uppercase">Certificate status</div>
            {clearance.cleared ? (
              <>
                <div className="text-xs font-black text-green-800 my-1">[Cleared]</div>
                <div className="text-[9px] text-gray-600">No expired supplier certificates on file</div>
              </>
            ) : (
              <>
                <div className="text-xs font-black text-red-800 my-1">[Held — certificate conflict]</div>
                <div className="text-[9px] text-gray-700">AT {conflictFacilities.toUpperCase()}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SCREEN UI */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col gap-12 pt-10">
        <section className="flex flex-col gap-8">
          <ProductSwitcher current={style.code} />
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
            <span className="section-index text-xs">{t("Product report")}</span>
            <DemoDataBadge />
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="display-title font-bold tracking-tight text-ink">{style.title}</h1>
            <p className="text-base text-ink-muted leading-relaxed max-w-[60ch]">
              {t("Order")} #{style.code} · {t("shipping to")} {style.destination}
            </p>
          </div>

          {/* Clearance status, derived from the tier certificate records */}
          {clearance.cleared ? (
            <div className="p-4 rounded-[4px] bg-surface/80 border border-line-strong flex items-start gap-3" role="status">
              <ShieldCheck className="w-5 h-5 text-ink-muted shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <div className="font-display font-semibold text-ink text-lg">{t("Cleared")}</div>
                <p className="text-sm text-ink-muted">{t("None of the supplier certificates on file is marked expired.")}</p>
                {session?.role === "buyer" && nextStep && (
                  <Link
                    href={nextStep.href}
                    className="no-print inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink underline"
                  >
                    {t(nextStep.label)}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] bg-danger-soft/90 border border-danger flex items-start gap-3" role="status">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
              <div className="space-y-2">
                <div className="font-display font-semibold text-danger text-lg">{t("On hold")}</div>
                <ul className="text-sm text-danger space-y-0.5">
                  {clearance.expiredTiers.map((tier) => (
                    <li key={tier.id}>
                      {tier.facilityName}: {tier.certType} <span className="font-mono">{tier.certNumber}</span> {t("expired")}
                      {tier.validThrough ? (
                        <>
                          {" "}
                          ({t("valid through")} <span className="font-mono">{formatIsoDate(tier.validThrough)}</span>)
                        </>
                      ) : null}
                      .
                    </li>
                  ))}
                </ul>
                {nextStep && (
                  <Link
                    href={nextStep.href}
                    onClick={() => session?.role === "factory" && setActiveSupplierStyleId(style.code)}
                    className="no-print btn-primary-action rounded-[4px]"
                  >
                    <span>{t(nextStep.label)}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* What the product is made of */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass-card p-6 flex flex-col gap-1">
              <dt className="text-sm text-ink-muted">{t("Fibre composition")}</dt>
              <dd className="text-3xl font-bold font-display text-ink">{style.fiberComposition.split(",")[0]}</dd>
              <dd className="text-xs text-ink-muted">{style.fiberStandard}</dd>
            </div>
            <div className="glass-card p-6 flex flex-col gap-1">
              <dt className="text-sm text-ink-muted">{t("Chemical safety")}</dt>
              <dd className="text-3xl font-bold font-display text-ink">{style.chemicalSafety}</dd>
              <dd className="text-xs text-ink-muted">{style.chemicalStandard}</dd>
            </div>
            <div className="glass-card p-6 flex flex-col gap-1">
              <dt className="text-sm text-ink-muted">{t("Carbon footprint")}</dt>
              <dd className="text-3xl font-bold font-display text-ink tabular-nums">{style.carbonFootprint}</dd>
              <dd className="text-xs text-ink-muted">{style.carbonBaselineReduction}</dd>
            </div>
          </dl>

          {/* Print and share */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className={
                fixIsPrimary
                  ? "btn-tactile-hollow min-h-[44px] px-5 text-sm font-semibold flex items-center justify-center gap-2 rounded-[4px]"
                  : "btn-primary-action rounded-[4px]"
              }
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>{t("Print report summary")}</span>
            </button>

            <button
              type="button"
              onClick={() => passportUrl && copyText(passportUrl, setCopiedLink)}
              disabled={!passportUrl}
              className="btn-tactile-hollow min-h-[44px] px-5 text-sm font-semibold flex items-center justify-center gap-2 rounded-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedLink === "copied" ? (
                <Check className="w-4 h-4 text-ink-muted" aria-hidden="true" />
              ) : (
                <QrCode className="w-4 h-4" aria-hidden="true" />
              )}
              <span aria-live="polite">
                {copiedLink === "copied" ? t("Copied report link") : copiedLink === "failed" ? t("Copy failed") : t("Copy report link")}
              </span>
            </button>
          </div>
          <details className="no-print text-xs">
            <summary className="cursor-pointer min-h-[44px] inline-flex items-center text-sm font-semibold text-ink-muted">
              {t("Technical details")}
            </summary>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <span className="text-ink-faint">Supply-chain Merkle root (SHA-256):</span>
              <span className="font-mono text-ink font-bold tabular-nums break-all" aria-live="polite">
                {tree ? shortHash(tree.root, 18, 8) : "computing…"}
              </span>
            <button
              type="button"
              onClick={() => tree && copyText(tree.root, setCopiedHash)}
              disabled={!tree}
              className="btn-tactile-hollow min-h-[44px] px-4 text-xs flex items-center justify-center gap-2 rounded-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedHash === "copied" ? (
                <Check className="w-4 h-4 text-ink-muted" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
              <span aria-live="polite">
                {!tree
                  ? "Merkle root computing…"
                  : copiedHash === "copied"
                    ? "Copied Merkle root"
                    : copiedHash === "failed"
                      ? "Copy failed"
                      : "Copy Merkle root"}
              </span>
            </button>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-ink-muted">
              <dt>HS code</dt>
              <dd className="font-mono text-ink">{style.hsCode}</dd>
              <dt>Destination</dt>
              <dd className="text-ink">{style.destination}</dd>
              <dt>Passport ID</dt>
              <dd className="font-mono text-ink">{style.passportId}</dd>
              <dt>Importer EORI</dt>
              <dd className="font-mono text-ink">{style.importerEori}</dd>
              <dt>Exporter BIN</dt>
              <dd className="font-mono text-ink">{style.exporterBin}</dd>
            </dl>
          </details>
        </section>

        {/* QR code and how the product is made */}
        <section className="grid grid-cols-1 items-start gap-6 border-t border-[var(--border-hairline)] pt-6 md:grid-cols-[auto_1fr]">
          <div className="glass-card flex flex-col items-center gap-3 p-5">
            <span className="section-index self-start text-xs">{t("QR code for the care label")}</span>
            <div className="flex h-[141px] w-[141px] items-center justify-center rounded-[3px] border border-ink bg-white p-2.5">
              {passportUrl ? (
                <QRCodeSVG value={passportUrl} size={120} level="H" fgColor="#111A36" bgColor="#ffffff" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-success" aria-label="Preparing QR code" />
              )}
            </div>
            <p className="max-w-[20ch] text-center text-xs text-ink-muted">{t("Scan with any phone camera to open this report.")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Materials & origin", value: style.specifications.materials },
                { label: "Dyeing & processing", value: style.specifications.dyeing },
                { label: "Circularity & hardware", value: style.specifications.circularity },
              ].map((spec) => (
                <div key={spec.label} className="glass-card p-4">
                  <div className="text-xs text-ink-muted">{t(spec.label)}</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{spec.value}</div>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Lock className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
              {t("Cost sheets and pattern files are never part of this report.")}
            </p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
