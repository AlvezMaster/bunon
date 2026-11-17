/**
 * Bangla → English search words for compliance questions, so a Bangla question can find passages in English
 * documents on a factory's own computer, with no embedding model and no internet.
 *
 * Found by the language bias check (scripts/eval-bias.ts): with keyword search alone, Bangla questions found the
 * right document 0 of 12 times against 10 of 12 for the same questions in English. Meaning search (embeddings)
 * also bridges languages when it is available; this glossary is the offline fallback and is used alongside it.
 * Keys are word beginnings, so inflected forms match (শ্রমিক, শ্রমিকদের, শ্রমিকরা).
 */
const GLOSSARY: Array<[string, string]> = [
  ["অগ্নি", "fire"], ["আগুন", "fire"], ["ফায়ার", "fire"], ["সার্ভিস", "service"],
  ["লাইসেন্স", "licence license"], ["হালনাগাদ", "valid current"], ["বৈধ", "valid"], ["মেয়াদ", "valid expiry"],
  ["মহড়া", "drill evacuation"], ["খালি", "evacuation"], ["জরুরি", "emergency"],
  ["ভবন", "building"], ["কাঠামো", "structural"], ["প্রকৌশলী", "engineer"], ["পরিদর্শন", "inspection assessment"],
  ["মূল্যায়ন", "assessment"], ["নিরাপত্তা", "safety"], ["স্বাধীন", "independent"], ["বৈদ্যুতিক", "electrical"],
  ["কর্মী", "worker workers"], ["শ্রমিক", "worker workers"], ["কর্মচারী", "worker workers"],
  ["মজুরি", "wage wages"], ["বেতন", "wage wages paid"], ["ন্যূনতম", "minimum"], ["আইন", "legal law"],
  ["সময়মতো", "time paid"], ["নির্ধারিত", "time"], ["মাস", "month monthly"], ["বোনাস", "bonus"],
  ["ওভারটাইম", "overtime"], ["অতিরিক্ত", "overtime extra"], ["শিফট", "shift"], ["সাপ্তাহিক", "week weekly"], ["সপ্তাহ", "week"],
  ["কর্মঘণ্টা", "working hours"], ["ঘণ্টা", "hours"], ["সর্বোচ্চ", "maximum"], ["সীমা", "maximum limit"],
  ["স্বেচ্ছা", "voluntary"], ["অস্বীকার", "refuse voluntary"], ["শাস্তি", "punished penalty"], ["জোর", "forced"],
  ["শিশু", "child children"], ["বয়স", "age"], ["নিয়োগ", "recruitment employ"], ["যাচাই", "verification verified"],
  ["অভিযোগ", "grievance grievances complaint"], ["নাম", "anonymously name"],
  ["তুলা", "cotton"], ["সুতা", "yarn"], ["অর্গানিক", "organic"], ["জৈব", "organic"], ["সনদ", "certificate certified"],
  ["নারী", "female women"], ["মহিলা", "female women"], ["শতাংশ", "percentage"], ["মোট", "total headcount"], ["কতজন", "headcount total"],
  ["পানি", "water"], ["পরিকল্পনা", "plan"], ["বিরোধ", "dispute"], ["ইউনিয়ন", "union"], ["হয়রানি", "harassment"],
  ["বৈষম্য", "discrimination"], ["চিকিৎসা", "medical"], ["দুর্ঘটনা", "accident"], ["রাসায়নিক", "chemical"], ["ছুটি", "leave"],
  ["মাতৃত্ব", "maternity"],
];

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * Bangla question words that ask for a value (when, how many, what, which, where, how, who). "কি" (the yes/no
 * particle) is not one of them, and "কোনো" ("any") is not "কোন" ("which"). Found by the language bias check.
 */
export const BANGLA_VALUE_QUESTION = /(কবে|কখন|কত|কোথায়|কীভাবে|কারা|কী|কোন(?!ো))/;

/** English search words for the Bangla terms in a question ("" for a question with no Bangla). */
export function englishTerms(text: string): string {
  if (!/[ঀ-৿]/.test(text)) return "";
  const out = new Set<string>();
  for (const w of text.split(/[^ঀ-৿‌‍0-9]+/).filter(Boolean)) {
    if (/^[০-৯0-9]+$/.test(w)) out.add(w.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d))));
    for (const [bn, en] of GLOSSARY) if (w.startsWith(bn)) for (const e of en.split(" ")) out.add(e);
  }
  return [...out].join(" ");
}

/** The question followed by English search words for any Bangla terms in it. */
export function withEnglishTerms(text: string): string {
  const extra = englishTerms(text);
  return extra ? `${text} ${extra}` : text;
}
