/**
 * Issuer certificate registry + the "Traffic-Light Verification Engine".
 *
 *   🟢 green  — document fingerprint matches the issuer's sealed copy and the certificate is in force
 *   🟡 amber  — certificate verified from document content only (fingerprint not on file) → needs registry confirmation
 *   🔴 red    — expired, revoked, forged/altered copy, licensee mismatch, unregistered number, or unreadable document
 *
 * In production the registry is the certifier's API (each certification body's own database).
 * Here it is an in-memory table seeded with every certificate referenced by the demo styles, plus the
 * SHA-256 fingerprints of the demo documents so the integrity check is real.
 */
import { sha256Hex } from "./crypto.ts";
import type { ExtractedCertificate } from "./extraction.ts";
import { parseDateToIso } from "./extraction.ts";
import { CERTIFICATE_DOCUMENT_FIXTURES } from "./fixtures/certificate-documents.ts";

export type RegistryStatus = "active" | "expired" | "revoked";

export interface RegistryEntry {
  /** Display certificate number as printed on the document. */
  certNumber: string;
  issuer: string;
  standard: string;
  licensee: string;
  /** Lower-case tokens that must all appear in an extracted licensee for it to match (e.g. ["padmaloom", "spinning"]). */
  licenseeKey: string[];
  scope: string;
  validFrom: string | null;
  /** ISO date; null = no expiry (e.g. permanent accreditation). */
  validUntil: string | null;
  status: RegistryStatus;
  /** Tier the certificate belongs to in the demo catalog, when applicable. */
  tierId?: string;
  /** Which demo document fixture carries this certificate (its SHA-256 is the sealed fingerprint). */
  documentFixture?: "valid" | "expired";
}

export const CERTIFICATE_REGISTRY: RegistryEntry[] = [
  // --- Padmaloom Spinning Mills Ltd. (DN-2026 tier 3) ---
  {
    certNumber: "DEMO-GOTS-849201-2024.001",
    issuer: "Demo Certification Body (simulated)",
    standard: "GOTS",
    licensee: "Padmaloom Spinning Mills Ltd.",
    licenseeKey: ["padmaloom", "spinning"],
    scope: "Spinning of organic combed ring-spun yarn (Ne 20/1), trading",
    validFrom: "2024-07-15",
    validUntil: "2026-07-14",
    status: "expired",
    tierId: "t3-yarn",
    documentFixture: "expired",
  },
  {
    certNumber: "DEMO-GOTS-849201-2026.001",
    issuer: "Demo Certification Body (simulated)",
    standard: "GOTS",
    licensee: "Padmaloom Spinning Mills Ltd.",
    licenseeKey: ["padmaloom", "spinning"],
    scope: "Spinning of organic combed ring-spun yarn (Ne 20/1), trading",
    validFrom: "2026-10-15",
    validUntil: "2027-11-14",
    status: "active",
    tierId: "t3-yarn",
    documentFixture: "valid",
  },
  // --- Other DN-2026 tiers ---
  { certNumber: "GOTS-AGRI-BD-7102", issuer: "Demo Certification Body (simulated)", standard: "GOTS", licensee: "Kashbon Organic Cotton Farm", licenseeKey: ["kashbon", "organic"], scope: "Organic seed cotton cultivation and ginning", validFrom: "2025-04-01", validUntil: "2028-03-31", status: "active", tierId: "t4-cotton" },
  { certNumber: "OEKO-100-BD-9042", issuer: "Demo Testing Laboratory (simulated)", standard: "OEKO-TEX Standard 100", licensee: "Neelrong Dyeing Mills", licenseeKey: ["neelrong"], scope: "Indigo denim fabric, Product Class I", validFrom: "2026-01-01", validUntil: "2027-12-31", status: "active", tierId: "t2-dyeing" },
  { certNumber: "GRS-BOL-BD-5510", issuer: "Demo Certification Body (simulated)", standard: "GRS", licensee: "Bolaka Fastening Products", licenseeKey: ["bolaka"], scope: "Recycled zinc shank buttons and rivets", validFrom: "2026-02-01", validUntil: "2028-01-31", status: "active", tierId: "t1-trims" },
  { certNumber: "LEED-BD-PLAT-2024", issuer: "Demo Green Building Council (simulated)", standard: "LEED", licensee: "Nodiwear Apparel Ltd.", licenseeKey: ["nodiwear"], scope: "LEED v4 BD+C Platinum (94 points)", validFrom: "2024-06-01", validUntil: null, status: "active", tierId: "t0-factory" },
  // --- TS-4011 ---
  { certNumber: "GOTS-BD-4011", issuer: "Demo Certification Body (simulated)", standard: "GOTS", licensee: "Kolmilata Yarns Ltd.", licenseeKey: ["kolmilata"], scope: "Spinning of organic combed yarn (Ne 30/1)", validFrom: "2025-11-01", validUntil: "2027-10-31", status: "active", tierId: "t3-yarn" },
  { certNumber: "OEKO-KNIT-BD-8801", issuer: "Demo Testing Laboratory (simulated)", standard: "OEKO-TEX Standard 100", licensee: "Brishti Knit Dyeing Ltd.", licenseeKey: ["brishti"], scope: "Dyed single jersey knit fabric", validFrom: "2026-02-01", validUntil: "2028-01-31", status: "active", tierId: "t2-dyeing" },
  { certNumber: "GRS-SUT-BD-3310", issuer: "Demo Certification Body (simulated)", standard: "GRS", licensee: "Sutoa Threads Ltd.", licenseeKey: ["sutoa"], scope: "Organic cotton sewing thread, FSC paper labels", validFrom: "2025-10-01", validUntil: "2028-09-30", status: "active", tierId: "t1-trims" },
  // --- HD-1090 ---
  { certNumber: "DEMO-WRAP-BD-1090", issuer: "Demo Certification Body (simulated)", standard: "WRAP", licensee: "Kanthaloom Knitwear Ltd.", licenseeKey: ["kanthaloom"], scope: "Knit garment sewing and packing", validFrom: "2026-03-01", validUntil: "2027-02-28", status: "active", tierId: "t0-factory" },
  { certNumber: "GRS-BD-1090", issuer: "Demo Certification Body (simulated)", standard: "GRS", licensee: "Chorkhaghor Spinning Ltd.", licenseeKey: ["chorkhaghor"], scope: "Rotor-spun French terry loop yarn (Ne 12/1)", validFrom: "2025-09-01", validUntil: "2027-08-31", status: "active", tierId: "t3-yarn" },
  { certNumber: "BLUESIGN-BD-5542", issuer: "Demo Chemicals Body (simulated)", standard: "bluesign", licensee: "Kuasha Fleece Finishing Ltd.", licenseeKey: ["kuasha"], scope: "Fleece dyeing and brushing", validFrom: "2026-06-01", validUntil: "2028-05-31", status: "active", tierId: "t2-dyeing" },
  { certNumber: "OEKO-TRIM-BD-1090", issuer: "Demo Testing Laboratory (simulated)", standard: "OEKO-TEX Standard 100", licensee: "Bonolota Trims & Accessories", licenseeKey: ["bonolota"], scope: "Braided drawcord and brass eyelets", validFrom: "2026-07-01", validUntil: "2028-06-30", status: "active", tierId: "t1-trims" },
];

