"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useBunonStore } from "@/lib/store";
import { factoryOf, listStyles, visibleOrders } from "@/lib/styles";
import { t } from "@/lib/i18n";

/** "All reports" link plus a dropdown to jump straight to another product's report. */
export default function ProductSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const products = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/reports" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("All reports")}
      </Link>
      <div className="flex items-center gap-2">
        <label htmlFor="product-switch" className="text-sm text-ink-muted">
          {t("Product")}
        </label>
        <select
          id="product-switch"
          value={current}
          onChange={(e) => router.push(`/passport/${encodeURIComponent(e.target.value)}`)}
          className="min-h-[44px] rounded-[4px] border border-field bg-surface px-3 text-sm text-ink"
        >
          {products.map((p) => (
            <option key={p.code} value={p.code}>
              {p.title} (#{p.code}) · {factoryOf(p)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
