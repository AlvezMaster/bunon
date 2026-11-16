import { NextResponse, type NextRequest } from "next/server";
import { getSession, requireSession } from "@/lib/server/auth";
import { draftAnswer } from "@/lib/server/questionnaire-ai";
import { getCatalogState, saveAnswer, saveAskedQuestion, type CatalogState } from "@/lib/server/catalog-repo";
import { canSeeQuestionnaire, isLiveWith, questionnaireParties, scopeFor, takesQuestionsWith, type Scope } from "@/lib/server/access";
import { FIXTURE_DOCS_ORG } from "@/lib/server/accounts-repo";
import { recordBlockParties } from "@/lib/server/ledger-parties";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import { getOllamaStatus } from "@/lib/server/ollama";
import { QUESTIONNAIRES, quoteIsInDocument } from "@/lib/questionnaire";
import { FACTORY_DOCUMENTS, findFactoryDocument } from "@/lib/fixtures/factory-documents";
import { canonicalJson, sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The questionnaires this company may see (it is a party and the two companies are linked), with added questions. */
function visibleQuestionnaires(scope: Scope, state: CatalogState) {
  return QUESTIONNAIRES.filter((q) => canSeeQuestionnaire(scope, q)).map((q) => ({
    ...q,
    questions: [
      ...q.questions.map(({ id, text }) => ({ id, text, added: null as string | null })),
      ...(state.asked[q.id] ?? []).map(({ id, text, askedAt }) => ({ id, text, added: askedAt })),
    ],
  }));
}

/** GET /api/questionnaire: questionnaires, documents on file, approved answers and which model drafts. */
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const [state, ollama, scope] = await Promise.all([getCatalogState(), getOllamaStatus(), scopeFor(session)]);
  const questionnaires = visibleQuestionnaires(scope, state).map((q) => {
    const other = session.role === "factory" ? questionnaireParties(scope, q).buyer : questionnaireParties(scope, q).factory;
    // "open": answers and new questions allowed; "paused": unlink pending; "closed": unlinked, read-only.
    const linkState = takesQuestionsWith(scope, other) ? "open" : isLiveWith(scope, other) ? "paused" : "closed";
    return { ...q, linkState };
  });
  // The fixture documents belong to one demo factory; nobody else gets them.
  const docsVisible = questionnaires.some((q) => questionnaireParties(scope, q).factory === FIXTURE_DOCS_ORG);
  const ids = new Set(questionnaires.flatMap((q) => q.questions.map((x) => x.id)));
  const qaModel = process.env.OLLAMA_QA_MODEL?.trim() || ollama.models.find((m) => /qwen3\.5/i.test(m)) || ollama.model;
  return NextResponse.json({
    role: session.role,
    questionnaires,
    // Buyers see which document an answer came from, not the factory's full files.
    documents: docsVisible
      ? FACTORY_DOCUMENTS.map(({ id, title, fileName, text }) => (scope.orgId === FIXTURE_DOCS_ORG ? { id, title, fileName, text } : { id, title, fileName }))
      : [],
    answers: Object.fromEntries(Object.entries(state.answers ?? {}).filter(([id]) => ids.has(id))),
    model: session.role === "factory" && ollama.available ? qaModel : null,
  });
}

type Body =
  | { action: "ask"; questionnaireId: string; text: string }
  | { action: "draft"; questionId: string }
  | { action: "approve"; questionId: string; answer: string; quote?: string; docId?: string | null; aiDrafted?: boolean };

/** POST /api/questionnaire: a buyer adds a question; the factory drafts an answer or approves (sends) one. */
export async function POST(req: NextRequest) {
  const guard = requireSession(req);
  if (!guard.ok) return guard.response;
  const session = guard.session;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const [state, scope] = await Promise.all([getCatalogState(), scopeFor(session)]);
  const mine = visibleQuestionnaires(scope, state);

  if (body.action === "ask") {
    if (session.role !== "buyer") return NextResponse.json({ error: "Only buyers ask questions." }, { status: 403 });
    const qn = mine.find((q) => q.id === body.questionnaireId);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!qn) return NextResponse.json({ error: "Unknown questionnaire." }, { status: 404 });
    if (!takesQuestionsWith(scope, questionnaireParties(scope, qn).factory)) {
      return NextResponse.json({ error: "You can't send new questions while an unlink is pending or after unlinking." }, { status: 409 });
    }
    if (text.length < 8 || text.length > 300) return NextResponse.json({ error: "Write a question of 8 to 300 characters." }, { status: 400 });
    const added = { id: `${qn.id}-x${(state.asked[qn.id]?.length ?? 0) + 1}`, text, askedBy: session.name, askedAt: new Date().toISOString() };
    await saveAskedQuestion(qn.id, added);
    return NextResponse.json({ asked: added });
  }

  if (session.role !== "factory") return NextResponse.json({ error: "Only the factory answers questions." }, { status: 403 });
  const qn: (typeof mine)[number] | undefined = mine.find((q) => q.questions.some((x) => x.id === body.questionId));
  const question = qn?.questions.find((x) => x.id === body.questionId);
  if (!qn || !question) return NextResponse.json({ error: "Unknown question." }, { status: 400 });
  const parties = questionnaireParties(scope, qn);
  if (!isLiveWith(scope, parties.buyer)) return NextResponse.json({ error: "You are no longer linked with this buyer." }, { status: 409 });

  if (body.action === "draft") {
    if (scope.orgId !== FIXTURE_DOCS_ORG) return NextResponse.json({ error: "Upload your documents first; AI drafts need them." }, { status: 409 });
    return NextResponse.json({ draft: await draftAnswer(question) });
  }

  if (body.action === "approve") {
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    const docId = body.docId && findFactoryDocument(body.docId) ? body.docId : null;
    if (!answer || answer.length > 500) return NextResponse.json({ error: "Write an answer (up to 500 characters)." }, { status: 400 });
    // A cited quote must really be in the cited document, even after a person edits the answer.
    if (quote && (!docId || !quoteIsInDocument(quote, docId))) {
      return NextResponse.json({ error: "The quoted sentence is not in the cited document." }, { status: 400 });
    }
    const doc = docId ? findFactoryDocument(docId) : undefined;
    const sealed = { questionId: question.id, answer, quote, docId };
    const { block } = await appendLedgerBlock({
      type: "ANSWER APPROVED",
      actor: scope.orgNameOf(scope.orgId),
      // Only a reference and a fingerprint: the answer itself lives in the deletable answer store.
      summary: `Answer sent for question ${question.id} (${doc ? "cited a document" : "written by a person"}). The fingerprint seals the answer text.`,
      styleCode: null,
      payloadHash: await sha256Hex(canonicalJson(sealed)),
      status: "verified",
    });
    await recordBlockParties(block.block, [parties.factory, parties.buyer]);
    const saved = {
      ...sealed,
      approvedBy: guard.session.name,
      approvedAt: new Date().toISOString(),
      ledgerBlock: block.block,
      aiDrafted: body.aiDrafted === true,
    };
    await saveAnswer(saved);
    return NextResponse.json({ approved: saved });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
