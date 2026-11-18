import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { getSession, requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { clearPrepared, getPrepared, savePrepared } from "@/lib/server/prepared-repo";
import { draftAnswer } from "@/lib/server/questionnaire-ai";
import { getCatalogState, saveAnswer, saveAskedQuestion, type CatalogState } from "@/lib/server/catalog-repo";
import { canSeeQuestionnaire, isLiveWith, questionnaireParties, scopeFor, takesQuestionsWith, type Scope } from "@/lib/server/access";
import { FIXTURE_DOCS_ORG } from "@/lib/server/accounts-repo";
import { allQuestionnaires, saveQuestionnaires, type AnyQuestionnaire, type StoredQuestionnaire } from "@/lib/server/questionnaires-repo";
import { recordBlockParties } from "@/lib/server/ledger-parties";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import { getOllamaStatus } from "@/lib/server/ollama";
import { quoteIsInDocument } from "@/lib/questionnaire";
import { FACTORY_DOCUMENTS } from "@/lib/fixtures/factory-documents";
import { listDocuments, loadCorpus } from "@/lib/server/documents-repo";
import { reuseSuggestions } from "@/lib/server/answer-memory";
import { canonicalJson, sha256Hex } from "@/lib/crypto";
import { partnerOf, acceptsNewQuestions } from "@/lib/links";
import { getSubscription } from "@/lib/server/billing";
import { canSendAnswers } from "@/lib/plans";

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
  const session = await getSession(req);
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
    // A factory sees its own document list; buyers only ever get titles (answers also carry the title).
    documents:
      session.role === "factory"
        ? (await listDocuments(scope.orgId)).map(({ id, title, fileName }) => ({ id, title, fileName }))
        : docsVisible
          ? FACTORY_DOCUMENTS.map(({ id, title, fileName }) => ({ id, title, fileName }))
          : [],
    // Which earlier buyer an answer was reused from is the factory's business, never another buyer's.
    answers: Object.fromEntries(
      Object.entries(state.answers ?? {})
        .filter(([id]) => ids.has(id))
        .map(([id, a]) => [id, session.role === "factory" ? a : { ...a, reusedFrom: undefined }])
    ),
    // Factory only: answers its AI agent prepared (waiting for a person to send them).
    prepared:
      session.role === "factory"
        ? Object.fromEntries(Object.entries(await getPrepared()).filter(([id]) => ids.has(id) && !state.answers?.[id]))
        : {},
    // Factory only: unanswered questions that an answer it already sent to another buyer also answers.
    reuse:
      session.role === "factory"
        ? await reuseSuggestions({ factoryOrgId: scope.orgId, questionnaires, answers: state.answers ?? {}, docs: (await loadCorpus(scope.orgId)).docs }).catch((error) => {
            console.warn("[bunon/questionnaire] answer memory unavailable:", (error as Error).message);
            return {};
          })
        : {},
    model: session.role === "factory" && ollama.available ? qaModel : null,
  });
}

type Body =
  | { action: "create"; title: string; dueOn?: string; questions: string[]; factoryOrgIds: string[] }
  | { action: "ask"; groupId?: string; questionnaireId?: string; text: string }
  | { action: "draft"; questionId: string }
  | { action: "approve"; questionId: string; answer: string; quote?: string; docId?: string | null; aiDrafted?: boolean; reusedFrom?: string }
  | { action: "prepare"; questionId: string; answer: string; quote?: string; docId?: string | null };

const cleanQuestion = (t: unknown) => (typeof t === "string" ? t.trim().replace(/\s+/g, " ") : "");

