/**
 * Export style catalog — the single source of truth for demo orders and their 5-tier supply chains.
 *
 * Design rules:
 *  - Validity dates are ISO (YYYY-MM-DD) or null for permanent accreditation; the UI formats them.
 *  - A tier's `status` reflects the certificate facts: `expired` when the certificate on file has lapsed.
 *    The DN-2026 Tier-3 yarn certificate (Padmaloom Spinning Mills) genuinely expired on 2026-07-14 — that
 *    is the conflict the demo resolves by ingesting the renewed certificate.
 *  - No hashes are hardcoded. Merkle leaf hashes and roots are computed from tier content with real
 *    SHA-256 (see provenance.ts), so the "cryptographic" claims are reproducible by anyone.
 *  - Unknown style codes are NOT fabricated into cleared passports: getStyleData returns null.
 */

export type TierId = "t4-cotton" | "t3-yarn" | "t2-dyeing" | "t1-trims" | "t0-factory";
export type TierStatus = "verified" | "expired";

export interface SupplyChainTier {
  id: TierId;
  tierNumber: 0 | 1 | 2 | 3 | 4;
  stepName: string;
  facilityName: string;
  facilityLocation: string;
  material: string;
  /** Standard / certificate type label, e.g. "GOTS Scope Certificate" */
  certType: string;
  /** Certificate number exactly as issued */
  certNumber: string;
  /** ISO date or null for permanent accreditation */
  validThrough: string | null;
  status: TierStatus;
  contactPerson: string;
  contactChannel: string;
}

export interface StyleData {
  code: string;
  title: string;
  garmentType: string;
  volume: string;
  volumeUnits: number;
  buyer: string;
  /** Set on orders created in the app; seeded orders are matched by company name. */
  factoryOrgId?: string;
  buyerOrgId?: string;
  purchaseOrder: string;
  destination: string;
  portOfEntryCode: string;
  portOfLading: string;
  targetMarket: string;
  hsCode: string;
  exporterBin: string;
  /** EORI of the EU consignee/importer (EORIs are issued to EU economic operators, not Bangladeshi exporters). */
  importerEori: string;
  farmGps: string;
  fiberComposition: string;
  fiberStandard: string;
  chemicalSafety: string;
  chemicalStandard: string;
  carbonFootprint: string;
  carbonBaselineReduction: string;
  repairabilityScore: string;
  repairabilityGrade: string;
  passportId: string;
  specifications: {
    materials: string;
    dyeing: string;
    circularity: string;
  };
  tiers: SupplyChainTier[];
}

const RANGPUR_FARM = (material: string): SupplyChainTier => ({
  id: "t4-cotton",
  tierNumber: 4,
  stepName: "RAW COTTON GINNING",
  facilityName: "Kashbon Organic Cotton Farm",
  facilityLocation: "Rangpur, Northern Bangladesh",
  material,
  certType: "GOTS Agricultural Scope",
  certNumber: "GOTS-AGRI-BD-7102",
  validThrough: "2028-03-31",
  status: "verified",
  contactPerson: "Dr. Rafiqul Islam (Farm Manager)",
  contactChannel: "+880 1000-000000 (demo)",
});

const ASHULIA_FACTORY = (stepName: string, material: string, certType: string): SupplyChainTier => ({
  id: "t0-factory",
  tierNumber: 0,
  stepName,
  facilityName: "Nodiwear Apparel Ltd.",
  facilityLocation: "Ashulia, Dhaka",
  material,
  certType,
  certNumber: "LEED-BD-PLAT-2024",
  validThrough: null,
  status: "verified",
  contactPerson: "Engr. Shamim Reza (VP Compliance)",
  contactChannel: "+880 1000-000000 (demo)",
});

