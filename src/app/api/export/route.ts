import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { linkWith, questionnaireParties, scopeFor, styleParties } from "@/lib/server/access";
import { FIXTURE_DOCS_ORG } from "@/lib/server/accounts-repo";
import { getCatalogState } from "@/lib/server/catalog-repo";
import { getBlockParties } from "@/lib/server/ledger-parties";
import { listLedger } from "@/lib/server/ledger-repo";
import { zip } from "@/lib/server/zip";
import { partnerOf } from "@/lib/links";
import { listStyles } from "@/lib/styles";
import { orgName } from "@/lib/questionnaire";
import { allQuestionnaires } from "@/lib/server/questionnaires-repo";
import { FACTORY_DOCUMENTS } from "@/lib/fixtures/factory-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csv = (rows: Array<Array<string | number | null>>) =>
  rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
const slug = (s: string) => orgName(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * GET /api/export?linkId=…: a ZIP of everything shared between this company and one partner — orders,
 * questionnaires and answers, the factory's own documents (for the factory), and the matching ledger entries.
 * Works while linked and for 30 days after unlinking.
 */
export async function GET(req: NextRequest) {
  const guard = requireSession(req);
  if (!guard.ok) return guard.response;
  const scope = await scopeFor(guard.session);
  const link = scope.links.find((l) => l.id === req.nextUrl.searchParams.get("linkId"));
  const partner = link ? partnerOf(link, scope.orgId) : undefined;
  if (!link || !partner || linkWith(scope, partner)?.id !== link.id) {
    return NextResponse.json({ error: "Nothing to export for this link (the 30-day window may have ended)." }, { status: 404 });
  }

  const [state, parties, ledger] = await Promise.all([getCatalogState(), getBlockParties(), listLedger(1000)]);
  const pair = (f?: string, b?: string) => f === link.factoryOrgId && b === link.buyerOrgId;
  const orders = listStyles(state.customStyles, state.renewals).filter((s) => {
    const p = styleParties(scope, s);
    return pair(p.factory, p.buyer);
  });
  const questionnaires = (await allQuestionnaires()).filter((q) => {
    const p = questionnaireParties(scope, q);
    return pair(p.factory, p.buyer);
  }).map((q) => ({
    id: q.id,
    title: q.title,
    buyer: q.buyer,
    factory: q.factory,
    sentOn: q.sentOn,
    dueOn: q.dueOn,
    questions: [...q.questions.map(({ id, text }) => ({ id, text })), ...(state.asked[q.id] ?? []).map(({ id, text, askedAt }) => ({ id, text, addedAt: askedAt }))].map((x) => ({
      ...x,
      // Where an answer was reused from names another buyer's question, so it stays out of the export.
      answer: state.answers[x.id] ? { ...state.answers[x.id], reusedFrom: undefined } : null,
    })),
  }));
  const docTitle = (id: string | null) => FACTORY_DOCUMENTS.find((d) => d.id === id)?.title ?? "";
  const codes = new Set(orders.map((o) => o.code));
  const answerBlocks = new Set(questionnaires.flatMap((q) => q.questions.map((x) => x.answer?.ledgerBlock)).filter(Boolean));
  const blocks = ledger.blocks.filter((b) => {
    const who = parties[String(b.block)];
    return (b.styleCode && codes.has(b.styleCode)) || answerBlocks.has(b.block) || (who?.includes(link.factoryOrgId) && who.includes(link.buyerOrgId));
  });
  const ownDocs = scope.orgId === FIXTURE_DOCS_ORG && scope.role === "factory" ? FACTORY_DOCUMENTS : [];

  const me = scope.orgNameOf(scope.orgId);
  const them = scope.orgNameOf(partner);
  const now = new Date().toISOString();
  const files = [
    {
      name: "README.txt",
      content: [
        `Bunon data export for ${me}`,
        `Shared with: ${them}`,
        `Created: ${now}`,
        `Link status: ${link.status}${link.exportUntil ? ` (download window ends ${link.exportUntil})` : ""}`,
        "",
        "manifest.json      what this export holds",
        "orders.json        orders between the two companies, with certificate status",
        "questionnaires.json + answers.csv   every question, the answer sent, the quoted source sentence",
        "ledger.json        the matching ledger entries; each fingerprint can be checked against the answer it seals",
        ownDocs.length ? "documents/         your own documents on file" : "",
        "",
        "Demo data: the companies, orders and documents are fictional.",
      ]
        .filter((l) => l !== undefined)
        .join("\r\n"),
    },
    {
      name: "manifest.json",
      content: JSON.stringify(
        { exportedAt: now, exportedBy: guard.session.name, company: me, partner: them, link, counts: { orders: orders.length, questionnaires: questionnaires.length, ledgerEntries: blocks.length, documents: ownDocs.length } },
        null,
        2
      ),
    },
    { name: "orders.json", content: JSON.stringify(orders, null, 2) },
    { name: "questionnaires.json", content: JSON.stringify(questionnaires, null, 2) },
    {
      name: "answers.csv",
      content: csv([
        ["Questionnaire", "Question no.", "Question", "Answer", "Quoted source sentence", "Source document", "Approved by", "Approved at", "Ledger block"],
        ...questionnaires.flatMap((q) =>
          q.questions.map((x, i) => [q.title, i + 1, x.text, x.answer?.answer ?? "", x.answer?.quote ?? "", docTitle(x.answer?.docId ?? null), x.answer?.approvedBy ?? "", x.answer?.approvedAt ?? "", x.answer?.ledgerBlock ?? ""])
        ),
      ]),
    },
    { name: "ledger.json", content: JSON.stringify({ note: "Chain check at export time", verification: ledger.verification, blocks }, null, 2) },
    ...ownDocs.map((d) => ({ name: `documents/${d.fileName.replace(/\.[a-z]+$/i, "")}.txt`, content: `${d.title}\r\n\r\n${d.text}` })),
  ];

  const body = zip(files);
  return new NextResponse(body as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="bunon-export-${slug(me)}-${slug(them)}-${now.slice(0, 10)}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
