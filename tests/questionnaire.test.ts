import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUYER_QUESTIONNAIRE,
  decideCategory,
  finalizeDraft,
  quoteIsInDocument,
  retrieveEvidence,
  ruleDraft,
} from "../src/lib/questionnaire.ts";

test("retrieval puts the right document first for every answerable question", () => {
  for (const q of BUYER_QUESTIONNAIRE.questions) {
    if (!q.expected.docId) continue;
    assert.equal(retrieveEvidence(q.text)[0]?.docId, q.expected.docId, q.text);
  }
});

test("a quote counts only if it is in the cited document word for word", () => {
  assert.equal(quoteIsInDocument("The licence is valid until 30 June 2027.", "fire-licence"), true);
  assert.equal(quoteIsInDocument("the LICENCE is valid   until 30 june 2027", "fire-licence"), true);
  assert.equal(quoteIsInDocument("The licence is valid until 30 June 2028.", "fire-licence"), false);
  assert.equal(quoteIsInDocument("The licence is valid until 30 June 2027.", "wage-policy"), false);
});

test("the decision model separates answerable questions from ones that need a person", () => {
  assert.equal(decideCategory("Describe your plans to reduce water use over the next three years.").category, "needs_person");
  assert.equal(decideCategory("What percentage of the workforce is female?").category, "calculation");
  assert.equal(decideCategory("Is there a procedure to verify workers' age at recruitment?").category, "policy_exists");
});

const evidence = retrieveEvidence("Does the factory hold a valid fire licence?");
const agree = decideCategory("Does the factory hold a valid fire licence?");

test("a draft with a real quote is kept", () => {
  const d = finalizeDraft(
    "q01",
    "Does the factory hold a valid fire licence?",
    { category: "document_fact", answer: "yes", value: "", quote: "The licence is valid until 30 June 2027.", source_id: "fire-licence#1", confidence: 0.9 },
    evidence,
    "test",
    1,
    agree
  );
  assert.equal(d.status, "draft");
  assert.equal(d.docId, "fire-licence");
});

test("a draft with an invented quote is flagged, never kept", () => {
  const d = finalizeDraft(
    "q01",
    "Does the factory hold a valid fire licence?",
    { category: "document_fact", answer: "yes", value: "", quote: "The licence is valid until 2030.", source_id: "fire-licence#1", confidence: 0.99 },
    evidence,
    "test",
    1,
    agree
  );
  assert.equal(d.status, "unverified");
});

test("when the two models disagree on whether documents can answer, a person decides", () => {
  const d = finalizeDraft(
    "q12",
    "Describe your plans to reduce water use over the next three years.",
    { category: "document_fact", answer: "yes", value: "", quote: "The licence is valid until 30 June 2027.", source_id: "fire-licence#1", confidence: 0.9 },
    evidence,
    "test",
    1,
    { category: "needs_person", probability: 0.9 }
  );
  assert.equal(d.status, "needs_person");
});

test("a Yes backed by a negative sentence goes to a person", () => {
  const q = "Does the factory employ anyone under the age of 18?";
  const d = finalizeDraft(
    "q06",
    q,
    { category: "document_fact", answer: "yes", value: "", quote: "Nodiwear Apparel Ltd. does not employ anyone under the age of 18.", source_id: "child-labour#1", confidence: 0.9 },
    retrieveEvidence(q),
    "test",
    1,
    decideCategory(q)
  );
  assert.equal(d.status, "needs_person");
});

test("without the local model, drafts never invent an answer", () => {
  const d = ruleDraft({ id: "q01", text: "Does the factory hold a valid fire licence?" });
  assert.equal(d.status, "needs_person");
  assert.equal(d.answer, "unknown");
  assert.equal(d.evidence[0]?.docId, "fire-licence");
});
