"use client";

import { FlaskConical } from "lucide-react";
import { t } from "@/lib/i18n";

/**
 * Marks screens that show demo data. Every factory, supplier, buyer and certificate in this
 * prototype is fictional, and the certificate registry is simulated.
 */
export default function DemoDataBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border-[1.5px] border-current px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-warning ${className}`}
      title="All companies, certificates and orders on this screen are fictional. The certificate registry is simulated."
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      {t("Demo data · simulated registry")}
    </span>
  );
}

/** Full-width notice for the top of signed-in workspaces. */
export function DemoDataNotice() {
  return (
    <div
      role="note"
      className="flex flex-col gap-1 rounded-[4px] border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:gap-3"
    >
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <FlaskConical className="h-4 w-4" aria-hidden="true" />
        {t("Demo workspace")}
      </span>
      <span className="text-ink-muted">
        {t("Every factory, supplier, buyer and certificate here is fictional, and the certificate registry is simulated. The checks themselves (document fingerprints, expiry dates, the hash-chained ledger) run for real.")}
      </span>
    </div>
  );
}
