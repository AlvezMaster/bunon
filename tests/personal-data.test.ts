import { test } from "node:test";
import assert from "node:assert/strict";
import { createMasker } from "../src/lib/personal-data.ts";
import { quoteIsInDocument } from "../src/lib/questionnaire.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";

test("masks emails, phone numbers, ID numbers and names after a title", () => {
  const m = createMasker();
  const text =
    "Contact Md. Rahim Uddin on 01712-345678 or +880 1812 345678, email rahim@nodiwear.example. " +
    "NID 1987654321234, birth registration ২০০৫১২৩৪৫৬৭৮৯০১২৩. Name: Fatema Begum. জনাব করিম মিয়া signed. Call +44 20 7946 0958.";
  const out = m.mask(text);
  for (const secret of ["Rahim Uddin", "01712-345678", "1812 345678", "rahim@nodiwear.example", "1987654321234", "২০০৫১২৩৪৫৬৭৮৯০১২৩", "Fatema Begum", "করিম মিয়া", "7946 0958"]) {
    assert.ok(!out.includes(secret), `still visible: ${secret}\n${out}`);
  }
  assert.match(out, /Md\. \[PERSON_1\]/);
  assert.deepEqual(m.counts(), { EMAIL: 1, PHONE: 3, ID: 2, PERSON: 3 });
});

test("leaves counts, money, dates and licence numbers alone", () => {
  const m = createMasker();
  const text =
    "Total workers: 1,312. Female workers: 742. Entry grade BDT 12,500 per month. Assessed on 18 March 2026. " +
    "Licence FSCD/2025/0042, ISO 45001, 60 hours a week, valid until 31/12/2027. Nodiwear Apparel Ltd.";
  assert.equal(m.mask(text), text);
});

test("the same value gets the same placeholder, and unmasking restores the text exactly", () => {
  const m = createMasker();
  const text = "Mr. Kamal Hossain approved it. Ask Mr. Kamal Hossain, 01911223344.";
  const masked = m.mask(text);
  assert.equal(masked.match(/\[PERSON_1\]/g)?.length, 2);
  assert.equal(m.unmask(masked), text);
});

test("a JSON reply with placeholders becomes valid JSON with the real values", () => {
  const m = createMasker();
  m.mask("Name: Nasrin Akter, phone 01755-000111");
  const reply = '{"value":"[PERSON_1]","quote":"Fire officer: [PERSON_1], phone [PHONE_1]."}';
  const back = JSON.parse(m.unmaskJson(reply));
  assert.equal(back.value, "Nasrin Akter");
  assert.equal(back.quote, "Fire officer: Nasrin Akter, phone 01755-000111.");
});

test("a quote copied from masked evidence still matches the document after unmasking", () => {
  const doc = { ...FACTORY_DOCUMENTS[0], id: "test-doc", text: "Fire safety officer: Mr. Jamal Ahmed, phone 01812-555777. Drills are held every three months." };
  const m = createMasker();
  const sentToCloud = m.mask(doc.text);
  assert.ok(!sentToCloud.includes("Jamal") && !sentToCloud.includes("555777"));
  const quoteFromModel = sentToCloud.split(". Drills")[0] + ".";
  assert.ok(quoteIsInDocument(m.unmask(quoteFromModel), "test-doc", [doc]));
});
