/**
 * Stress-test set for the Compliance Action Plan: synthetic rule changes (written for testing, not real
 * announcements) against the synthetic demo documents, each labelled with the documents that state the old rule
 * (must be fixed) and the documents that already meet the new one.
 */
export interface Case {
  name: string;
  before: string;
  after: string;
  /** Document ids that state the old value. */
  affected: string[];
  /** Document ids that already state the new value. */
  meets: string[];
  /** A phrase the redrafted policy must contain. */
  draft?: string;
}

export const ACTION_PLAN_CASES: Case[] = [
  { name: "Minimum wage rises", before: "The legal minimum wage for the garment sector is BDT 12,500 per month for the entry grade.", after: "The legal minimum wage for the garment sector is BDT 15,000 per month for the entry grade.", affected: ["wage-policy"], meets: [], draft: "BDT 15,000 per month" },
  { name: "Wages paid sooner", before: "Wages must be paid no later than the seventh working day of the following month.", after: "Wages must be paid no later than the fifth working day of the following month.", affected: ["wage-policy"], meets: [], draft: "fifth working day" },
  { name: "Weekly cap with overtime falls", before: "Total working hours, including overtime, must not exceed 60 hours per week.", after: "Total working hours, including overtime, must not exceed 56 hours per week.", affected: ["working-hours"], meets: [], draft: "56 hours per week" },
  { name: "Regular weekly hours fall", before: "Regular working hours must not exceed 48 hours per week.", after: "Regular working hours must not exceed 44 hours per week.", affected: ["working-hours"], meets: [], draft: "44 hours per week" },
  { name: "Regular daily hours fall", before: "Regular working hours must not exceed 8 hours per day.", after: "Regular working hours must not exceed 7 hours per day.", affected: ["working-hours"], meets: [], draft: "7 hours per day" },
  { name: "Daily overtime limit falls (unrelated '2 January' in another document)", before: "Overtime must not exceed 2 hours per day.", after: "Overtime must not exceed 1 hour per day.", affected: ["working-hours"], meets: [] },
  { name: "Minimum age rises (already met)", before: "No one under the age of 14 may be employed.", after: "No one under the age of 18 may be employed in garment production.", affected: [], meets: ["child-labour"] },
  { name: "Fire drills more often (already met)", before: "Fire evacuation drills must be held at least every six months.", after: "Fire evacuation drills must be held at least every three months.", affected: [], meets: ["fire-licence"] },
  { name: "Day-care rule (no document covers it)", before: "A day-care room is required when 40 or more women workers are employed.", after: "A day-care room is required when 30 or more women workers are employed.", affected: [], meets: [] },
  { name: "Wording change with no new value", before: "Workers may raise concerns with the welfare officer.", after: "Workers may raise concerns with the welfare officer or a worker representative.", affected: [], meets: [] },
];
