import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceGraph, connected, documentImpact, downstream, unsourcedAnswers } from "../src/lib/evidence-graph.ts";

const input = {
  documents: [
    { id: "fire", title: "Fire safety certificate", validUntil: "2026-12-20" },
    { id: "wages", title: "Wage policy", validUntil: null },
    { id: "unused", title: "Old brochure" },
  ],
  questionnaires: [
    { buyer: "Brand A", questions: [{ id: "a1", text: "Fire certificate?" }, { id: "a2", text: "Minimum wage?" }, { id: "a3", text: "Grievance process?" }] },
    { buyer: "Brand B", questions: [{ id: "b1", text: "Is your fire licence valid?" }] },
  ],
  answers: {
    a1: { docId: "fire" },
    a2: { docId: "wages" },
    a3: { docId: null },
    b1: { docId: "fire", reusedFrom: "a1" },
  },
};

test("documents back answers, answers go to buyers, a reused answer links to the one it came from", () => {
  const g = buildEvidenceGraph(input);
  assert.equal(g.nodes.filter((n) => n.kind === "buyer").length, 2);
  assert.ok(g.edges.some((e) => e.kind === "backs" && e.from === "doc:fire" && e.to === "ans:b1"));
  assert.ok(g.edges.some((e) => e.kind === "reused-as" && e.from === "ans:a1" && e.to === "ans:b1"));
  assert.ok(g.edges.some((e) => e.kind === "sent-to" && e.from === "ans:b1" && e.to === "buyer:Brand B"));
});

test("walking from a document finds every answer and buyer that rests on it", () => {
  const g = buildEvidenceGraph(input);
  assert.deepEqual([...downstream(g, "doc:fire")].sort(), ["ans:a1", "ans:b1", "buyer:Brand A", "buyer:Brand B"]);
  assert.deepEqual([...downstream(g, "doc:wages")].sort(), ["ans:a2", "buyer:Brand A"]);
  assert.equal(downstream(g, "doc:unused").size, 0);
});

test("selecting a buyer lights up its answers and the documents behind them", () => {
  const g = buildEvidenceGraph(input);
  const c = connected(g, "buyer:Brand B");
  assert.ok(c.has("ans:b1") && c.has("doc:fire") && c.has("ans:a1"));
  assert.ok(!c.has("doc:wages"));
});

test("impact: most relied-on document first, with days left and the buyers affected", () => {
  const [first, second] = documentImpact(buildEvidenceGraph(input), new Date("2026-11-20T10:00:00Z"));
  assert.equal(first.title, "Fire safety certificate");
  assert.equal(first.daysLeft, 30);
  assert.deepEqual(first.buyers.sort(), ["Brand A", "Brand B"]);
  assert.equal(second.title, "Wage policy");
  assert.equal(second.daysLeft, null);
});

test("answers sent without a source are listed", () => {
  assert.deepEqual(unsourcedAnswers(buildEvidenceGraph(input)).map((n) => n.id), ["ans:a3"]);
});

test("an answer citing a deleted document still shows the link, by the title the answer kept", () => {
  const g = buildEvidenceGraph({ ...input, answers: { a1: { docId: "gone", docTitle: "Old fire licence" } } });
  assert.equal(g.nodes.find((n) => n.id === "doc:gone")?.label, "Old fire licence");
});
