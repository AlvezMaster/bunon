import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { getSession, requireSession } from "@/lib/server/auth";
import { draftAnswer } from "@/lib/server/questionnaire-ai";
import { getCatalogState, saveAnswer, saveAskedQuestion, type CatalogState } from "@/lib/server/catalog-repo";
import { canSeeQuestionnaire, isLiveWith, questionnaireParties, scopeFor, takesQuestionsWith, type Scope } from "@/lib/server/access";
import { FIXTURE_DOCS_ORG } from "@/lib/server/accounts-repo";
import { allQuestionnaires, saveQuestionnaires, type AnyQuestionnaire, type StoredQuestionnaire } from "@/lib/server/questionnaires-repo";
import { recordBlockParties } from "@/lib/server/ledger-parties";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import { getOllamaStatus } from "@/lib/server/ollama";
import { quoteIsInDocument } from "@/lib/questionnaire";
import { FACTORY_DOCUMENTS, findFactoryDocument } from "@/lib/fixtures/factory-documents";
import { canonicalJson, sha256Hex } from "@/lib/crypto";
import { partnerOf, acceptsNewQuestions } from "@/lib/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hex = (n: number) => randomBytes(n).toString("hex");

/** The questionnaires this company may see (it is a party and the two companies are linked), with added questions. */
async function visibleQuestionnaires(scope: Scope, state: CatalogState) {
  return (await allQuestionnaires())
    .filter((q) => canSeeQuestionnaire(scope, q))
    .map((q) => ({
      ...q,
      questions: [
        ...q.questions.map(({ id, text, ref }) => ({ id, ref: ref ?? id, text, added: null as string | null })),
        ...(state.asked[q.id] ?? []).map(({ id, ref, text, askedAt }) => ({ id, ref: ref ?? id, text, added: askedAt })),
      ],
    }));
}

/** "open": answers and new questions allowed; "paused": unlink pending; "closed": unlinked, read-only. */
function linkStateOf(scope: Scope, q: Pick<AnyQuestionnaire, "buyer" | "factory" | "buyerOrgId" | "factoryOrgId">): "open" | "paused" | "closed" {
  const p = questionnaireParties(scope, q);
  const other = scope.role === "factory" ? p.buyer : p.factory;
  return takesQuestionsWith(scope, other) ? "open" : isLiveWith(scope, other) ? "paused" : "closed";
}

/** GET /api/questionnaire: questionnaires, documents on file, approved answers and which model drafts. */
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const [state, ollama, scope] = await Promise.all([getCatalogState(), getOllamaStatus(), scopeFor(session)]);
  const questionnaires = (await visibleQuestionnaires(scope, state)).map((q) => ({
    ...q,
    factoryOrgId: questionnaireParties(scope, q).factory ?? null,
    linkState: linkStateOf(scope, q),
  }));
  // The fixture documents belong to one demo factory; nobody else gets them.
  const docsVisible = questionnaires.some((q) => q.factoryOrgId === FIXTURE_DOCS_ORG);
  const ids = new Set(questionnaires.flatMap((q) => q.questions.map((x) => x.id)));
  const qaModel = process.env.OLLAMA_QA_MODEL?.trim() || ollama.models.find((m) => /qwen3\.5/i.test(m)) || ollama.model;
  // Buyers can send new questionnaires to factories they are linked to (and not unlinking from).
  const factories =
    session.role === "buyer"
      ? scope.links
          .filter((l) => acceptsNewQuestions(l))
          .map((l) => ({ id: partnerOf(l, scope.orgId), name: scope.orgNameOf(partnerOf(l, scope.orgId)) }))
      : [];
  return NextResponse.json({
    role: session.role,
    questionnaires,
    factories,
    // Buyers see which document an answer came from, not the factory's full files.
    documents: docsVisible
      ? FACTORY_DOCUMENTS.map(({ id, title, fileName, text }) => (scope.orgId === FIXTURE_DOCS_ORG ? { id, title, fileName, text } : { id, title, fileName }))
      : [],
    answers: Object.fromEntries(Object.entries(state.answers ?? {}).filter(([id]) => ids.has(id))),
    model: session.role === "factory" && ollama.available ? qaModel : null,
  });
}

type Body =
  | { action: "create"; title: string; dueOn?: string; questions: string[]; factoryOrgIds: string[] }
  | { action: "ask"; groupId?: string; questionnaireId?: string; text: string }
  | { action: "draft"; questionId: string }
  | { action: "approve"; questionId: string; answer: string; quote?: string; docId?: string | null; aiDrafted?: boolean };

const cleanQuestion = (t: unknown) => (typeof t === "string" ? t.trim().replace(/\s+/g, " ") : "");

