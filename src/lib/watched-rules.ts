/**
 * Rules Bunon watches for a factory, each with its versions. When a newer version appears than the one the factory
 * last reviewed, the Compliance Action Plan page reports it as a change and builds a plan for it.
 *
 * These versions are DEMO DATA: plausible wording written for the demo, not real announcements. Real feeds (the
 * Bangladesh Gazette, DIFE notices, EUR-Lex, buyers' published codes) are the next step.
 */
export interface RuleVersion {
  version: number;
  date: string;
  text: string;
}

export interface WatchedRule {
  id: string;
  name: string;
  source: string;
  versions: RuleVersion[];
}

export const WATCHED_RULES: WatchedRule[] = [
  {
    id: "min-wage",
    name: "Garment sector minimum wage",
    source: "Minimum Wage Board (demo versions, not a real announcement)",
    versions: [
      { version: 1, date: "2023-12-01", text: "The legal minimum wage for the garment sector is BDT 12,500 per month for the entry grade." },
      { version: 2, date: "2026-11-15", text: "The legal minimum wage for the garment sector is BDT 15,000 per month for the entry grade." },
    ],
  },
  {
    id: "wage-payment",
    name: "When wages must be paid",
    source: "Labour rules (demo versions, not a real announcement)",
    versions: [
      { version: 1, date: "2015-01-01", text: "Wages must be paid no later than the seventh working day of the following month." },
      { version: 2, date: "2026-11-10", text: "Wages must be paid no later than the fifth working day of the following month." },
    ],
  },
  {
    id: "weekly-hours",
    name: "Weekly working hours cap",
    source: "Nordlys supplier code of conduct (fictional brand, demo versions)",
    versions: [
      { version: 1, date: "2024-01-01", text: "Total working hours, including overtime, must not exceed 60 hours per week." },
      { version: 2, date: "2026-11-01", text: "Total working hours, including overtime, must not exceed 56 hours per week." },
    ],
  },
  {
    id: "minimum-age",
    name: "Minimum age for garment work",
    source: "Vela Outfitters supplier code (fictional brand, demo versions)",
    versions: [
      { version: 1, date: "2022-01-01", text: "No one under the age of 14 may be employed." },
      { version: 2, date: "2026-10-20", text: "No one under the age of 18 may be employed in garment production." },
    ],
  },
];

export const latest = (r: WatchedRule) => r.versions[r.versions.length - 1];
export const versionOf = (r: WatchedRule, v: number) => r.versions.find((x) => x.version === v) ?? r.versions[0];
