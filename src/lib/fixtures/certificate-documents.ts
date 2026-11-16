/**
 * Demo certificate documents used by the Document Ingestion Engine's three test scenarios.
 *
 * They are plain-text renderings of what the scanned PDFs would contain, so the SAME
 * extraction + registry pipeline that handles a real upload runs on them (local SLM or rules),
 * and their SHA-256 fingerprints are what the issuer registry knows about.
 *
 *  - valid     → Padmaloom Spinning Mills' renewed GOTS scope certificate (registered fingerprint)
 *  - expired   → the previous certificate that lapsed on 2026-07-14 (registered, expired)
 *  - tampered  → a forged copy of the renewed certificate with an altered licensee and scope;
 *                its fingerprint does not match the issuer's sealed copy
 */

export type CertificateScenario = "valid" | "expired" | "tampered";

export interface CertificateDocumentFixture {
  scenario: CertificateScenario;
  fileName: string;
  sizeLabel: string;
  mimeType: string;
  text: string;
}

const RENEWED_TEXT = `DEMO CERTIFICATION BODY B.V. (SIMULATED DOCUMENT FOR DEMONSTRATION)
SCOPE CERTIFICATE
Global Organic Textile Standard (GOTS) Version 7.0
Licence Number: CU 849201
Certificate Number: DEMO-GOTS-849201-2026.001
This is to certify that Padmaloom Spinning Mills Ltd., Chowrasta, Gazipur, Bangladesh has been inspected and assessed in accordance with GOTS.
Scope: Spinning of organic combed ring-spun yarn (Ne 20/1), trading
Products: Organic cotton yarn, 100% organic cotton
Valid from: 15 October 2026
Valid until: 14 November 2027
Place and date of issue: Zwolle, The Netherlands, 15 October 2026
Authorised signatory: Demo Certification Body B.V. (simulated), 1 Example Street, Demo City`;

const EXPIRED_TEXT = `DEMO CERTIFICATION BODY B.V. (SIMULATED DOCUMENT FOR DEMONSTRATION)
SCOPE CERTIFICATE
Global Organic Textile Standard (GOTS) Version 6.0
Licence Number: CU 849201
Certificate Number: DEMO-GOTS-849201-2024.001
This is to certify that Padmaloom Spinning Mills Ltd., Chowrasta, Gazipur, Bangladesh has been inspected and assessed in accordance with GOTS.
Scope: Spinning of organic combed ring-spun yarn (Ne 20/1), trading
Products: Organic cotton yarn, 100% organic cotton
Valid from: 15 July 2024
Valid until: 14 July 2026
Place and date of issue: Zwolle, The Netherlands, 15 July 2024
Authorised signatory: Demo Certification Body B.V. (simulated), 1 Example Street, Demo City`;

const TAMPERED_TEXT = `DEMO CERTIFICATION BODY B.V. (SIMULATED DOCUMENT FOR DEMONSTRATION)
SCOPE CERTIFICATE
Global Organic Textile Standard (GOTS) Version 7.0
Licence Number: CU 849201
Certificate Number: DEMO-GOTS-849201-2026.001
This is to certify that Padmaloom Spinning & Weaving Ltd., Unit 2, Chowrasta, Gazipur, Bangladesh has been inspected and assessed in accordance with GOTS.
Scope: Spinning of organic combed ring-spun yarn (Ne 20/1), weaving, dyeing, trading
Products: Organic cotton yarn, organic denim fabric, 100% organic cotton
Valid from: 15 October 2026
Valid until: 14 November 2028
Place and date of issue: Zwolle, The Netherlands, 15 October 2026
Authorised signatory: Demo Certification Body B.V. (simulated), 1 Example Street, Demo City`;

export const CERTIFICATE_DOCUMENT_FIXTURES: Record<CertificateScenario, CertificateDocumentFixture> = {
  valid: {
    scenario: "valid",
    fileName: "Padmaloom_GOTS_2027_RENEWED.pdf",
    sizeLabel: "418.2 KB",
    mimeType: "application/pdf",
    text: RENEWED_TEXT,
  },
  expired: {
    scenario: "expired",
    fileName: "Padmaloom_GOTS_2024_EXPIRED.pdf",
    sizeLabel: "389.0 KB",
    mimeType: "application/pdf",
    text: EXPIRED_TEXT,
  },
  tampered: {
    scenario: "tampered",
    fileName: "Padmaloom_GOTS_FORGED_COPY.pdf",
    sizeLabel: "112.5 KB",
    mimeType: "application/pdf",
    text: TAMPERED_TEXT,
  },
};

export function isCertificateScenario(value: unknown): value is CertificateScenario {
  return value === "valid" || value === "expired" || value === "tampered";
}