/**
 * POST /api/questionnaire
 *   buyer:   "create" a questionnaire for one or more linked factories; "ask" a new question of every factory in it
 *   factory: "draft" an answer from its documents; "approve" (send) an answer
 */
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
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

  if (body.action === "create") {
    if (session.role !== "buyer") return fail("Only buyers send questionnaires.", 403);
    const title = cleanQuestion(body.title).slice(0, 120) || "Supplier questionnaire";
    const questions = (Array.isArray(body.questions) ? body.questions : []).map(cleanQuestion).filter(Boolean);
    if (questions.length < 1 || questions.length > 60) return fail("Add between 1 and 60 questions.");
    if (questions.some((q) => q.length < 8 || q.length > 300)) return fail("Each question needs 8 to 300 characters.");
    const factoryIds = [...new Set(Array.isArray(body.factoryOrgIds) ? body.factoryOrgIds : [])];
    if (!factoryIds.length) return fail("Choose at least one factory.");
    if (factoryIds.some((id) => !takesQuestionsWith(scope, id))) return fail("You can only send questionnaires to factories you are linked to.", 403);
    const today = new Date();
    const due = typeof body.dueOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueOn) && body.dueOn > today.toISOString().slice(0, 10)
      ? body.dueOn
      : new Date(today.getTime() + 21 * 864e5).toISOString().slice(0, 10);
    const groupId = `q-${hex(4)}`;
    const refs = questions.map((_, i) => `r${i + 1}`);
    const copies: StoredQuestionnaire[] = factoryIds.map((factoryOrgId) => {
      const id = `${groupId}-${hex(3)}`;
      return {
        id,
        groupId,
        title,
        buyer: scope.orgNameOf(scope.orgId),
        factory: scope.orgNameOf(factoryOrgId),
        buyerOrgId: scope.orgId,
        factoryOrgId,
        createdBy: session.name,
        sentOn: today.toISOString().slice(0, 10),
        dueOn: due,
        questions: questions.map((text, i) => ({ id: `${id}-${refs[i]}`, ref: refs[i], text, expected: { category: "document_fact" } })),
      };
    });
    await saveQuestionnaires(copies);
    return NextResponse.json({ groupId, sentTo: copies.length });
  }

  const mine = await visibleQuestionnaires(scope, state);

  if (body.action === "ask") {
    if (session.role !== "buyer") return fail("Only buyers ask questions.", 403);
    const groupId = body.groupId ?? mine.find((q) => q.id === body.questionnaireId)?.groupId;
    const group = mine.filter((q) => q.groupId === groupId);
    const text = cleanQuestion(body.text);
    if (!group.length) return fail("Unknown questionnaire.", 404);
    if (text.length < 8 || text.length > 300) return fail("Write a question of 8 to 300 characters.");
    // The question goes to every factory in this questionnaire that can still receive questions.
    const open = group.filter((q) => takesQuestionsWith(scope, questionnaireParties(scope, q).factory));
    if (!open.length) return fail("You can't send new questions while an unlink is pending or after unlinking.", 409);
    const ref = `x${hex(4)}`;
    const askedAt = new Date().toISOString();
    for (const q of open) await saveAskedQuestion(q.id, { id: `${q.id}-${ref}`, ref, text, askedBy: session.name, askedAt });
    return NextResponse.json({ asked: { ref, text, askedAt }, sentTo: open.length });
  }

  if (session.role !== "factory") return fail("Only the factory answers questions.", 403);
  const qn = mine.find((q) => q.questions.some((x) => x.id === body.questionId));
  const question = qn?.questions.find((x) => x.id === body.questionId);
  if (!qn || !question) return fail("Unknown question.");
  const parties = questionnaireParties(scope, qn);
  if (!isLiveWith(scope, parties.buyer)) return fail("You are no longer linked with this buyer.", 409);

  if (body.action === "draft") {
    if (scope.orgId !== FIXTURE_DOCS_ORG) return fail("Upload your documents first; AI drafts need them.", 409);
    return NextResponse.json({ draft: await draftAnswer(question) });
  }

  if (body.action === "approve") {
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    const docId = body.docId && findFactoryDocument(body.docId) ? body.docId : null;
    if (!answer || answer.length > 500) return fail("Write an answer (up to 500 characters).");
    // A cited quote must really be in the cited document, even after a person edits the answer.
    if (quote && (!docId || !quoteIsInDocument(quote, docId))) return fail("The quoted sentence is not in the cited document.");
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
    const saved = { ...sealed, approvedBy: guard.session.name, approvedAt: new Date().toISOString(), ledgerBlock: block.block, aiDrafted: body.aiDrafted === true };
    await saveAnswer(saved);
    return NextResponse.json({ approved: saved });
  }

  return fail("Unknown action.");
}
