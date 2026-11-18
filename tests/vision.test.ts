import { test } from "node:test";
import assert from "node:assert/strict";

const { cleanTranscript, isImage } = await import("../src/lib/server/vision.ts");

test("photos are recognised by type or file name; documents are not", () => {
  assert.ok(isImage("licence.JPG", ""));
  assert.ok(isImage("scan", "image/png"));
  assert.ok(isImage("page.webp", "application/octet-stream"));
  assert.equal(isImage("policy.pdf", "application/pdf"), false);
  assert.equal(isImage("notes.txt", "text/plain"), false);
});

test("a transcript keeps the document's words and drops the model's extras", () => {
  assert.equal(cleanTranscript("<think>looking</think>\nFire Licence\nValid until: 30 June 2027"), "Fire Licence\nValid until: 30 June 2027");
  assert.equal(cleanTranscript("```text\nLicence FSCD/GAZ/2026/7781\n```"), "Licence FSCD/GAZ/2026/7781");
  assert.equal(cleanTranscript("NO_TEXT"), "", "no text means nothing is stored");
  assert.equal(cleanTranscript("অগ্নি লাইসেন্স"), "অগ্নি লাইসেন্স", "Bangla stays Bangla");
});
