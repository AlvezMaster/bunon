"use client";

import { useEffect } from "react";
import { useBunonStore, type SessionUser } from "@/lib/store";

/**
 * Mounted once in the root layout. The store skips automatic hydration so the server HTML and
 * the first client render match; this restores the persisted state right after mount and loads
 * the signed-in user from the httpOnly session cookie.
 */
export default function StoreHydrator() {
  const setSession = useBunonStore((s) => s.setSession);

  useEffect(() => {
    void useBunonStore.persist.rehydrate();
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((json: { user: SessionUser | null }) => {
        if (!cancelled) setSession(json.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  return null;
}
