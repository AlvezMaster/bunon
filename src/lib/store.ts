"use client";

/**
 * Client UI state (zustand + persist).
 *
 * What lives here: the signed-in user (mirrored from the session cookie), which
 * order/tier is being inspected, custom orders created in the BOM modal, and the renewals/chases
 * applied per style. What does NOT live here any more: the audit ledger (server-owned, hash-chained,
 * fetched from /api/audit-ledger) and any hardcoded hashes.
 *
 * Hydration: `skipHydration` is on so the server-rendered HTML and the first client render agree;
 * <StoreHydrator /> (in the root layout) rehydrates from localStorage right after mount.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StyleData, TierId, TierRenewal, RenewalMap } from "./styles";

export type PortalMode = "supplier" | "buyer";
export type UserRole = "factory" | "buyer";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  role: UserRole;
  orgId?: string;
  clearanceLevel: string;
  clusterId: string;
  avatarInitial: string;
}

/** styleCode → tierId → ISO time the chase was dispatched */
export type ChaseMap = Record<string, Partial<Record<TierId, string>>>;

interface BunonState {
  // --- session (mirrors the httpOnly cookie; populated from /api/auth/session) ---
  session: SessionUser | null;
  sessionChecked: boolean;
  setSession: (user: SessionUser | null) => void;
  /** Loads shared renewals and factory-created orders from the server. */
  refreshCatalog: () => Promise<void>;

  // --- persona / portal preference ---
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;


  // --- interface language ---
  lang: "en" | "bn";
  setLang: (lang: "en" | "bn") => void;

  // --- orders ---
  activeSupplierStyleId: string;
  setActiveSupplierStyleId: (code: string) => void;
  activeBuyerStyleId: string;
  setActiveBuyerStyleId: (code: string) => void;
  customStyles: Record<string, StyleData>;
  /** Order codes the server says this company may see (null until loaded). */
  visibleCodes: string[] | null;
  /** Companies this company is linked to, with the link status. */
  partners: Array<{ orgId: string; name: string; status: string }>;
  addCustomStyle: (style: StyleData) => void;

  // --- per-style compliance state ---
  renewals: RenewalMap;
  installRenewal: (styleCode: string, tierId: TierId, renewal: TierRenewal) => void;
  resetStyleCompliance: (styleCode: string) => void;
  chases: ChaseMap;
  dispatchChase: (styleCode: string, tierId: TierId) => void;

  // --- inspector ---
  activeNodeId: TierId;
  setActiveNodeId: (id: TierId) => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** Saves a factory change to /api/catalog. The local state is already updated; a failure only logs. */
async function saveToServer(body: Record<string, unknown>): Promise<void> {
  try {
    const res = await fetch("/api/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) console.warn("[bunon] could not save to server:", (await res.json().catch(() => ({}))).error ?? res.status);
  } catch {
    console.warn("[bunon] could not save to server: offline");
  }
}

export const useBunonStore = create<BunonState>()(
  persist(
    (set, get) => ({
      session: null,
      sessionChecked: false,
      setSession: (user) => {
        set({ session: user, sessionChecked: true, ...(user ? { userRole: user.role, portalMode: user.role === "buyer" ? "buyer" : "supplier" } : { renewals: {}, customStyles: {}, visibleCodes: null, partners: [] }) });
        if (user) void get().refreshCatalog();
      },
      refreshCatalog: async () => {
        try {
          const res = await fetch("/api/catalog", { cache: "no-store" });
          if (!res.ok) return;
          const data = (await res.json()) as {
            renewals: RenewalMap;
            customStyles: Record<string, StyleData>;
            visibleCodes?: string[];
            partners?: Array<{ orgId: string; name: string; status: string }>;
          };
          set({ renewals: data.renewals ?? {}, customStyles: data.customStyles ?? {}, visibleCodes: data.visibleCodes ?? null, partners: data.partners ?? [] });
        } catch {
          /* offline: keep what we have */
        }
      },

      portalMode: "supplier",
      setPortalMode: (mode) => set({ portalMode: mode }),
      userRole: "factory",
      setUserRole: (role) => set({ userRole: role }),


      lang: "en",
      setLang: (lang) => set({ lang }),

      activeSupplierStyleId: "DN-2026",
      setActiveSupplierStyleId: (code) => set({ activeSupplierStyleId: code, activeNodeId: "t3-yarn" }),
      activeBuyerStyleId: "DN-2026",
      setActiveBuyerStyleId: (code) => set({ activeBuyerStyleId: code }),
      customStyles: {},
      visibleCodes: null,
      partners: [],
      // Changes apply locally at once and are saved on the server, so buyers on other devices see them.
      addCustomStyle: (style) => {
        set((s) => ({
          customStyles: { ...s.customStyles, [style.code]: style },
          activeSupplierStyleId: style.code,
          visibleCodes: s.visibleCodes && !s.visibleCodes.includes(style.code) ? [...s.visibleCodes, style.code] : s.visibleCodes,
        }));
        void saveToServer({ action: "order", style });
      },

      renewals: {},
      installRenewal: (styleCode, tierId, renewal) => {
        set((s) => ({ renewals: { ...s.renewals, [styleCode]: { ...(s.renewals[styleCode] ?? {}), [tierId]: renewal } } }));
        void saveToServer({ action: "renewal", styleCode, tierId, renewal });
      },
      resetStyleCompliance: (styleCode) => {
        set((s) => {
          const renewals = { ...s.renewals };
          delete renewals[styleCode];
          const chases = { ...s.chases };
          delete chases[styleCode];
          return { renewals, chases };
        });
        void saveToServer({ action: "reset", styleCode });
      },
      chases: {},
      dispatchChase: (styleCode, tierId) =>
        set((s) => ({ chases: { ...s.chases, [styleCode]: { ...(s.chases[styleCode] ?? {}), [tierId]: new Date().toISOString() } } })),

      activeNodeId: "t3-yarn",
      setActiveNodeId: (id) => set({ activeNodeId: id }),
    }),
    {
      name: "bunon-storage-v8",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage)),
      skipHydration: true,
      partialize: (s) => ({
        portalMode: s.portalMode,
        userRole: s.userRole,
        lang: s.lang,
        activeSupplierStyleId: s.activeSupplierStyleId,
        activeBuyerStyleId: s.activeBuyerStyleId,
        chases: s.chases,
      }),
    }
  )
);
