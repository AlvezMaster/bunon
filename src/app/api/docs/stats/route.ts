import { NextResponse } from "next/server";
import { allOrgs } from "@/lib/server/accounts-repo";
import { getCatalogState } from "@/lib/server/catalog-repo";
import { allQuestionnaires } from "@/lib/server/questionnaires-repo";
import { listDocuments } from "@/lib/server/documents-repo";
import { listLedger } from "@/lib/server/ledger-repo";
import { getOllamaStatus } from "@/lib/server/ollama";
import { getDataSourceStatus } from "@/lib/server/data-source";
import { vectorStoreOn } from "@/lib/server/vector-store";
import { fileStoreOn } from "@/lib/server/file-store";
import { FACTORY_TOOLS } from "@/lib/server/factory-mcp";
import { BUYER_TOOLS } from "@/lib/server/buyer-mcp";
import { WATCHED_RULES } from "@/lib/watched-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/docs/stats: live, aggregate numbers for the public /docs page. Counts only: no names, no answer text,
 * no documents. Kept for 60 seconds per server instance so the page can refresh often without loading the database.
 */
let cached: { at: number; body: unknown } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.at < 60_000) return NextResponse.json(cached.body);
  const [orgs, state, questionnaires, ledger, ai, data] = await Promise.all([allOrgs(), getCatalogState(), allQuestionnaires(), listLedger(50), getOllamaStatus(), getDataSourceStatus()]);
  const factories = orgs.filter((o) => o.kind === "factory");
  const docCounts = await Promise.all(factories.slice(0, 300).map((o) => listDocuments(o.id).then((d) => d.length).catch(() => 0)));
  const answers = Object.values(state.answers ?? {});
  const body = {
    generatedAt: new Date().toISOString(),
    organisations: { factories: factories.length, buyers: orgs.filter((o) => o.kind === "buyer").length },
    questionnaires: questionnaires.length,
    questions: questionnaires.reduce((n, q) => n + q.questions.length, 0),
    answers: {
      sent: answers.length,
      withSource: answers.filter((a) => a.docId && a.quote).length,
      reused: answers.filter((a) => (a as { reusedFrom?: string | null }).reusedFrom).length,
    },
    documents: docCounts.reduce((a, b) => a + b, 0),
    activityLog: { latestEntry: ledger.blocks[0]?.block ?? 0, checked: ledger.verification.checked, chainOk: ledger.verification.ok },
    system: {
      ai: ai.available ? { where: ai.baseUrl === "claude" ? "Claude (cloud)" : ai.baseUrl === "workers-ai" ? "Cloudflare Workers AI" : "Ollama (own computer)", model: ai.model } : { where: "unavailable", model: null },
      database: data.kind === "d1" ? "Cloudflare D1" : data.kind === "postgres" ? "Postgres" : "memory",
      vectorDatabase: vectorStoreOn() ? "pgvector on Supabase" : "in-app vector search",
      fileStorage: fileStoreOn() ? "Cloudinary (private)" : "off",
    },
    mcp: { factory: FACTORY_TOOLS.map((t) => t.name), buyer: BUYER_TOOLS.map((t) => t.name) },
    watchedRules: WATCHED_RULES.length,
  };
  cached = { at: Date.now(), body };
  return NextResponse.json(body);
}
