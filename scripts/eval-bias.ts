/**
 * Language bias check: does Bunon work as well for a Bangla question as for the same question in English?
 * Run with Ollama running:  node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/eval-bias.ts
 *   --search-only   skip drafting (no model needed)
 *
 * Search: hybrid search on the demo documents (meaning search only if an embedding model is available).
 * Drafting: the full pipeline (search → model → quote and decision checks) on 13 labelled questions.
 */
import { chunkText, dequantize, hybridSearch, quantize } from "../src/lib/rag.ts";
import { FACTORY_DOCUMENTS } from "../src/lib/fixtures/factory-documents.ts";
import { embed } from "../src/lib/server/embeddings.ts";
import { draftAnswer } from "../src/lib/server/questionnaire-ai.ts";
import { ANSWER_PAIRS, SEARCH_HELD_OUT, SEARCH_PAIRS } from "./bias-questions.ts";

type Lang = "en" | "bn";
const LANGS: Lang[] = ["en", "bn"];
const pct = (a: number, b: number) => `${a}/${b} (${Math.round((100 * a) / b)}%)`;

// ---- search
const passages = FACTORY_DOCUMENTS.flatMap((d) => chunkText(d.id, d.title, d.text));
const docVecs = await embed("documents", passages.map((p) => `${p.title}\n${p.text}`));
if (docVecs) passages.forEach((p, i) => (p.vec = quantize(docVecs.vectors[i])));
console.log(`Search (${docVecs ? `keywords + meaning, ${docVecs.model}` : "keywords only: no embedding model on this computer"})`);
for (const [name, set] of [["reworded set", SEARCH_PAIRS], ["held-out set", SEARCH_HELD_OUT]] as const) {
  const search: Record<Lang, { top1: number; top4: number }> = { en: { top1: 0, top4: 0 }, bn: { top1: 0, top4: 0 } };
  for (const lang of LANGS) {
    const qv = docVecs ? await embed("queries", set.map((p) => p[lang])) : null;
    set.forEach((p, i) => {
      const found = hybridSearch(p[lang], passages, qv ? dequantize(quantize(qv.vectors[i])) : null).map((x) => x.docId);
      if (found[0] === p.doc) search[lang].top1++;
      if (found.includes(p.doc)) search[lang].top4++;
      if (process.argv.includes("--verbose") && !found.includes(p.doc)) console.log(`    missed (${lang}): ${p[lang]}`);
    });
  }
  console.log(` ${name}`);
  for (const lang of LANGS) console.log(`  ${lang.toUpperCase()}  right document first ${pct(search[lang].top1, set.length)}, in top 4 ${pct(search[lang].top4, set.length)}`);
}

// ---- drafting
if (!process.argv.includes("--search-only")) {
  const res: Record<Lang, { ok: number; answerable: number; person: number; due: number; wrongKept: number; ms: number; engine: string }> = {
    en: { ok: 0, answerable: 0, person: 0, due: 0, wrongKept: 0, ms: 0, engine: "" },
    bn: { ok: 0, answerable: 0, person: 0, due: 0, wrongKept: 0, ms: 0, engine: "" },
  };
  for (const q of ANSWER_PAIRS) {
    for (const lang of LANGS) {
      const d = await draftAnswer({ id: q.id, text: lang === "en" ? q.text : q.bn }, "org-nodiwear");
      const r = res[lang];
      r.engine = d.engine;
      r.ms += d.durationMs;
      const shouldAnswer = q.expected.category === "document_fact" || q.expected.category === "policy_exists";
      const right = d.status === "draft" && d.answer === q.expected.answer && d.docId === q.expected.docId;
      if (shouldAnswer) {
        r.answerable++;
        if (right) r.ok++;
      } else {
        r.due++;
        if (d.status !== "draft") r.person++;
      }
      if (d.status === "draft" && !right) r.wrongKept++;
      console.log(`  ${lang} ${q.id} ${d.status.padEnd(12)} ${d.answer.padEnd(7)} ${d.docId ?? "-"}`);
    }
  }
  console.log(`\nDrafting (${res.en.engine})`);
  for (const lang of LANGS) {
    const r = res[lang];
    console.log(
      `  ${lang.toUpperCase()}  correct cited answers ${pct(r.ok, r.answerable)}, left for a person ${r.person}/${r.due}, wrong drafts kept ${r.wrongKept}, ` +
        `avg ${Math.round(r.ms / ANSWER_PAIRS.length)} ms`
    );
  }
}
console.log("\nSmall labelled sample on synthetic documents: a check for gaps between languages, not a benchmark.");
