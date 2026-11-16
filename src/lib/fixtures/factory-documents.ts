/**
 * SYNTHETIC DEMO DOCUMENTS for the fictional factory Nodiwear Apparel Ltd.
 * They exist so the questionnaire drafting can be demonstrated and measured end to end.
 * Nothing here describes a real company; all numbers are invented for the demo.
 */
import { CERTIFICATE_DOCUMENT_FIXTURES } from "./certificate-documents.ts";

export interface FactoryDocument {
  id: string;
  title: string;
  fileName: string;
  /** Plain text; paragraphs separated by blank lines. */
  text: string;
}

export const FACTORY_DOCUMENTS: FactoryDocument[] = [
  {
    id: "fire-licence",
    title: "Fire licence and drill log",
    fileName: "fire_licence_2027.pdf",
    text: `Fire Service and Civil Defence licence (synthetic demo document). Licence number FSCD-DEMO-2027-0418 is issued to Nodiwear Apparel Ltd., Ashulia, Dhaka.

The licence is valid until 30 June 2027.

Fire evacuation drills are held every three months on every floor.

The last fire evacuation drill was held on 12 October 2026, and all 1,240 workers on shift left the building in 3 minutes 40 seconds.`,
  },
  {
    id: "trade-licence",
    title: "Trade licence",
    fileName: "trade_licence_2027.pdf",
    text: `Trade licence (synthetic demo document). Licence number TL-DEMO-55021 is issued to Nodiwear Apparel Ltd. for the manufacture of knit and woven garments.

The trade licence is valid until 30 June 2027.`,
  },
  {
    id: "wage-policy",
    title: "Wage and benefits policy",
    fileName: "wage_policy_2026.pdf",
    text: `Wage and benefits policy (synthetic demo document), approved by the managing director on 2 January 2026.

All workers are paid at or above the legal minimum wage for the garment sector, which is BDT 12,500 per month for the entry grade.

Wages are paid by bank transfer or mobile financial service no later than the seventh working day of the following month.

Overtime is paid at twice the basic hourly rate.

Every worker receives a payslip that shows basic pay, allowances, overtime hours and deductions.`,
  },
  {
    id: "working-hours",
    title: "Working hours policy",
    fileName: "working_hours_policy.pdf",
    text: `Working hours policy (synthetic demo document).

Regular working hours are 8 hours per day and 48 hours per week.

Overtime is voluntary and is limited to 2 hours per day.

Total working hours, including overtime, never exceed 60 hours per week.

Every worker has one paid day off each week, on Friday.`,
  },
  {
    id: "child-labour",
    title: "Child labour and age verification policy",
    fileName: "age_verification_policy.pdf",
    text: `Child labour and age verification policy (synthetic demo document).

Nodiwear Apparel Ltd. does not employ anyone under the age of 18.

Age is verified at recruitment using the national ID card or birth registration certificate, and a doctor's age-verification check when the documents are in doubt.

Copies of age documents are kept in each worker's personnel file.`,
  },
  {
    id: "grievance",
    title: "Grievance procedure",
    fileName: "grievance_procedure.pdf",
    text: `Grievance procedure (synthetic demo document).

Workers can raise a grievance anonymously through a locked suggestion box on every floor or through a toll-free hotline run by an outside organisation.

The Participation Committee, elected by workers, meets every month to review grievances.

No worker may be punished for raising a grievance.`,
  },
  {
    id: "building-safety",
    title: "Building safety assessment",
    fileName: "building_safety_assessment_2026.pdf",
    text: `Building safety assessment summary (synthetic demo document).

An independent engineer completed a structural, electrical and fire safety assessment of the factory building on 18 March 2026.

All remediation items from the assessment were closed by 30 September 2026.`,
  },
  {
    id: "headcount",
    title: "Workforce headcount report",
    fileName: "headcount_2026-10.xlsx",
    text: `Workforce headcount report (synthetic demo document), as of 31 October 2026.

Total workers: 1,312.

Female workers: 742. Male workers: 570.`,
  },
  {
    id: "gots-yarn-2024",
    title: "Yarn supplier GOTS certificate (2024)",
    fileName: CERTIFICATE_DOCUMENT_FIXTURES.expired.fileName,
    text: CERTIFICATE_DOCUMENT_FIXTURES.expired.text,
  },
];

export function findFactoryDocument(id: string): FactoryDocument | undefined {
  return FACTORY_DOCUMENTS.find((d) => d.id === id);
}