export const STYLES_CATALOG: Record<string, StyleData> = {
  "DN-2026": {
    code: "DN-2026",
    title: "Mens Relaxed Fit Organic Denim Jacket",
    garmentType: "Denim Outerwear",
    volume: "24,000 PCS",
    volumeUnits: 24000,
    buyer: "Nordlys Apparel AB (fictional EU brand)",
    purchaseOrder: "NA-EU-89241",
    destination: "Rotterdam (NL)",
    portOfEntryCode: "NL-RTM",
    portOfLading: "Chattogram Sea Port (BD-CGP)",
    targetMarket: "EU retail (Nordlys Apparel, fictional)",
    hsCode: "HS 6203.42.00",
    exporterBin: "BIN 000000000-0000 (demo)",
    importerEori: "NL000000001",
    farmGps: "25.7439° N, 89.2752° E (Kashbon farm, demo)",
    fiberComposition: "85% Organic Cotton, 15% Recycled Hemp",
    fiberStandard: "GOTS Scope Certified (simulated licence 849201)",
    chemicalSafety: "Zero Toxins (MRSL v3.1)",
    chemicalStandard: "OEKO-TEX Std 100 Class I",
    carbonFootprint: "4.8 kg CO2e",
    carbonBaselineReduction: "64% Below Baseline",
    repairabilityScore: "94 / 100",
    repairabilityGrade: "Grade A (Modular Hardware)",
    passportId: "DPP-EU-BD-2026-DN8842",
    specifications: {
      materials: "100% Traceable Organic Cotton (Kashbon farm)",
      dyeing: "Zero Harmful Substances (Neelrong Dyeing)",
      circularity: "94/100 Repairability (Detachable Zinc Shanks)",
    },
    tiers: [
      RANGPUR_FARM("100% Organic Raw Seed Cotton"),
      {
        id: "t3-yarn",
        tierNumber: 3,
        stepName: "COMBED YARN SPINNING",
        facilityName: "Padmaloom Spinning Mills Ltd.",
        facilityLocation: "Chowrasta, Gazipur, Bangladesh",
        material: "Ne 20/1 Organic Combed Ring-Spun Yarn",
        certType: "GOTS Scope Certificate",
        certNumber: "DEMO-GOTS-849201-2024.001",
        validThrough: "2026-07-14",
        status: "expired",
        contactPerson: "Kazi Mahbub (Commercial Director)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        id: "t2-dyeing",
        tierNumber: 2,
        stepName: "ECO WEAVING & DYEING",
        facilityName: "Neelrong Dyeing Mills",
        facilityLocation: "Tongi Industrial Estate, Dhaka",
        material: "13.5 oz Pre-Reduced Liquid Indigo Denim Fabric",
        certType: "OEKO-TEX Standard 100 Class I & ZDHC Level 3",
        certNumber: "OEKO-100-BD-9042",
        validThrough: "2027-12-31",
        status: "verified",
        contactPerson: "Nazrul H. Talukder (Chief Chemist)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        id: "t1-trims",
        tierNumber: 1,
        stepName: "TRIMS & METAL HARDWARE",
        facilityName: "Bolaka Fastening Products",
        facilityLocation: "DEPZ, Savar, Dhaka",
        material: "Detachable Eco-Zinc Shank Buttons & Rivets",
        certType: "Global Recycled Standard (GRS v4.0)",
        certNumber: "GRS-BOL-BD-5510",
        validThrough: "2028-01-31",
        status: "verified",
        contactPerson: "Tariqul Anam (Senior Key Account)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      ASHULIA_FACTORY(
        "CUT-MAKE-TRIM (CMT) ASSEMBLY",
        "Denim Garment Assembly & Laser Ozone Wash",
        "LEED Platinum (94 Pts) & BSCI Grade A"
      ),
    ],
  },
  "TS-4011": {
    code: "TS-4011",
    title: "Vintage Heavyweight Organic Jersey Tee",
    garmentType: "Knitted Apparel",
    volume: "60,000 PCS",
    volumeUnits: 60000,
    buyer: "Nordic Retail Syndicate",
    purchaseOrder: "NRS-DE-77120",
    destination: "Hamburg (DE)",
    portOfEntryCode: "DE-HAM",
    portOfLading: "Chattogram Sea Port (BD-CGP)",
    targetMarket: "Nordic Retail Syndicate (fictional)",
    hsCode: "HS 6109.10.00",
    exporterBin: "BIN 000000000-0000 (demo)",
    importerEori: "DE000000002",
    farmGps: "25.7439° N, 89.2752° E (Kashbon farm, demo)",
    fiberComposition: "100% Combed Organic Cotton Jersey",
    fiberStandard: "GOTS Certified (GOTS-BD-4011)",
    chemicalSafety: "Heavy Metal Free",
    chemicalStandard: "ZDHC Level 3 Certified",
    carbonFootprint: "2.1 kg CO2e",
    carbonBaselineReduction: "71% Below Baseline",
    repairabilityScore: "98 / 100",
    repairabilityGrade: "Grade A+ (Mono-Material)",
    passportId: "DPP-EU-BD-2026-TS4011",
    specifications: {
      materials: "Single-Origin 220 GSM Combed Organic Jersey",
      dyeing: "Closed-Loop Low Water Indigo (OEKO-TEX Class I)",
      circularity: "100% Mono-Material Biodegradable Cotton Seams",
    },
    tiers: [
      RANGPUR_FARM("100% Organic Raw Combed Cotton"),
      {
        id: "t3-yarn",
        tierNumber: 3,
        stepName: "COMBED YARN SPINNING",
        facilityName: "Kolmilata Yarns Ltd.",
        facilityLocation: "Chattogram, Bangladesh",
        material: "Ne 30/1 Super Combed Organic Ring Yarn",
        certType: "GOTS Scope Certificate",
        certNumber: "GOTS-BD-4011",
        validThrough: "2027-10-31",
        status: "verified",
        contactPerson: "Monirul Haque (Plant GM)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        id: "t2-dyeing",
        tierNumber: 2,
        stepName: "KNIT DYEING & FINISHING",
        facilityName: "Brishti Knit Dyeing Ltd.",
        facilityLocation: "Gazipur, Bangladesh",
        material: "220 GSM Single Jersey Bio-Washed",
        certType: "OEKO-TEX Standard 100 & ZDHC Level 3",
        certNumber: "OEKO-KNIT-BD-8801",
        validThrough: "2028-01-31",
        status: "verified",
        contactPerson: "Dr. Asaduzzaman (Technical Head)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        id: "t1-trims",
        tierNumber: 1,
        stepName: "THREAD & LABELS",
        facilityName: "Sutoa Threads Ltd.",
        facilityLocation: "Chittagong EPZ, Bangladesh",
        material: "100% Organic Cotton Sewing Thread & Paper Labels",
        certType: "GRS Recycled & FSC Certified",
        certNumber: "GRS-SUT-BD-3310",
        validThrough: "2028-09-30",
        status: "verified",
        contactPerson: "Sajid Karim (Supply Lead)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      ASHULIA_FACTORY("KNIT CUT & SEW", "T-Shirt Assembly & Solar Curing", "LEED Platinum & Accord Verified"),
    ],
  },
  "HD-1090": {
    code: "HD-1090",
    title: "Organic French Terry Pullover Hoodie",
    garmentType: "Heavy Fleece Outerwear",
    volume: "18,000 PCS",
    volumeUnits: 18000,
    buyer: "Nordlys Apparel AB (fictional EU brand)",
    purchaseOrder: "DRL-BE-30455",
    destination: "Antwerp (BE)",
    portOfEntryCode: "BE-ANR",
    portOfLading: "Chattogram Sea Port (BD-CGP)",
    targetMarket: "DACH Region Logistics Gateway",
    hsCode: "HS 6110.20.00",
    exporterBin: "BIN 000000000-0000 (demo)",
    importerEori: "BE0000000003",
    farmGps: "25.7439° N, 89.2752° E (Kashbon farm, demo)",
    fiberComposition: "90% Organic Cotton, 10% Recycled Cotton",
    fiberStandard: "GRS Recycled Scope (GRS-BD-1090)",
    chemicalSafety: "Zero Fluorinated Synthetics",
    chemicalStandard: "bluesign® Approved",
    carbonFootprint: "5.4 kg CO2e",
    carbonBaselineReduction: "58% Below Baseline",
    repairabilityScore: "91 / 100",
    repairabilityGrade: "Grade A (Reinforced Cuffs)",
    passportId: "DPP-EU-BD-2026-HD1090",
    specifications: {
      materials: "420 GSM Organic French Terry Fleece",
      dyeing: "Certified Low-Impact Non-Azo Reactive Dyes",
      circularity: "Reinforced Flatlock Stitching with Recycled Ribbing",
    },
    tiers: [
      RANGPUR_FARM("90% Organic Cotton, 10% Pre-Consumer Waste"),
      {
        id: "t3-yarn",
        tierNumber: 3,
        stepName: "HEAVY ROTOR SPINNING",
        facilityName: "Chorkhaghor Spinning Ltd.",
        facilityLocation: "Narayanganj, Bangladesh",
        material: "Ne 12/1 French Terry Loop Yarn",
        certType: "GRS Scope Certificate",
        certNumber: "GRS-BD-1090",
        validThrough: "2027-08-31",
        status: "verified",
        contactPerson: "Arifur Rahman (Director)",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        id: "t2-dyeing",
        tierNumber: 2,
        stepName: "FLEECE DYEING & BRUSHING",
        facilityName: "Kuasha Fleece Finishing Ltd.",
        facilityLocation: "Narayanganj, Bangladesh",
        material: "420 GSM Unbrushed French Terry",
        certType: "bluesign® System Partner",
        certNumber: "BLUESIGN-BD-5542",
        validThrough: "2028-05-31",
        status: "verified",
        contactPerson: "Engr. Kabir Hossain",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        id: "t1-trims",
        tierNumber: 1,
        stepName: "DRAWCORD & EYELETS",
        facilityName: "Bonolota Trims & Accessories",
        facilityLocation: "Gazipur, Bangladesh",
        material: "Organic Cotton Braided Cord & Brass Eyelets",
        certType: "OEKO-TEX Standard 100",
        certNumber: "OEKO-TRIM-BD-1090",
        validThrough: "2028-06-30",
        status: "verified",
        contactPerson: "Mehedi Hasan",
        contactChannel: "+880 1000-000000 (demo)",
      },
      {
        ...ASHULIA_FACTORY("HEAVY SEWING & PACKING", "Hoodie Flatlock Assembly & Biopolymer Polybags", "WRAP Certified"),
        facilityName: "Kanthaloom Knitwear Ltd.",
        facilityLocation: "Gazipur, Dhaka",
        certNumber: "DEMO-WRAP-BD-1090",
        contactPerson: "Nasrin Akter (Compliance Manager)",
      },
    ],
  },
};

export const DEFAULT_STYLE_CODE = "DN-2026";

/** A renewed certificate installed on a tier after successful ingestion. */
export interface TierRenewal {
  certNumber: string;
  certType: string;
  validThrough: string | null;
  documentSha256: string;
  ingestedAt: string;
  /** "ollama:<model>" or "rules" — which engine extracted the fields */
  engine: string;
}

/** styleCode → tierId → renewal */
export type RenewalMap = Record<string, Partial<Record<TierId, TierRenewal>>>;

export function normalizeStyleCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

/**
 * Resolves a style from the built-in catalog or the user's custom orders and applies any
 * ingested renewals. Returns null for unknown codes — callers must render a "not found /
 * unverified" state instead of inventing a passport.
 */
export function getStyleData(
  code: string | null | undefined,
  customCatalog: Record<string, StyleData> = {},
  renewals: RenewalMap = {}
): StyleData | null {
  const normalized = normalizeStyleCode(code) || DEFAULT_STYLE_CODE;
  const base = customCatalog[normalized] ?? STYLES_CATALOG[normalized];
  if (!base) return null;
  return applyRenewals(base, renewals[normalized]);
}

export function applyRenewals(style: StyleData, renewals?: Partial<Record<TierId, TierRenewal>>): StyleData {
  if (!renewals || Object.keys(renewals).length === 0) return style;
  return {
    ...style,
    tiers: style.tiers.map((tier) => {
      const r = renewals[tier.id];
      if (!r) return tier;
      return { ...tier, certNumber: r.certNumber, certType: r.certType, validThrough: r.validThrough, status: "verified" };
    }),
  };
}

export function listStyles(customCatalog: Record<string, StyleData> = {}, renewals: RenewalMap = {}): StyleData[] {
  return [...Object.values(STYLES_CATALOG), ...Object.values(customCatalog)].map((s) => applyRenewals(s, renewals[s.code]));
}

export interface ClearanceSummary {
  cleared: boolean;
  expiredTiers: SupplyChainTier[];
  /** Short badge text */
  label: string;
}

/** The garment factory (tier 0) that makes an order. */
export function factoryOf(style: StyleData): string {
  return style.tiers.find((t) => t.tierNumber === 0)?.facilityName ?? "Unknown factory";
}

/** True when a signed-in factory's organisation name matches the order's tier-0 factory. */
export function isOwnOrder(style: StyleData, organization: string | undefined): boolean {
  return !!organization && organization.startsWith(factoryOf(style));
}

/** True when a signed-in buyer's organisation is the order's buyer. */
export function isBuyersOrder(style: StyleData, organization: string | undefined): boolean {
  if (!organization) return false;
  const name = (v: string) => v.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
  return name(style.buyer) === name(organization);
}

/** Orders a signed-in user may see: a buyer sees only orders placed by their brand, a factory only orders it makes. */
export function visibleOrders(styles: StyleData[], user: { role: string; organization: string } | null, codes?: string[] | null): StyleData[] {
  // Until the signed-in user is known, show nothing rather than someone else's orders.
  if (!user) return [];
  // The server decides from real factory ↔ buyer links (see src/lib/server/access.ts); names are only a fallback.
  if (codes) return styles.filter((s) => codes.includes(s.code));
  return styles.filter((s) => (user.role === "buyer" ? isBuyersOrder(s, user.organization) : isOwnOrder(s, user.organization)));
}

export function styleClearance(style: StyleData): ClearanceSummary {
  const expiredTiers = style.tiers.filter((t) => t.status === "expired");
  return {
    cleared: expiredTiers.length === 0,
    expiredTiers,
    label: expiredTiers.length === 0 ? "All certificates in date" : "Held: a certificate has expired",
  };
}

/** Builds a new custom order. Tiers are inherited from a template style and all marked verified only if the template's are. */
export function createCustomStyle(
  input: {
    code: string;
    title: string;
    garmentType: string;
    volume: string;
    destination: string;
    fiberComposition: string;
    buyer?: string;
    purchaseOrder?: string;
  },
  template: StyleData = STYLES_CATALOG[DEFAULT_STYLE_CODE]
): StyleData {
  const code = normalizeStyleCode(input.code);
  const units = Number(input.volume.replace(/[^0-9]/g, "")) || 0;
  return {
    ...template,
    code,
    title: input.title.trim(),
    garmentType: input.garmentType.trim(),
    volume: input.volume.trim(),
    volumeUnits: units,
    destination: input.destination.trim(),
    buyer: input.buyer?.trim() || "Pending buyer assignment",
    purchaseOrder: input.purchaseOrder?.trim() || `PO-${code}`,
    fiberComposition: input.fiberComposition.trim(),
    passportId: `DPP-EU-BD-2026-${code.replace(/[^A-Z0-9]/g, "")}`,
    tiers: template.tiers.map((t) => ({ ...t })),
  };
}
