/**
 * The same questions in English and in Bangla, for the language bias check (scripts/eval-bias.ts).
 * Bangla wording is ours, written the way a factory clerk would ask; labels match the English originals.
 */
import { BUYER_QUESTIONNAIRE } from "../src/lib/questionnaire.ts";

/** Retrieval: reworded questions and the demo document that should answer each. */
export const SEARCH_PAIRS: Array<{ en: string; bn: string; doc: string }> = [
  { en: "Is there an up-to-date licence from the fire service?", bn: "ফায়ার সার্ভিসের হালনাগাদ লাইসেন্স আছে কি?", doc: "fire-licence" },
  { en: "How recently did staff practise evacuating the building?", bn: "কর্মীরা সর্বশেষ কবে ভবন খালি করার মহড়া করেছেন?", doc: "fire-licence" },
  { en: "Do employees earn at least what the law requires?", bn: "কর্মীরা কি অন্তত আইনে নির্ধারিত পরিমাণ মজুরি পান?", doc: "wage-policy" },
  { en: "What is the cap on weekly hours when extra shifts are included?", bn: "অতিরিক্ত শিফটসহ সাপ্তাহিক কর্মঘণ্টার সর্বোচ্চ সীমা কত?", doc: "working-hours" },
  { en: "Can staff refuse extra hours without being punished?", bn: "শাস্তি ছাড়াই কি কর্মীরা অতিরিক্ত সময় কাজ করতে অস্বীকার করতে পারেন?", doc: "working-hours" },
  { en: "Do you use child workers?", bn: "আপনারা কি শিশু শ্রমিক নিয়োগ করেন?", doc: "child-labour" },
  { en: "How do you check how old new hires are?", bn: "নতুন কর্মীদের বয়স কীভাবে যাচাই করেন?", doc: "child-labour" },
  { en: "Is there a way for workers to complain without giving their name?", bn: "নাম না জানিয়ে শ্রমিকদের অভিযোগ করার কোনো উপায় আছে কি?", doc: "grievance" },
  { en: "Has a structural engineer inspected the premises?", bn: "কোনো কাঠামো প্রকৌশলী কি ভবন পরিদর্শন করেছেন?", doc: "building-safety" },
  { en: "Are salaries paid on schedule?", bn: "বেতন কি নির্ধারিত সময়ে দেওয়া হয়?", doc: "wage-policy" },
  { en: "How large is your workforce?", bn: "আপনার কারখানায় মোট কতজন শ্রমিক কাজ করেন?", doc: "headcount" },
  { en: "Is your cotton certified organic?", bn: "আপনার তুলা কি অর্গানিক সনদপ্রাপ্ত?", doc: "gots-yarn-2024" },
];

/**
 * Held-out pairs, written after src/lib/bangla-glossary.ts; the glossary was not changed after seeing these
 * results, so they show how it does on wording it was not built around.
 */
export const SEARCH_HELD_OUT: Array<{ en: string; bn: string; doc: string }> = [
  { en: "When does the fire licence expire?", bn: "অগ্নিনির্বাপণ লাইসেন্সের মেয়াদ কবে শেষ হবে?", doc: "fire-licence" },
  { en: "Is there any child labour in your factory?", bn: "আপনাদের কারখানায় কি বাল্যশ্রম আছে?", doc: "child-labour" },
  { en: "Can workers make complaints in confidence?", bn: "শ্রমিকরা কি গোপনে অভিযোগ দিতে পারেন?", doc: "grievance" },
  { en: "Has an engineer examined the factory building?", bn: "কারখানার ভবন কি কোনো প্রকৌশলী পরীক্ষা করেছেন?", doc: "building-safety" },
  { en: "By what date are wages paid?", bn: "বেতন মাসের কোন তারিখের মধ্যে দেওয়া হয়?", doc: "wage-policy" },
  { en: "How many women work in the factory?", bn: "কারখানায় নারী শ্রমিক কতজন?", doc: "headcount" },
  { en: "Is anyone forced to work overtime?", bn: "ওভারটাইম করতে কাউকে কি বাধ্য করা হয়?", doc: "working-hours" },
  { en: "Do you use GOTS-certified yarn?", bn: "আপনারা কি জিওটিএস সনদপ্রাপ্ত সুতা ব্যবহার করেন?", doc: "gots-yarn-2024" },
];

const BN: Record<string, string> = {
  q01: "কারখানার কি বৈধ অগ্নি লাইসেন্স আছে?",
  q02: "সর্বশেষ অগ্নি মহড়া কবে হয়েছিল?",
  q03: "সব শ্রমিককে কি অন্তত আইনগত ন্যূনতম মজুরি দেওয়া হয়?",
  q04: "ওভারটাইমসহ সপ্তাহে সর্বোচ্চ কত ঘণ্টা কাজ করা যায়?",
  q05: "ওভারটাইম কি স্বেচ্ছায় করা হয়?",
  q06: "কারখানায় কি ১৮ বছরের কম বয়সী কাউকে নিয়োগ দেওয়া হয়?",
  q07: "নিয়োগের সময় শ্রমিকদের বয়স যাচাইয়ের কোনো পদ্ধতি আছে কি?",
  q08: "শ্রমিকরা কি নাম প্রকাশ না করে অভিযোগ জানাতে পারেন?",
  q09: "মোট শ্রমিকের কত শতাংশ নারী?",
  q10: "ভবনের নিরাপত্তা নিয়ে কি স্বাধীন মূল্যায়ন সম্পন্ন হয়েছে?",
  q11: "প্রতি মাসে কি সময়মতো মজুরি দেওয়া হয়?",
  q12: "আগামী তিন বছরে পানির ব্যবহার কমানোর পরিকল্পনা বর্ণনা করুন।",
  q13: "গত ১২ মাসে কারখানায় কোনো শ্রম বিরোধ হয়েছে কি?",
};

/** Drafting: the 13 labelled questionnaire questions, each in English and in Bangla. */
export const ANSWER_PAIRS = BUYER_QUESTIONNAIRE.questions.map((q) => ({ ...q, bn: BN[q.id] }));