/**
 * POST /api/questionnaire
 *   buyer:   "create" a questionnaire for one or more linked factories; "ask" a new question of every factory in it
 *   factory: "draft" an answer from its documents; "prepare" one for a person to check (its AI agent);
 *            "approve" (send) an answer, which only a person can do
 */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
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
    if (!(await listDocuments(scope.orgId)).length) return fail("Upload your documents first; answers are drafted from them.", 409);
    return NextResponse.json({ draft: await draftAnswer(question, scope.orgId) });
  }

  if (body.action === "prepare") {
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    if (!answer || answer.length > 500) return fail("Write an answer (up to 500 characters).");
    if (state.answers?.[question.id]) return fail("This question is already answered.", 409);
    const { docs } = await loadCorpus(scope.orgId);
    const doc = body.docId ? docs.find((d) => d.id === body.docId) : undefined;
    // The same rule as for sending: a cited quote must really be in the cited document.
    if (quote && (!doc || !quoteIsInDocument(quote, doc.id, docs))) return fail("The quoted sentence is not in the cited document.");
    await savePrepared({ questionId: question.id, answer, quote: doc ? quote : "", docId: doc?.id ?? null, docTitle: doc?.title ?? null, preparedBy: session.name, preparedAt: new Date().toISOString() });
    const { block } = await appendLedgerBlock({
      type: "AGENT DRAFT PREPARED",
      actor: session.name,
      summary: `Draft prepared for question ${question.id} (${doc ? "cites a document" : "no source"}); waiting for a person at ${scope.orgNameOf(scope.orgId)} to check and send it.`,
      styleCode: null,
      payloadHash: null,
      status: "verified",
    });
    await recordBlockParties(block.block, [parties.factory]);
    return NextResponse.json({ prepared: { questionId: question.id, waitingForPerson: true } });
  }

  if (body.action === "approve") {
    // Sending an answer to a buyer is always a person's decision, never an AI agent's.
    if (isAgentSession(session)) return fail("Only a person can send an answer. Prepare it instead; a person checks and sends it in Bunon.", 403);
    // An unpaid plan (after its grace days) pauses sending; drafting and reading carry on.
    const billing = canSendAnswers(await getSubscription(scope.orgId));
    if (!billing.ok) return fail(billing.reason ?? "Your plan is unpaid.", 402);
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    const { docs } = await loadCorpus(scope.orgId);
    const doc = body.docId ? docs.find((d) => d.id === body.docId) : undefined;
    const docId = doc ? doc.id : null;
    if (!answer || answer.length > 500) return fail("Write an answer (up to 500 characters).");
    // A cited quote must really be in the cited document, even after a person edits the answer.
    if (quote && (!docId || !quoteIsInDocument(quote, docId, docs))) return fail("The quoted sentence is not in the cited document.");
    // A reused answer must come from this factory's own approved answer to a question in another questionnaire.
    const reusedFrom =
      typeof body.reusedFrom === "string" &&
      state.answers[body.reusedFrom] &&
      mine.some((q) => q.id !== qn.id && questionnaireParties(scope, q).factory === scope.orgId && q.questions.some((x) => x.id === body.reusedFrom))
        ? body.reusedFrom
        : null;
    const sealed = { questionId: question.id, answer, quote, docId };
    const { block } = await appendLedgerBlock({
      type: "ANSWER APPROVED",
      actor: scope.orgNameOf(scope.orgId),
      // Only a reference and a fingerprint: the answer itself lives in the deletable answer store.
      summary: `Answer sent for question ${question.id} (${doc ? "cited a document" : "written by a person"}${reusedFrom ? "; reused an earlier approved answer" : ""}). The fingerprint seals the answer text.`,
      styleCode: null,
      payloadHash: await sha256Hex(canonicalJson(sealed)),
      status: "verified",
    });
    await recordBlockParties(block.block, [parties.factory, parties.buyer]);
    const saved = { ...sealed, docTitle: doc?.title ?? null, approvedBy: guard.session.name, approvedAt: new Date().toISOString(), ledgerBlock: block.block, aiDrafted: body.aiDrafted === true, reusedFrom };
    await saveAnswer(saved);
    await clearPrepared([question.id]);
    return NextResponse.json({ approved: saved });
  }

  return fail("Unknown action.");
}
