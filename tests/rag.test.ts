import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText, cosine, dequantize, fuse, hybridSearch, quantize, type Passage } from "../src/lib/rag.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";

test("chunking keeps sentences whole and numbers passages in order", () => {
  const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} explains one rule of the factory.`).join(" ");
  const parts = chunkText("doc", "Doc", `Heading\n\n${long}\n\nShort tail.`, 300, 400);
  assert.ok(parts.length > 3);
  assert.deepEqual(parts.map((p) => p.id), parts.map((_, i) => `doc#${i}`));
  for (const p of parts) assert.ok(p.text.length <= 420, `passage too long: ${p.text.length}`);
  assert.ok(parts.every((p) => /[.!?]$|Heading|tail\.$/.test(p.text.trim())), "a sentence was cut");
});

test("int8 vectors keep cosine similarity close to the float value", () => {
  const a = Array.from({ length: 256 }, (_, i) => Math.sin(i));
  const b = Array.from({ length: 256 }, (_, i) => Math.sin(i) + 0.3 * Math.cos(i * 3));
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const exact = dot / Math.sqrt(a.reduce((s, x) => s + x * x, 0) * b.reduce((s, x) => s + x * x, 0));
  assert.ok(Math.abs(cosine(dequantize(quantize(a)), dequantize(quantize(b))) - exact) < 0.01);
});

test("fusion lifts a passage that both searches rank well", () => {
  const scores = fuse([[{ id: "a" }, { id: "b" }, { id: "c" }], [{ id: "b" }, { id: "d" }]]);
  const order = [...scores.entries()].sort((x, y) => y[1] - x[1]).map(([id]) => id);
  assert.equal(order[0], "b");
});

test("keyword-only search still finds the right demo document first", () => {
  const passages: Passage[] = FACTORY_DOCUMENTS.flatMap((d) => chunkText(d.id, d.title, d.text));
  const top = hybridSearch("When was the last fire evacuation drill held?", passages, null);
  assert.equal(top[0].docId, "fire-licence");
  assert.deepEqual(top[0].via, ["keyword"]);
});

test("a meaning match is found even with no shared words", () => {
  const passages: Passage[] = [
    { id: "x#0", docId: "x", title: "X", text: "Nobody under eighteen is employed.", vec: quantize([1, 0, 0, 0]) },
    { id: "y#0", docId: "y", title: "Y", text: "Wages are paid monthly.", vec: quantize([0, 1, 0, 0]) },
  ];
  const top = hybridSearch("Do you use child workers?", passages, dequantize(quantize([0.9, 0.1, 0, 0])), 1);
  assert.equal(top[0].docId, "x");
  assert.deepEqual(top[0].via, ["meaning"]);
});
