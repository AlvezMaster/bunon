/**
 * Hides personal data before text is sent to a cloud AI model, and puts it back into the model's reply.
 *
 * The cloud model sees placeholders such as [PHONE_1]; the real values never leave Bunon's server. Because the
 * reply is unmasked before any check runs, a quoted sentence still matches the factory's document word for word.
 * On a factory's own computer (Ollama) nothing is masked, because nothing leaves the machine.
 *
 * Masked: email addresses; phone numbers (Bangladesh, and international with a + prefix); national ID, birth
 * registration and account numbers (10–17 digits, English or Bangla digits); personal names after a title
 * (Mr, Ms, Md, Mst, Dr, Engr, জনাব, মোঃ, মোছাঃ) or a "Name:" label. Counts, money, dates and licence numbers stay.
 */

export type PersonalKind = "EMAIL" | "PHONE" | "ID" | "PERSON";

const D = "[0-9০-৯]";
const RULES: Array<{ kind: PersonalKind; re: RegExp; group?: number }> = [
  { kind: "EMAIL", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  // Bangladesh mobile numbers: 01XXXXXXXXX or +880 1XXXXXXXXX, with optional spaces or dashes.
  { kind: "PHONE", re: new RegExp(`(?:\\+?(?:880|৮৮০)[\\s-]?|[0০])[1১][3-9৩-৯]${D}{2}[\\s-]?${D}{3}[\\s-]?${D}{3}(?!${D})`, "g") },
  // Other international numbers written with a + prefix.
  { kind: "PHONE", re: /\+\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}(?!\d)/g },
  { kind: "ID", re: new RegExp(`(?<!${D})${D}{10,17}(?!${D})`, "g") },
  { kind: "PERSON", re: /\b(?:Mr|Mrs|Ms|Miss|Md|Mst|Mohd|Dr|Engr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/g, group: 1 },
  { kind: "PERSON", re: /\b(?:[Nn]ame|[Cc]ontact person)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/g, group: 1 },
  { kind: "PERSON", re: /(?:জনাব|মোঃ|মোছাঃ|মোসাঃ)\s*([ঀ-৿]+(?:\s+[ঀ-৿]+)?)/g, group: 1 },
];

const PLACEHOLDER = /\[(EMAIL|PHONE|ID|PERSON)_(\d+)\]/g;

export interface Masker {
  /** Replaces personal data with placeholders; the same value always gets the same placeholder. */
  mask(text: string): string;
  /** Puts the real values back into plain text. */
  unmask(text: string): string;
  /** Puts the real values back into a JSON string, escaped so the JSON stays valid. */
  unmaskJson(json: string): string;
  /** How many different values were masked, by kind. */
  counts(): Record<PersonalKind, number>;
}

export function createMasker(): Masker {
  const byValue = new Map<string, string>();
  const byPlaceholder = new Map<string, string>();
  const n: Record<PersonalKind, number> = { EMAIL: 0, PHONE: 0, ID: 0, PERSON: 0 };

  const placeholder = (kind: PersonalKind, value: string) => {
    const key = `${kind}|${value}`;
    let p = byValue.get(key);
    if (!p) {
      p = `[${kind}_${++n[kind]}]`;
      byValue.set(key, p);
      byPlaceholder.set(p, value);
    }
    return p;
  };

  const restore = (text: string, escape: (s: string) => string) =>
    text.replace(PLACEHOLDER, (p) => {
      const v = byPlaceholder.get(p);
      return v === undefined ? p : escape(v);
    });

  return {
    mask(text) {
      let out = text;
      for (const { kind, re, group } of RULES) {
        out = out.replace(re, (whole, ...g) => {
          if (!group) return placeholder(kind, whole);
          const name = g[group - 1] as string;
          return whole.slice(0, whole.lastIndexOf(name)) + placeholder(kind, name);
        });
      }
      return out;
    },
    unmask: (text) => restore(text, (v) => v),
    unmaskJson: (json) => restore(json, (v) => JSON.stringify(v).slice(1, -1)),
    counts: () => ({ ...n }),
  };
}

/** Text sent to the cloud model gets this note whenever something was masked. */
export const PLACEHOLDER_NOTE =
  "Personal data in the text has been replaced by placeholders such as [PERSON_1] or [PHONE_1]. Copy a placeholder exactly as written whenever you quote it.";