/** Upper-case alphanumerics only, so "CU 849201 GOTS-2026.001" == "DEMO-GOTS-849201-2026.001". */
export function normalizeCertNumber(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function findCertificateByNumber(certNumber: string): RegistryEntry | null {
  const key = normalizeCertNumber(certNumber);
  if (!key) return null;
  return CERTIFICATE_REGISTRY.find((e) => normalizeCertNumber(e.certNumber) === key) ?? null;
}

let fingerprintIndex: Promise<Map<string, RegistryEntry>> | null = null;

/** sha256(document text) → registry entry, computed once. */
export function getFingerprintIndex(): Promise<Map<string, RegistryEntry>> {
  if (!fingerprintIndex) {
    fingerprintIndex = (async () => {
      const map = new Map<string, RegistryEntry>();
      for (const entry of CERTIFICATE_REGISTRY) {
        if (!entry.documentFixture) continue;
        const hash = await sha256Hex(CERTIFICATE_DOCUMENT_FIXTURES[entry.documentFixture].text);
        map.set(hash, entry);
      }
      return map;
    })();
  }
  return fingerprintIndex;
}

export type CertificateVerdict =
  | "verified"
  | "expired"
  | "revoked"
  | "integrity-mismatch"
  | "licensee-mismatch"
  | "unregistered"
  | "unknown-document";

export type TrafficLight = "green" | "amber" | "red";

export interface VerificationCheck {
  id: "registry-lookup" | "document-integrity" | "licensee-match" | "validity-window";
  label: string;
  pass: boolean | null; // null = not applicable / skipped
  detail: string;
}

export interface CertificateAssessment {
  verdict: CertificateVerdict;
  light: TrafficLight;
  /** Registry entry the document was matched to, if any. */
  entry: RegistryEntry | null;
  /** "registry" = matched by sealed fingerprint; "document" = matched by extracted certificate number; "none". */
  matchedBy: "registry" | "document" | "none";
  checks: VerificationCheck[];
  headline: string;
}

export interface AssessmentInput {
  documentSha256: string;
  extracted: ExtractedCertificate | null;
  /** ISO date used for the validity check (injectable for tests). */
  today: string;
}

const LIGHT: Record<CertificateVerdict, TrafficLight> = {
  verified: "green",
  expired: "red",
  revoked: "red",
  "integrity-mismatch": "red",
  "licensee-mismatch": "red",
  unregistered: "red",
  "unknown-document": "red",
};

export async function assessCertificate(input: AssessmentInput): Promise<CertificateAssessment> {
  const checks: VerificationCheck[] = [];
  const index = await getFingerprintIndex();
  const byFingerprint = index.get(input.documentSha256.toLowerCase()) ?? null;

  let entry: RegistryEntry | null = byFingerprint;
  let matchedBy: CertificateAssessment["matchedBy"] = byFingerprint ? "registry" : "none";

  // 1. Registry lookup
  if (!entry && input.extracted?.certificateNumber) {
    entry = findCertificateByNumber(input.extracted.certificateNumber);
    if (entry) matchedBy = "document";
  }
  checks.push({
    id: "registry-lookup",
    label: "Issuer registry lookup",
    pass: entry ? true : false,
    detail: entry
      ? `${entry.certNumber} found at ${entry.issuer} (${entry.standard})`
      : input.extracted?.certificateNumber
        ? `Certificate number ${input.extracted.certificateNumber} is not in any issuer registry`
        : "No certificate number could be read from the document",
  });

  if (!entry) {
    const verdict: CertificateVerdict = input.extracted?.certificateNumber ? "unregistered" : "unknown-document";
    return finish(verdict, null, "none", checks, input);
  }

  // 2. Document integrity against the issuer's sealed copy
  if (entry.documentFixture) {
    const sealed = await sha256Hex(CERTIFICATE_DOCUMENT_FIXTURES[entry.documentFixture].text);
    const pass = sealed === input.documentSha256.toLowerCase();
    checks.push({
      id: "document-integrity",
      label: "Document fingerprint vs issuer sealed copy",
      pass,
      detail: pass
        ? "SHA-256 matches the issuer's sealed document"
        : "SHA-256 differs from the issuer's sealed copy — the document has been altered or re-issued",
    });
    if (!pass) return finish("integrity-mismatch", entry, matchedBy, checks, input);
  } else {
    checks.push({
      id: "document-integrity",
      label: "Document fingerprint vs issuer sealed copy",
      pass: null,
      detail: "Issuer has not published a sealed fingerprint for this certificate",
    });
  }

  // 3. Licensee match (only meaningful when we matched by content)
  if (matchedBy === "document" && input.extracted) {
    const lic = input.extracted.licensee.toLowerCase();
    const pass = entry.licenseeKey.every((token) => lic.includes(token));
    checks.push({
      id: "licensee-match",
      label: "Licensee matches registry holder",
      pass,
      detail: pass
        ? `Licensee "${input.extracted.licensee}" matches ${entry.licensee}`
        : `Document names "${input.extracted.licensee || "(none)"}" but ${entry.certNumber} belongs to ${entry.licensee}`,
    });
    if (!pass) return finish("licensee-mismatch", entry, matchedBy, checks, input);
  } else {
    checks.push({ id: "licensee-match", label: "Licensee matches registry holder", pass: true, detail: `Sealed copy belongs to ${entry.licensee}` });
  }

  // 4. Status + validity window
  if (entry.status === "revoked") {
    checks.push({ id: "validity-window", label: "Certificate in force", pass: false, detail: "Issuer has revoked this certificate" });
    return finish("revoked", entry, matchedBy, checks, input);
  }
  const until = entry.validUntil;
  const expired = until !== null && until < input.today;
  checks.push({
    id: "validity-window",
    label: "Certificate in force",
    pass: !expired,
    detail: until === null
      ? "Permanent accreditation — no expiry"
      : expired
        ? `Expired on ${until} (today ${input.today})`
        : `Valid through ${until}`,
  });
  return finish(expired ? "expired" : "verified", entry, matchedBy, checks, input);
}

function finish(
  verdict: CertificateVerdict,
  entry: RegistryEntry | null,
  matchedBy: CertificateAssessment["matchedBy"],
  checks: VerificationCheck[],
  input: AssessmentInput
): CertificateAssessment {
  let light = LIGHT[verdict];
  if (verdict === "verified" && matchedBy === "document") light = "amber";
  const headline = HEADLINES[verdict](entry, input);
  return { verdict, light, entry, matchedBy, checks, headline };
}

const HEADLINES: Record<CertificateVerdict, (e: RegistryEntry | null, i: AssessmentInput) => string> = {
  verified: (e) => `VERIFIED: ${e?.certNumber} (${e?.standard}) is in force through ${e?.validUntil ?? "permanent accreditation"}.`,
  expired: (e) => `REJECTED: ${e?.certNumber} expired on ${e?.validUntil}. It cannot be used as evidence until it is renewed.`,
  revoked: (e) => `REJECTED: ${e?.certNumber} has been revoked by ${e?.issuer}.`,
  "integrity-mismatch": (e) => `INTEGRITY VIOLATION: document fingerprint does not match the issuer's sealed copy of ${e?.certNumber}. Treat as forged or altered.`,
  "licensee-mismatch": (e) => `MISMATCH: ${e?.certNumber} is registered to ${e?.licensee}, not to the licensee named in this document.`,
  unregistered: (_e, i) => `UNREGISTERED: certificate ${i.extracted?.certificateNumber} does not exist in any issuer registry.`,
  "unknown-document": () => "UNREADABLE: no certificate number could be extracted from this document; manual review required.",
};

/** Convenience for UI: ISO date → "14 Nov 2027". */
export function formatIsoDate(iso: string | null): string {
  if (!iso) return "No expiry";
  const parsed = parseDateToIso(iso) ?? iso;
  const d = new Date(`${parsed}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
