import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText, embedText, hybridSearch, isHeading } from "../src/lib/rag.ts";

// A long policy with sections, like a real upload: the later passages never repeat the section's subject.
const policy = [
  "Worker welfare policy of Demo Garments Ltd., approved by the board on 1 March 2026.",
  "1. Working hours",
  "The standard week is 48 hours. " + "Shift leaders record start and finish times on the attendance system every day. ".repeat(10),
  "Weekly rest is one full day, normally Friday. " + "Any change to the rest day is agreed with the worker in advance and noted in the register. ".repeat(8),
  "2. Grievance procedure",
  "Workers may raise a concern with their line supervisor or the welfare officer. " + "Concerns are logged with a reference number and acknowledged within two working days. ".repeat(8),
  "A locked box on every floor accepts written concerns without a name. " + "The welfare committee opens it every Monday in front of a worker representative. ".repeat(8),
].join("\n\n");

test("headings are short lines without closing punctuation", () => {
  assert.ok(isHeading("2. Grievance procedure"));
  assert.ok(isHeading("## Wages"));
  assert.ok(isHeading("Section 4 Leave"));
  assert.ok(!isHeading("Workers may raise a concern with their line supervisor."));
});

test("each passage keeps its section heading and the document's opening sentence as context", () => {
  const passages = chunkText("welfare", "Worker welfare policy", policy);
  assert.ok(passages.length >= 4);
  const box = passages.find((p) => p.text.startsWith("A locked box"));
  assert.ok(box, "the anonymous box paragraph is its own passage");
  assert.match(box!.context ?? "", /Grievance procedure/);
  assert.match(box!.context ?? "", /approved by the board/);
  // The quote a person sees is still only the passage's own words.
  assert.ok(!box!.text.includes("Grievance procedure"));
  assert.match(embedText(box!), /^Worker welfare policy › 2\. Grievance procedure › /);
});

test("no passage is a heading alone", () => {
  for (const p of chunkText("welfare", "Worker welfare policy", policy)) assert.ok(!isHeading(p.text), p.text);
});

test("context lets keyword search find a passage that never names its section's subject", () => {
  const passages = chunkText("welfare", "Worker welfare policy", policy);
  const q = "Is there a grievance procedure?";
  const withContext = hybridSearch(q, passages, null).map((p) => p.text.slice(0, 12));
  const without = hybridSearch(q, passages.map((p) => ({ ...p, context: undefined })), null).map((p) => p.text.slice(0, 12));
  assert.ok(withContext.includes("A locked box"), withContext.join(" | "));
  assert.ok(!without.includes("A locked box"), without.join(" | "));
});
