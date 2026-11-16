import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256Hex } from "../src/lib/crypto.ts";
import { extractCertificateByRules } from "../src/lib/extraction.ts";
import { CERTIFICATE_DOCUMENT_FIXTURES } from "../src/lib/fixtures/certificate-documents.ts";
import {
  CERTIFICATE_REGISTRY,
  assessCertificate,
  findCertificateByNumber,
  formatIsoDate,
  normalizeCertNumber,
} from "../src/lib/certificate-registry.ts";

const TODAY = "2026-11-09";

async function assessFixture(scenario: "valid" | "expired" | "tampered") {
  const text = CERTIFICATE_DOCUMENT_FIXTURES[scenario].text;
  const documentSha256 = await sha256Hex(text);
  const { extracted } = extractCertificateByRules(text);
  return assessCertificate({ documentSha256, extracted, today: TODAY });
}

test("registry numbers are unique and normalisation is forgiving", () => {
  const keys = CERTIFICATE_REGISTRY.map((e) => normalizeCertNumber(e.certNumber));
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(normalizeCertNumber("demo gots 849201-2026.001"), "DEMOGOTS8492012026001");
  assert.equal(findCertificateByNumber("DEMO GOTS 849201-2026.001")?.licensee, "Padmaloom Spinning Mills Ltd.");
  assert.equal(findCertificateByNumber("NOPE-1"), null);
  assert.equal(formatIsoDate("2027-11-14"), "14 Nov 2027");
  assert.equal(formatIsoDate(null), "No expiry");
});

test("valid renewed certificate → green, matched by sealed fingerprint", async () => {
  const a = await assessFixture("valid");
  assert.equal(a.verdict, "verified");
  assert.equal(a.light, "green");
  assert.equal(a.matchedBy, "registry");
  assert.equal(a.entry?.certNumber, "DEMO-GOTS-849201-2026.001");
  assert.ok(a.checks.every((c) => c.pass !== false));
});

test("expired certificate → red/expired even though the fingerprint is genuine", async () => {
  const a = await assessFixture("expired");
  assert.equal(a.verdict, "expired");
  assert.equal(a.light, "red");
  assert.equal(a.matchedBy, "registry");
  assert.match(a.headline, /expired on 2026-07-14/);
});

test("forged copy → integrity-mismatch: number resolves but fingerprint differs from sealed copy", async () => {
  const a = await assessFixture("tampered");
  assert.equal(a.verdict, "integrity-mismatch");
  assert.equal(a.light, "red");
  assert.equal(a.matchedBy, "document");
  const integrity = a.checks.find((c) => c.id === "document-integrity");
  assert.equal(integrity?.pass, false);
});

test("unknown upload with no readable number → unknown-document; made-up number → unregistered", async () => {
  const noise = await assessCertificate({ documentSha256: await sha256Hex("random bytes"), extracted: null, today: TODAY });
  assert.equal(noise.verdict, "unknown-document");
  const fake = await assessCertificate({
    documentSha256: await sha256Hex("other"),
    extracted: { certificateNumber: "GOTS-FAKE-9999", issuer: "", standard: "GOTS", licensee: "X", validFrom: "", validUntil: "2030-01-01", scope: "" },
    today: TODAY,
  });
  assert.equal(fake.verdict, "unregistered");
});

test("content-only match of an in-force certificate → amber; wrong licensee → red", async () => {
  const amber = await assessCertificate({
    documentSha256: await sha256Hex("a scan of the Kolmilata certificate"),
    extracted: { certificateNumber: "GOTS-BD-4011", issuer: "Demo Certification Body", standard: "GOTS", licensee: "Kolmilata Yarns Ltd.", validFrom: "", validUntil: "2027-10-31", scope: "" },
    today: TODAY,
  });
  assert.equal(amber.verdict, "verified");
  assert.equal(amber.light, "amber");

  const red = await assessCertificate({
    documentSha256: await sha256Hex("another scan"),
    extracted: { certificateNumber: "GOTS-BD-4011", issuer: "Demo Certification Body", standard: "GOTS", licensee: "Some Other Mill", validFrom: "", validUntil: "2027-10-31", scope: "" },
    today: TODAY,
  });
  assert.equal(red.verdict, "licensee-mismatch");
});
