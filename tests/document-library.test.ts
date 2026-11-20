import { test } from "node:test";
import assert from "node:assert/strict";
import { checklist } from "../src/lib/document-library.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";

const today = new Date("2026-11-20T10:00:00Z");
const status = (docs: Parameters<typeof checklist>[0], key: string) => checklist(docs, today).find((i) => i.doc.key === key)!;

test("the demo factory's documents cover the checklist items they are about", () => {
  const items = checklist(FACTORY_DOCUMENTS.map((d) => ({ id: d.id, title: d.title, fileName: d.fileName })), today);
  for (const key of ["fire", "trade", "wages", "hours", "age", "grievance"]) assert.equal(items.find((i) => i.doc.key === key)?.status, "on-file", key);
});

test("missing, expiring and expired documents are told apart", () => {
  assert.equal(status([], "fire").status, "missing");
  assert.equal(status([{ id: "a", title: "Fire licence", fileName: "f.pdf", validUntil: "2026-12-20" }], "fire").status, "expiring");
  assert.equal(status([{ id: "a", title: "Fire licence", fileName: "f.pdf", validUntil: "2026-12-20" }], "fire").daysLeft, 30);
  assert.equal(status([{ id: "a", title: "Fire licence", fileName: "f.pdf", validUntil: "2026-10-01" }], "fire").status, "expired");
});

test("a renewed copy covers an expired one", () => {
  const docs = [
    { id: "old", title: "Fire licence 2025", fileName: "old.pdf", validUntil: "2026-06-30" },
    { id: "new", title: "Fire licence 2027", fileName: "new.pdf", validUntil: "2027-06-30" },
  ];
  assert.equal(status(docs, "fire").status, "on-file");
});
