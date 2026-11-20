/**
 * Document library: the documents buyers usually ask a garment factory for, and which of them a factory has on file.
 * Matching is by the document's title or file name (a factory names its uploads), so it is a checklist aid, not a
 * judgement of the document's content. Pure functions, unit-tested in tests/document-library.test.ts.
 */

export interface StandardDocument {
  key: string;
  name: string;
  /** Why buyers ask for it, in one line. */
  why: string;
  match: RegExp;
}

export const STANDARD_DOCUMENTS: StandardDocument[] = [
  { key: "fire", name: "Fire licence and drill records", why: "Fire safety is the first thing every brand checks.", match: /fire/i },
  { key: "trade", name: "Trade licence", why: "Shows the factory is registered to make garments.", match: /trade\s*licen/i },
  { key: "building", name: "Building or structural safety report", why: "Required by brands since Rana Plaza.", match: /building|structur/i },
  { key: "wages", name: "Wage and benefits policy", why: "Minimum wage, pay dates and overtime pay.", match: /wage|salar|pay\b/i },
  { key: "hours", name: "Working hours and overtime policy", why: "Weekly hours cap and voluntary overtime.", match: /hour|overtime/i },
  { key: "age", name: "Child labour and age verification policy", why: "Minimum age and how ages are checked.", match: /child|age\s*verif|minimum\s*age/i },
  { key: "grievance", name: "Grievance procedure", why: "How workers raise concerns, including anonymously.", match: /grievance|complain|whistle/i },
  { key: "workforce", name: "Workforce headcount", why: "How many workers, by shift and gender.", match: /headcount|workforce|employee\s*list/i },
  { key: "certificates", name: "Certificates (GOTS, OEKO-TEX, BSCI, WRAP…)", why: "Third-party certificates buyers rely on.", match: /gots|oeko|bsci|amfori|wrap|sedex|smeta|certif/i },
];

export interface LibraryDocument {
  id: string;
  title: string;
  fileName: string;
  validUntil?: string | null;
}

export type ItemStatus = "on-file" | "expiring" | "expired" | "missing";

export interface ChecklistItem {
  doc: StandardDocument;
  status: ItemStatus;
  /** Days until the soonest expiry among its documents; null without a date. */
  daysLeft: number | null;
  matches: LibraryDocument[];
}

export const SOON_DAYS = 60;

const daysUntil = (iso: string, today: Date) => {
  const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.round((t - day) / 864e5) : null;
};

/** For each standard document: whether the factory has it, and whether it has expired or expires soon. */
export function checklist(docs: LibraryDocument[], today = new Date()): ChecklistItem[] {
  return STANDARD_DOCUMENTS.map((doc) => {
    const matches = docs.filter((d) => doc.match.test(`${d.title} ${d.fileName}`));
    // The document that stays valid longest decides: a renewed licence covers an old expired copy.
    const days = matches.map((d) => (d.validUntil ? daysUntil(d.validUntil, today) : null));
    const dated = days.filter((x): x is number => x !== null);
    const undated = days.some((x) => x === null);
    const best = dated.length ? Math.max(...dated) : null;
    const status: ItemStatus = !matches.length ? "missing" : undated || best === null || best > SOON_DAYS ? "on-file" : best < 0 ? "expired" : "expiring";
    return { doc, status, daysLeft: status === "on-file" && undated ? null : best, matches };
  });
}
