import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  readSessionCookie,
  signSession,
  verifyPassword,
  verifySession,
} from "../src/lib/server/session.ts";
import { extractCertificateByRules, parseDateToIso } from "../src/lib/extraction.ts";

process.env.BUNON_SESSION_SECRET = "unit-test-secret-0123456789abcdef";

test("session tokens round-trip, reject tampering and expiry", () => {
  const now = Date.UTC(2026, 10, 9, 0, 0, 0);
  const token = signSession(
    { sub: "usr-factory-01", email: "m@example.com", role: "factory", name: "Tariqul", org: "Ashulia" },
    now
  );
  const payload = verifySession(token, now + 1000);
  assert.ok(payload);
  assert.equal(payload.sub, "usr-factory-01");
  assert.equal(payload.role, "factory");
  assert.equal(payload.exp - payload.iat, 8 * 3600);

  // expired
  assert.equal(verifySession(token, now + 9 * 3600 * 1000), null);
  // tampered body (role escalation attempt)
  const [body, sig] = token.split(".");
  const forgedBody = Buffer.from(
    JSON.stringify({ ...payload, role: "buyer" })
  ).toString("base64url");
  assert.equal(verifySession(`${forgedBody}.${sig}`, now), null);
  // garbage
  assert.equal(verifySession("nope", now), null);
  assert.equal(verifySession(undefined, now), null);

  assert.equal(readSessionCookie(`theme=dark; bunon_session=${encodeURIComponent(token)}; x=1`), token);
  assert.equal(readSessionCookie("theme=dark"), null);
});

test("scrypt password hashing verifies and rejects, and flags legacy plaintext", async () => {
  const stored = await hashPassword("demo123");
  assert.match(stored, /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.deepEqual(await verifyPassword("demo123", stored), { ok: true, legacyPlaintext: false });
  assert.deepEqual(await verifyPassword("Demo123", stored), { ok: false, legacyPlaintext: false });
  assert.deepEqual(await verifyPassword("demo123", "demo123"), { ok: true, legacyPlaintext: true });
  assert.deepEqual(await verifyPassword("x", null), { ok: false, legacyPlaintext: false });
});

test("date parsing handles the formats found on certificates", () => {
  assert.equal(parseDateToIso("14 November 2027"), "2027-11-14");
  assert.equal(parseDateToIso("November 14, 2027"), "2027-11-14");
  assert.equal(parseDateToIso("2027-11-14"), "2027-11-14");
  assert.equal(parseDateToIso("14/11/2027"), "2027-11-14");
  assert.equal(parseDateToIso("14.11.2027"), "2027-11-14");
  assert.equal(parseDateToIso("November 2027"), "2027-11-30");
  assert.equal(parseDateToIso("soon"), null);
});

test("rules extractor pulls the key fields from a simulated GOTS certificate", () => {
  const text = `DEMO CERTIFICATION BODY B.V. (SIMULATED DOCUMENT FOR DEMONSTRATION)
SCOPE CERTIFICATE
Global Organic Textile Standard (GOTS) Version 7.0
Licence Number: CU 849201
Certificate Number: DEMO-GOTS-849201-2026.001
This is to certify that Padmaloom Spinning Mills Ltd., Chowrasta, Gazipur, Bangladesh has been inspected and assessed in accordance with GOTS.
Scope: Spinning of organic combed ring-spun yarn (Ne 20/1)
Valid from: 15 October 2026
Valid until: 14 November 2027`;
  const { extracted, confidence, fieldsFound } = extractCertificateByRules(text);
  assert.equal(extracted.certificateNumber, "DEMO-GOTS-849201-2026.001");
  assert.equal(extracted.issuer, "Demo Certification Body (simulated)");
  assert.equal(extracted.standard, "GOTS");
  assert.match(extracted.licensee, /^Padmaloom Spinning Mills Ltd\./);
  assert.equal(extracted.validFrom, "2026-10-15");
  assert.equal(extracted.validUntil, "2027-11-14");
  assert.match(extracted.scope, /ring-spun yarn/);
  assert.equal(confidence, 1);
  assert.equal(fieldsFound.length, 5);
});

test("rules extractor degrades gracefully on unrelated text", () => {
  const { extracted, confidence } = extractCertificateByRules("Quarterly sales report. Revenue grew 4%.");
  assert.equal(extracted.certificateNumber, "");
  assert.equal(extracted.validUntil, "");
  assert.equal(confidence, 0);
});
