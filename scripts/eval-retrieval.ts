/**
 * Retrieval test: does the right demo document appear first, and in the top 4 passages?
 * Runs keyword search only here (no network). The same questions are run with meaning search on a
 * deployment through the questions API. Usage: node --experimental-strip-types scripts/eval-retrieval.ts
 */
import { chunkText, hybridSearch } from "../src/lib/rag.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";
import { RAG_TEST } from "./rag-questions.ts";

const passages = FACTORY_DOCUMENTS.flatMap((d) => chunkText(d.id, d.title, d.text));
let top1 = 0;
let top4 = 0;
for (const { q, doc } of RAG_TEST) {
  const found = hybridSearch(q, passages, null).map((p) => p.docId);
  if (found[0] === doc) top1++;
  if (found.includes(doc)) top4++;
  console.log(`${found[0] === doc ? "✓" : found.includes(doc) ? "~" : "✗"} ${doc.padEnd(16)} ${q}`);
}
console.log(`\nKeyword search only: first ${top1}/${RAG_TEST.length}, in top 4 ${top4}/${RAG_TEST.length}`);
