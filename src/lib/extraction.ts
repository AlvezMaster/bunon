/**
 * Deterministic, rules-based field extraction for textile scope certificates.
 *
 * This is the offline fallback (and cross-check) for the local-SLM extractor: when Ollama is
 * not running, the pipeline still produces structured fields from the certificate text.
 * Isomorphic (no Node APIs) so it can also run in the browser if needed.
 */

export interface ExtractedCertificate {
  certificateNumber: string;
  issuer: string;
  standard: string;
  licensee: string;
  validFrom: string;
  /** ISO date (YYYY-MM-DD) when parseable, else the raw phrase. */
  validUntil: string;
  scope: string;
}

export interface RuleExtraction {
  extracted: ExtractedCertificate;
  /** 0..1 — fraction of the five key fields (number, issuer, standard, licensee, validUntil) found. */
  confidence: number;
  fieldsFound: string[];
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

/** Parses "14 November 2027", "November 14, 2027", "2027-11-14", "14/11/2027", "14.11.2027" → ISO date. */
export function parseDateToIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/);
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  m = s.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  m = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) return iso(+m[3], +m[2], +m[1]); // day-first (EU/BD convention)
  m = s.match(/([A-Za-z]{3,9})\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) {
    // "November 2027" → last day of that month
    const y = +m[2];
    const mo = MONTHS[m[1].toLowerCase()];
    const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return iso(y, mo, lastDay);
  }
  return null;
}

function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const ISSUERS: Array<[RegExp, string]> = [
  [/demo\s+certification\s+body/i, "Demo Certification Body (simulated)"],
  [/control\s*union/i, "Control Union Certifications"],
  [/hohenstein/i, "Hohenstein Institute"],
  [/testex/i, "TESTEX AG"],
  [/oeko-?tex\s+(?:association|service)/i, "OEKO-TEX Association"],
  [/bluesign/i, "bluesign technologies"],
  [/usgbc|u\.?s\.? green building council/i, "USGBC"],
  [/amfori/i, "amfori"],
  [/ecocert/i, "Ecocert"],
  [/intertek/i, "Intertek"],
  [/sgs\b/i, "SGS"],
  [/t[üu]v\s*s[üu]d/i, "TÜV SÜD"],
  [/textile\s+exchange/i, "Textile Exchange"],
];

const STANDARDS: Array<[RegExp, string]> = [
  [/global\s+organic\s+textile\s+standard|\bGOTS\b/i, "GOTS"],
  [/global\s+recycled\s+standard|\bGRS\b/i, "GRS"],
  [/oeko-?tex\s+standard\s*100|standard\s*100/i, "OEKO-TEX Standard 100"],
  [/\bZDHC\b/i, "ZDHC MRSL"],
  [/\bLEED\b/i, "LEED"],
  [/\bBSCI\b/i, "amfori BSCI"],
  [/bluesign/i, "bluesign"],
  [/organic\s+content\s+standard|\bOCS\b/i, "OCS"],
  [/\bWRAP\b/, "WRAP"],
];

function pickFirst(text: string, table: Array<[RegExp, string]>): string {
  for (const [re, label] of table) if (re.test(text)) return label;
  return "";
}

export function extractCertificateByRules(text: string): RuleExtraction {
  const t = text.replace(/\r/g, "");
  const found: string[] = [];

  // Certificate number: prefer explicit labels, else licence number, else a GOTS/GRS/OEKO style token.
  let certificateNumber = "";
  // "Certificate Number: X", "Certificate No. X", "Cert #: X", "Scope Certificate No: X" — the token must contain a digit.
  const certLabel = t.match(/\b(?:scope\s+certificate|certificate|cert\.?|registration)\s*(?:no\.?|number|nr\.?|id|#)?\s*[:#]\s*([A-Z0-9][A-Z0-9./-]*\d[A-Z0-9./-]*)/i);
  if (certLabel) certificateNumber = certLabel[1].toUpperCase();
  if (!certificateNumber) {
    const licence = t.match(/\blicen[cs]e\s*(?:no\.?|number|nr\.?|#)?\s*[:#]\s*([A-Z]{1,6}\s?\d{3,}[A-Z0-9./-]*)/i);
    if (licence) certificateNumber = licence[1].replace(/\s+/g, "").toUpperCase();
  }
  if (!certificateNumber) {
    const token = t.match(/\b(?:GOTS|GRS|OEKO|CU|TX|LEED|BSCI|GRS|SC)[-\s]?[A-Z0-9][A-Z0-9-]{4,}\b/i);
    if (token) certificateNumber = token[0].replace(/\s+/g, "").toUpperCase();
  }
  if (certificateNumber) found.push("certificateNumber");

  const issuer = pickFirst(t, ISSUERS);
  if (issuer) found.push("issuer");

  const standard = pickFirst(t, STANDARDS);
  if (standard) found.push("standard");

  // Licensee: "certify that X has/have been", "Licensee: X", "issued to X", "Company: X"
  let licensee = "";
  const lic =
    t.match(/certif(?:y|ies)\s+that\s+(.+?)(?:,\s*(?:located|situated)|\s+has\s+been|\s+have\s+been|\s+is\s+|\s*\n)/i) ||
    t.match(/licen[cs]ee\s*[:#]?\s*(.+?)(?:\n|$)/i) ||
    t.match(/(?:issued\s+to|certificate\s+holder|company(?:\s+name)?)\s*[:#]?\s*(.+?)(?:\n|$)/i);
  if (lic) licensee = lic[1].trim().replace(/[.;]+$/, "");
  if (licensee) found.push("licensee");

  // Validity
  let validFrom = "";
  let validUntil = "";
  const until = t.match(/(?:valid\s+(?:until|to|through|till)|expir(?:y|es|ation)(?:\s+date)?|end\s+of\s+validity)\s*[:#]?\s*([^\n]+)/i);
  if (until) validUntil = parseDateToIso(until[1]) ?? until[1].trim();
  const from = t.match(/(?:valid\s+from|issue(?:d)?\s+(?:date|on)|start\s+of\s+validity|date\s+of\s+issue)\s*[:#]?\s*([^\n]+)/i);
  if (from) validFrom = parseDateToIso(from[1]) ?? from[1].trim();
  if (validUntil) found.push("validUntil");

  let scope = "";
  const sc = t.match(/scope\s*(?:of\s+certification)?\s*[:#]\s*([^\n]+)/i);
  if (sc) scope = sc[1].trim();

  const keyFields = ["certificateNumber", "issuer", "standard", "licensee", "validUntil"];
  const confidence = keyFields.filter((f) => found.includes(f)).length / keyFields.length;

  return {
    extracted: { certificateNumber, issuer, standard, licensee, validFrom, validUntil, scope },
    confidence,
    fieldsFound: found,
  };
}
