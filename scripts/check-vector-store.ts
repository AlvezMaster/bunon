/**
 * Checks the vector database end to end: stores three test passages, finds the
 * nearest one by cosine distance, then removes them. Needs SUPABASE_URL and SUPABASE_SECRET_KEY, and scripts/supabase-vector.sql run once.
 *   node --env-file=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-vector-store.ts
 */
import { quantize, type Passage } from "../src/lib/rag.ts";
import { deleteVectors, vectorSearch, vectorStoreOn } from "../src/lib/server/vector-store.ts";

if (!vectorStoreOn()) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
const dims = 1024;
const vec = (seed: number) => Array.from({ length: dims }, (_, i) => Math.sin(seed * 7.3 + i * 0.37));
const passages: Passage[] = [1, 2, 3].map((n) => ({ id: `check-doc-${n}#0`, docId: `check-doc-${n}`, title: `Check ${n}`, text: `Check passage ${n}`, vec: quantize(vec(n)) }));
const query = vec(2).map((x, i) => x + (i % 5 === 0 ? 0.05 : 0));
const t0 = Date.now();
const found = await vectorSearch("check-org", "check-model", query, passages, 3);
console.log("nearest:", found?.map((r) => `${r.id} ${r.score.toFixed(3)}`).join(", "), `(${Date.now() - t0} ms)`);
for (const n of [1, 2, 3]) await deleteVectors(`check-doc-${n}`);
if (found?.[0]?.id !== "check-doc-2#0") throw new Error("The nearest passage should be check-doc-2#0.");
console.log("vector database OK");
process.exit(0);
