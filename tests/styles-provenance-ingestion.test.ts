import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STYLES_CATALOG,
  applyRenewals,
  createCustomStyle,
  getStyleData,
  listStyles,
  styleClearance,
} from "../src/lib/styles.ts";
import { buildProvenanceTree, tierInclusionProof, verifyTierInclusion } from "../src/lib/provenance.ts";
import { runIngestion } from "../src/lib/server/ingestion.ts";
import { CERTIFICATE_REGISTRY, normalizeCertNumber } from "../src/lib/certificate-registry.ts";

test("catalog integrity: 5 tiers per style, ISO dates, every certificate is in the registry", () => {
  const registryKeys = new Set(CERTIFICATE_REGISTRY.map((e) => normalizeCertNumber(e.certNumber)));
  for (const style of Object.values(STYLES_CATALOG)) {
    assert.equal(style.tiers.length, 5, style.code);
    assert.deepEqual(style.tiers.map((t) => t.tierNumber), [4, 3, 2, 1, 0]);
    for (const tier of style.tiers) {
      assert.ok(tier.validThrough === null || /^\d{4}-\d{2}-\d{2}$/.test(tier.validThrough), `${style.code}/${tier.id} date`);
      assert.ok(registryKeys.has(normalizeCertNumber(tier.certNumber)), `${tier.certNumber} missing from registry`);
    }
  }
  assert.equal(STYLES_CATALOG["DN-2026"].tiers[1].status, "expired");
  assert.equal(styleClearance(STYLES_CATALOG["DN-2026"]).cleared, false);
  assert.equal(styleClearance(STYLES_CATALOG["TS-4011"]).cleared, true);
});

test("getStyleData: case-insensitive, custom catalog, renewals applied, unknown → null", () => {
  assert.equal(getStyleData("dn-2026")?.code, "DN-2026");
  assert.equal(getStyleData("UNKNOWN-999"), null);
  assert.equal(getStyleData(undefined)?.code, "DN-2026");

  const custom = createCustomStyle({ code: "po-2027-new", title: "Overshirt", garmentType: "Woven", volume: "35,000 PCS", destination: "Rotterdam (NL)", fiberComposition: "100% Organic" });
  assert.equal(custom.code, "PO-2027-NEW");
  assert.equal(custom.volumeUnits, 35000);
  assert.equal(getStyleData("PO-2027-NEW", { [custom.code]: custom })?.title, "Overshirt");
  assert.equal(listStyles({ [custom.code]: custom }).length, 4);

  const renewed = applyRenewals(STYLES_CATALOG["DN-2026"], {
    "t3-yarn": { certNumber: "DEMO-GOTS-849201-2026.001", certType: "GOTS Scope Certificate", validThrough: "2027-11-14", documentSha256: "0x" + "a".repeat(64), ingestedAt: "2026-11-09T00:00:00Z", engine: "rules" },
  });
  assert.equal(renewed.tiers[1].status, "verified");
  assert.equal(styleClearance(renewed).cleared, true);
  // original untouched
  assert.equal(STYLES_CATALOG["DN-2026"].tiers[1].status, "expired");
});

test("provenance trees are real, deterministic, style-specific, and change on renewal", async () => {
  const dn = await buildProvenanceTree(STYLES_CATALOG["DN-2026"]);
  const ts = await buildProvenanceTree(STYLES_CATALOG["TS-4011"]);
  assert.match(dn.root, /^0x[0-9a-f]{64}$/);
  assert.notEqual(dn.root, ts.root);
  assert.deepEqual(dn.leafOrder, ["t4-cotton", "t3-yarn", "t2-dyeing", "t1-trims", "t0-factory"]);
  assert.deepEqual(dn.expiredTierIds, ["t3-yarn"]);
  assert.equal((await buildProvenanceTree(STYLES_CATALOG["DN-2026"])).root, dn.root);

  const proof = tierInclusionProof(dn, "t3-yarn");
  assert.equal(await verifyTierInclusion(proof), true);
  assert.equal(await verifyTierInclusion({ ...proof, leafHash: ts.leafHashes["t3-yarn"] }), false);

  const renewed = applyRenewals(STYLES_CATALOG["DN-2026"], {
    "t3-yarn": { certNumber: "DEMO-GOTS-849201-2026.001", certType: "GOTS Scope Certificate", validThrough: "2027-11-14", documentSha256: "0x" + "a".repeat(64), ingestedAt: "2026-11-09T00:00:00Z", engine: "rules" },
  });
  const after = await buildProvenanceTree(renewed);
  assert.notEqual(after.root, dn.root);
  assert.notEqual(after.leafHashes["t3-yarn"], dn.leafHashes["t3-yarn"]);
  assert.equal(after.leafHashes["t4-cotton"], dn.leafHashes["t4-cotton"]);
});

test("ingestion pipeline (rules engine): scenarios produce the expected verdicts; text uploads work", async () => {
  const today = "2026-11-09";
  const valid = await runIngestion({ fileName: "x.pdf", mimeType: "application/pdf", scenario: "valid" }, { allowOllama: false, today });
  assert.equal(valid.engine, "rules");
  assert.equal(valid.assessment.verdict, "verified");
  assert.equal(valid.assessment.light, "green");
  assert.equal(valid.extraction.certificateNumber, "DEMO-GOTS-849201-2026.001");
  assert.equal(valid.agreement.certificateNumber, true);

  const expired = await runIngestion({ fileName: "x.pdf", mimeType: "application/pdf", scenario: "expired" }, { allowOllama: false, today });
  assert.equal(expired.assessment.verdict, "expired");

  const forged = await runIngestion({ fileName: "x.pdf", mimeType: "application/pdf", scenario: "tampered" }, { allowOllama: false, today });
  assert.equal(forged.assessment.verdict, "integrity-mismatch");

  const upload = await runIngestion(
    { fileName: "note.txt", mimeType: "text/plain", bytes: new TextEncoder().encode("Certificate Number: GOTS-BD-4011\nThis is to certify that Kolmilata Yarns Ltd. has been assessed.\nValid until: 31 October 2027") },
    { allowOllama: false, today }
  );
  assert.equal(upload.assessment.verdict, "verified");
  assert.equal(upload.assessment.light, "amber");

  const image = await runIngestion({ fileName: "scan.png", mimeType: "image/png", bytes: new Uint8Array([137, 80, 78, 71]) }, { allowOllama: false, today });
  assert.equal(image.assessment.verdict, "unknown-document");
  assert.ok(image.warnings.some((w) => /OCR/.test(w)));
});
