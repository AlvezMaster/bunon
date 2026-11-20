"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ChevronDown, LogIn, LogOut, CreditCard, UserRound } from "lucide-react";
import { useBunonStore, type UserRole } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PreferenceToggles } from "@/components/Preferences";
import MorphLink from "@/components/MorphLink";
import BunonLogo from "@/components/BunonLogo";

type NavLink = { href: string; label: string; match?: string; exact?: boolean; also?: string };

const PUBLIC_LINKS: NavLink[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#who-its-for", label: "Who it's for" },
  { href: "/about", label: "About us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

function workspaceLinks(role: UserRole): NavLink[] {
  const report = { href: "/reports", label: "Reports", also: "/passport" };
  return role === "factory"
    ? [{ href: "/factory", label: "Dashboard", exact: true }, { href: "/factory/orders", label: "Orders", match: "/factory/order" }, { href: "/factory/questionnaire", label: "Questions" }, { href: "/factory/documents", label: "Documents" }, { href: "/factory/buyers", label: "Buyers" }, { href: "/factory/agents", label: "AI agents" }, report]
    : [{ href: "/buyer", label: "Dashboard", exact: true }, { href: "/buyer/verify", label: "Verify a supplier" }, { href: "/buyer/questions", label: "Questions" }, { href: "/buyer/factories", label: "Factories" }, { href: "/buyer/library", label: "Documents" }, { href: "/buyer/agents", label: "AI agents" }, report];
}

export const ROLE_LABEL: Record<UserRole, string> = {
  factory: "Factory account",
  buyer: "Buyer account",
};

const ROLE_SHORT: Record<UserRole, string> = { factory: "Factory", buyer: "Buyer" };

/** "Tariqul Islam (demo compliance officer)" → "Tariqul Islam" and "TI". */
function displayName(fullName: string) {
  const name = fullName.replace(/\s*\(.*\)\s*$/, "").trim() || fullName;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return { name, initials };
}

const HAIRLINE = "h-3.5 w-px bg-ink/15";
const GHOST =
  "rounded-md transition-colors duration-150 hover:bg-ink/[0.05]";

/**
 * Editorial top bar: full width with a hairline, content aligned to the page grid (max-w-6xl, same
 * padding as every page), brand and navigation grouped on the left, flat utilities on the right.
 * No glows, gradients or nested bordered boxes.
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useBunonStore((s) => s.session);
  const setSession = useBunonStore((s) => s.setSession);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Public pages: hide the bar while the visitor scrolls down, bring it back on scroll up,
  // on hover at the top edge, or when a link inside it gets keyboard focus.
  const autoHide = !session;
  const [scrolledAway, setScrolledAway] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!autoHide) {
      setScrolledAway(false);
      return;
    }
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setScrolledAway(false);
      else if (y > lastY + 4) setScrolledAway(true);
      else if (y < lastY - 4) setScrolledAway(false);
      // Small movements (under 4px) keep the current state, so the bar does not flicker.
      if (Math.abs(y - lastY) > 4 || y < 80) lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [autoHide]);

  const hidden = autoHide && scrolledAway && !pinned;

  const links = session ? workspaceLinks(session.role) : PUBLIC_LINKS;

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setSession(null);
      setSigningOut(false);
      setMenuOpen(false);
      router.push("/");
    }
  };

  const isActive = (link: NavLink) => {
    if (link.href.startsWith("/#")) return false;
    const base = link.match ?? link.href;
    return base === "/" || link.exact
      ? pathname === base
      : pathname.startsWith(base) || (!!link.also && pathname.startsWith(link.also));
  };

  const user = session ? displayName(session.fullName) : null;

  return (
    <MotionConfig reducedMotion="user">
      {/* Invisible strip along the top edge: hovering it brings the hidden bar back */}
      {hidden && (
        <div className="fixed inset-x-0 top-0 z-[60] h-4" onMouseEnter={() => setPinned(true)} aria-hidden="true" />
      )}
      <header
        onMouseEnter={() => setPinned(true)}
        onMouseLeave={() => setPinned(false)}
        onFocus={() => setPinned(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPinned(false);
        }}
        className={`sticky top-0 z-50 h-14 w-full border-b border-ink/[0.08] bg-canvas/80 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: brand, divider, navigation */}
          <div className="flex min-w-0 items-center">
            <Link
              href={session ? (session.role === "buyer" ? "/buyer" : "/factory") : "/"}
              className="flex shrink-0 items-center gap-2.5 rounded-md"
              aria-label="Bunon home"
            >
              <BunonLogo className="h-7 w-7" />
              <span className={`font-display text-[15px] font-semibold tracking-tight text-ink ${session ? "hidden lg:inline" : ""}`}>Bunon</span>
            </Link>

            <span className={`mx-4 hidden rotate-[15deg] sm:block ${HAIRLINE.replace("h-3.5", "h-4")}`} aria-hidden="true" />

            <nav aria-label="Main" className={`min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${session ? "flex" : "hidden sm:flex"}`}>
              <div className="flex items-center gap-1">
                {links.map((link) => {
                  const active = isActive(link);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] lg:px-3 transition-colors duration-150 ${
                        active
                          ? "bg-ink/[0.07] font-medium text-ink"
                          : "font-normal text-ink-muted hover:bg-ink/[0.04] hover:text-ink"
                      }`}
                    >
                      {t(link.label)}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Right: flat utilities and the account */}
          <div className="flex shrink-0 items-center">
            <div className={`items-center ${session ? "hidden sm:flex" : "flex"}`}>
              <PreferenceToggles />
              <span className={`mx-1.5 ${HAIRLINE}`} aria-hidden="true" />
            </div>

            {session && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className={`flex items-center gap-2.5 py-1 pl-2 pr-2.5 ${GHOST}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-[10px] font-medium tracking-wider text-ink">
                    {user.initials}
                  </span>
                  <span className="hidden max-w-[160px] truncate text-[13px] font-medium leading-none text-ink xl:block">
                    {user.name}
                  </span>
                  <span className="hidden rounded border border-ink/[0.08] bg-ink/[0.04] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted lg:inline">
                    {t(ROLE_SHORT[session.role])}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-ink-faint transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-lg border border-ink/[0.08] bg-canvas/95 p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]"
                    >
                      <div className="px-3 py-2.5">
                        <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
                        <p className="truncate text-xs text-ink-muted">{session.email}</p>
                        <p className="mt-1.5 text-[11px] text-ink-muted">
                          {t(ROLE_LABEL[session.role])} · {session.organization}
                        </p>
                      </div>
                      {/* Phones: the language and theme buttons live here */}
                      <div className="flex items-center border-t border-ink/[0.06] px-1 py-1 sm:hidden">
                        <PreferenceToggles />
                      </div>
                      <div className="border-t border-ink/[0.06] pt-1">
                        <Link
                          href="/account"
                          role="menuitem"
                          className="flex h-11 w-full items-center gap-2 rounded-md px-3 text-[13px] text-ink-muted transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink"
                        >
                          <UserRound className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                          {t("Account")}
                        </Link>
                        {session.role === "factory" && (
                          <Link
                            href="/factory/billing"
                            role="menuitem"
                            className="flex h-11 w-full items-center gap-2 rounded-md px-3 text-[13px] text-ink-muted transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink"
                          >
                            <CreditCard className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                            {t("Plan and billing")}
                          </Link>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="flex h-11 w-full items-center gap-2 rounded-md px-3 text-[13px] text-ink-muted transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink"
                        >
                          <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                          {t(signingOut ? "Signing out…" : "Sign out")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <MorphLink
                href="/login"
                label={t("Sign in")}
                aria-current={pathname === "/login" ? "page" : undefined}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-ink ${GHOST}`}
              >
                <LogIn className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                {t("Sign in")}
              </MorphLink>
            )}
          </div>
        </div>
      </header>
    </MotionConfig>
  );
}
