"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import DemoDataBadge from "@/components/DemoDataBadge";
import { DashboardHeader, StatusBadge } from "@/components/dashboard/DashboardParts";
import { useBunonStore } from "@/lib/store";
import { factoryOf, listStyles, styleClearance, visibleOrders } from "@/lib/styles";
import { t } from "@/lib/i18n";

export default function ReportsPage() {
  const session = useBunonStore((s) => s.session);
  const visibleCodes = useBunonStore((s) => s.visibleCodes);
  const customStyles = useBunonStore((s) => s.customStyles);
  const renewals = useBunonStore((s) => s.renewals);
  const products = visibleOrders(listStyles(customStyles, renewals), session, visibleCodes);
  const factories = [...new Set(products.map(factoryOf))];
  const [factory, setFactory] = useState("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = products.filter(
    (p) =>
      (factory === "all" || factoryOf(p) === factory) &&
      (!q || [p.title, p.code, factoryOf(p), p.buyer, p.fiberComposition, p.garmentType].join(" ").toLowerCase().includes(q))
  );

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        {session && (
          <Link
            href={session.role === "buyer" ? "/buyer" : "/factory"}
            className="-mb-4 inline-flex min-h-[44px] w-fit items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("Back to dashboard")}
          </Link>
        )}
        <DashboardHeader eyebrow="Reports" title="Find a product report">
          <DemoDataBadge />
        </DashboardHeader>
        {/* The search bar is the main control on this page */}
        <div className="flex flex-col gap-3">
          <label htmlFor="report-search" className="sr-only">
            {t("Search products")}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              id="report-search"
              type="search"
              autoFocus
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search by product, code, factory, buyer or fibre")}
              className="h-16 w-full rounded-[4px] border-2 border-line-strong bg-surface pl-14 pr-14 text-lg text-ink shadow-[var(--shadow-card)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint focus:border-brand focus:shadow-[0_0_0_4px_rgba(42,58,143,0.15)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("Clear search")}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
            <span aria-live="polite" className="tabular-nums">
              {shown.length} / {products.length} {t(products.length === 1 ? "product" : "products")}
            </span>
            {factories.length > 1 && (
              <span className="flex items-center gap-2">
                <label htmlFor="report-factory">{t("Factory")}</label>
                <select
                  id="report-factory"
                  value={factory}
                  onChange={(e) => setFactory(e.target.value)}
                  className="min-h-[44px] rounded-[4px] border border-line bg-surface px-3 text-sm text-ink"
                >
                  <option value="all">{t("All")}</option>
                  {factories.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </div>
        </div>

        {shown.length === 0 && (
          <p className="rounded-[4px] border border-dashed border-line-strong p-8 text-center text-ink-muted">
            {t("No product matches your search. Try a product name, an order code or a factory.")}
          </p>
        )}

        {/* One row per product: the whole row opens its report */}
        {shown.length > 0 && (
          <ul className="glass-card divide-y divide-[var(--border-hairline)] overflow-hidden">
            {shown.map((p) => {
              const c = styleClearance(p);
              return (
                <li key={p.code}>
                  <Link
                    href={`/passport/${encodeURIComponent(p.code)}`}
                    className="flex min-h-[64px] items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2/60 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold leading-snug text-ink">{p.title}</h2>
                      <p className="text-sm text-ink-muted">
                        <span className="font-mono tabular-nums">#{p.code}</span> · {factoryOf(p)}
                      </p>
                    </div>
                    <StatusBadge tone={c.cleared ? "ok" : "bad"}>{c.cleared ? t("In date") : t("On hold")}</StatusBadge>
                    <span className="sr-only">{t("Open report")}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
