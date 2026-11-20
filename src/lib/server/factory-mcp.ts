/**
 * Tools of the factory MCP connector (/api/mcp/factory): what a factory's own AI agent can do in Bunon.
 *
 * Every tool calls the same API handler the web app uses, with a short-lived session signed for the agent
 * ("agent:<token id>", role factory, that factory only). So an agent sees exactly what a person at that factory
 * sees, through the same access rules (access.ts), and nothing else. Sending answers, links, invites, uploads and
 * orders stay with a person: those routes refuse agent sessions, and no tool offers them.
 */
import { NextRequest } from "next/server";
import { signSession, SESSION_COOKIE_NAME, AGENT_SUBJECT_PREFIX } from "@/lib/server/session";
import { orgIndex } from "@/lib/server/accounts-repo";
import type { AgentToken } from "@/lib/server/agent-tokens";
import { GET as questionnaireGET, POST as questionnairePOST } from "@/app/api/questionnaire/route";
import { GET as documentsGET, POST as documentsPOST } from "@/app/api/documents/route";
import { GET as linksGET } from "@/app/api/links/route";
import { GET as ledgerGET } from "@/app/api/audit-ledger/route";
import { GET as catalogGET } from "@/app/api/catalog/route";
import { getStyleData, styleClearance, type StyleData } from "@/lib/styles";

export const HUMAN_ONLY =
  "A person at the factory must do these in the Bunon web app: send an answer to a buyer, unlink or invite a buyer, upload or delete documents, add orders. An agent can prepare answers; a person checks and sends them.";

const str = (description: string) => ({ type: "string", description });

export const FACTORY_TOOLS = [
  { name: "get_overview", description: "This factory at a glance: linked buyers, open questionnaires, unanswered questions, answers ready to reuse or prepared by agents, documents on file.", inputSchema: { type: "object", properties: {} } },
  { name: "list_questionnaires", description: "Every buyer questionnaire this factory has, with its buyer, due date, whether it is open, and how many questions are answered.", inputSchema: { type: "object", properties: {} } },
  {
    name: "get_questionnaire",
    description: "One questionnaire's questions, each with its state: sent (with the answer and its source), prepared by an agent, ready from an earlier answer to another buyer, or open.",
    inputSchema: { type: "object", properties: { questionnaire_id: str("From list_questionnaires") }, required: ["questionnaire_id"] },
  },
  { name: "list_documents", description: "The factory's documents on file (licences, policies, reports) that answers are drafted from.", inputSchema: { type: "object", properties: {} } },
  {
    name: "search_documents",
    description: "Finds the passages in the factory's own documents that best answer a question (keywords and meaning; English or Bangla).",
    inputSchema: { type: "object", properties: { query: str("A question or topic, at least 4 characters") }, required: ["query"] },
  },
  {
    name: "draft_answer",
    description: "Drafts an answer to one question from the factory's documents, with the exact quote and document it rests on, after Bunon's checks. Saves nothing.",
    inputSchema: { type: "object", properties: { question_id: str("From get_questionnaire") }, required: ["question_id"] },
  },
  {
    name: "prepare_answer",
    description:
      "Leaves an answer for a person at the factory to check and send in Bunon. It does not reach the buyer. A quote, if given, must appear word for word in the cited document. Recorded in the factory's activity log.",
    inputSchema: {
      type: "object",
      properties: { question_id: str("From get_questionnaire"), answer: str("The answer, up to 500 characters"), quote: str("Exact sentence from the document (optional)"), document_id: str("The cited document (needed with a quote)") },
      required: ["question_id", "answer"],
    },
  },
  { name: "list_buyers", description: "The buyers this factory is linked to (and unlink states), and its invites (without invite links).", inputSchema: { type: "object", properties: {} } },
  {
    name: "get_activity_log",
    description: "The factory's tamper-evident activity log: checks, sent answers, documents, agent actions, newest first, with whether the hash chain verifies.",
    inputSchema: { type: "object", properties: { limit: { type: "number", description: "How many entries, 1 to 100 (default 30)" } } },
  },
  { name: "list_orders", description: "The factory's orders with their buyer and whether every supplier certificate is in date.", inputSchema: { type: "object", properties: {} } },
];

export interface Ctx {
  origin: string;
  cookie: string;
}

/** A short-lived session for this agent: the factory's own scope, marked as an agent. */
export async function agentContext(token: AgentToken, origin: string): Promise<Ctx> {
  const org = (await orgIndex()).byId.get(token.orgId);
  const cookie = signSession({ sub: `${AGENT_SUBJECT_PREFIX}${token.id}`, email: "", role: "factory", name: `AI agent · ${token.name}`, org: org?.name ?? "", oid: token.orgId }, Date.now(), 300);
  return { origin, cookie };
}

type Handler = (req: NextRequest) => Promise<Response>;

export async function call<T = Record<string, unknown>>(handler: Handler, ctx: Ctx, path: string, body?: unknown): Promise<T> {
  const req = new NextRequest(new URL(path, ctx.origin), {
    method: body === undefined ? "GET" : "POST",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${ctx.cookie}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await handler(req);
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Bunon returned HTTP ${res.status}`);
  return json;
}

interface QPayload {
  questionnaires: Array<{ id: string; buyer: string; title: string; sentOn: string; dueOn: string; linkState: string; questions: Array<{ id: string; text: string; added: string | null }> }>;
  answers: Record<string, { answer: string; quote: string; docTitle?: string | null; approvedAt?: string; approvedBy: string }>;
  reuse: Record<string, { answer: string; quote: string; docTitle: string | null; fromQuestion: string; topic: string }>;
  prepared: Record<string, { answer: string; quote: string; docTitle: string | null; preparedBy: string; preparedAt: string }>;
  documents: Array<{ id: string; title: string; fileName: string }>;
}

export const orgName = (s: string) => s.replace(/\s*\(.*\)\s*$/, "").trim();

export async function runFactoryTool(name: string, args: Record<string, unknown>, ctx: Ctx): Promise<Record<string, unknown>> {
  const q = () => call<QPayload>(questionnaireGET, ctx, "/api/questionnaire");
  const text = (k: string) => (typeof args[k] === "string" ? (args[k] as string).trim() : "");

  switch (name) {
    case "get_overview": {
      const [qs, links, docs] = await Promise.all([q(), call<{ me: { name: string }; links: Array<{ status: string; partner: { name: string } }> }>(linksGET, ctx, "/api/links"), call<{ documents: unknown[] }>(documentsGET, ctx, "/api/documents")]);
      const open = qs.questionnaires.filter((x) => x.linkState === "open");
      return {
        factory: links.me.name,
        buyers: links.links.map((l) => ({ name: orgName(l.partner.name), status: l.status })),
        questionnaires: {
          total: qs.questionnaires.length,
          open: open.length,
          unanswered_questions: open.reduce((n, x) => n + x.questions.filter((y) => !qs.answers[y.id]).length, 0),
          ready_from_earlier_answers: Object.keys(qs.reuse ?? {}).length,
          prepared_by_agents: Object.keys(qs.prepared ?? {}).length,
        },
        documents_on_file: docs.documents.length,
        human_only: HUMAN_ONLY,
      };
    }
    case "list_questionnaires": {
      const qs = await q();
      return {
        questionnaires: qs.questionnaires.map((x) => ({
          questionnaire_id: x.id,
          buyer: orgName(x.buyer),
          title: x.title,
          sent_on: x.sentOn,
          due_on: x.dueOn,
          state: x.linkState,
          answered: x.questions.filter((y) => qs.answers[y.id]).length,
          questions: x.questions.length,
        })),
      };
    }
    case "get_questionnaire": {
      const qs = await q();
      const x = qs.questionnaires.find((y) => y.id === text("questionnaire_id"));
      if (!x) throw new Error("No such questionnaire. Call list_questionnaires for the ids.");
      return {
        questionnaire_id: x.id,
        buyer: orgName(x.buyer),
        title: x.title,
        due_on: x.dueOn,
        state: x.linkState,
        questions: x.questions.map((y, i) => {
          const a = qs.answers[y.id];
          const p = qs.prepared?.[y.id];
          const r = qs.reuse?.[y.id];
          return {
            n: i + 1,
            question_id: y.id,
            text: y.text,
            state: a ? "sent" : p ? "prepared, waiting for a person" : r ? "ready from an earlier answer" : "open",
            ...(a ? { answer: a.answer, quote: a.quote || null, document: a.docTitle ?? null } : {}),
            ...(!a && p ? { answer: p.answer, quote: p.quote || null, document: p.docTitle, prepared_by: p.preparedBy } : {}),
            ...(!a && !p && r ? { earlier_answer: r.answer, quote: r.quote || null, document: r.docTitle, earlier_question: r.fromQuestion } : {}),
          };
        }),
      };
    }
    case "list_documents": {
      const docs = await call<{ documents: Array<Record<string, unknown>> }>(documentsGET, ctx, "/api/documents");
      return { documents: docs.documents.map((d) => ({ document_id: d.id, title: d.title, file: d.fileName, passages: d.passages ?? null, added: d.uploadedAt ?? d.createdAt ?? null })) };
    }
    case "search_documents": {
      const res = await call<{ meaning: boolean; passages: Array<{ docId: string; title: string; text: string; via: string[] }> }>(documentsPOST, ctx, "/api/documents", { action: "search", text: text("query") });
      return { search: res.meaning ? "keywords and meaning" : "keywords", passages: res.passages.map((p) => ({ document_id: p.docId, document: p.title, text: p.text, found_by: p.via })) };
    }
    case "draft_answer": {
      const id = text("question_id");
      const [res, qs] = await Promise.all([call<{ draft: Record<string, unknown> }>(questionnairePOST, ctx, "/api/questionnaire", { action: "draft", questionId: id }), q()]);
      const d = res.draft as { status: string; answer: string; value: string; quote: string; docId: string | null; reason: string; category: string };
      const doc = qs.documents.find((x) => x.id === d.docId);
      return {
        question_id: id,
        status: d.status === "draft" ? "draft with a verified quote" : "needs a person",
        answer: d.status === "draft" ? (d.answer === "yes" ? `Yes${d.value ? `: ${d.value}` : ""}` : d.answer === "no" ? `No${d.value ? `: ${d.value}` : ""}` : d.value) : null,
        quote: d.status === "draft" ? d.quote : null,
        document_id: d.status === "draft" ? d.docId : null,
        document: d.status === "draft" ? (doc?.title ?? null) : null,
        reason: d.status === "draft" ? null : d.reason,
        earlier_answer: qs.reuse?.[id]?.answer ?? null,
        next: d.status === "draft" ? "Call prepare_answer to leave it for a person to check and send." : "Leave this question for a person.",
      };
    }
    case "prepare_answer": {
      const res = await call<{ prepared: { questionId: string } }>(questionnairePOST, ctx, "/api/questionnaire", {
        action: "prepare",
        questionId: text("question_id"),
        answer: text("answer"),
        quote: text("quote"),
        docId: text("document_id") || null,
      });
      return { question_id: res.prepared.questionId, state: "prepared, waiting for a person", note: "A person at the factory checks it and presses Send in Bunon. Nothing has reached the buyer." };
    }
    case "list_buyers": {
      const l = await call<{ links: Array<{ status: string; createdAt: string; partner: { name: string }; unlink: unknown; exportUntil: string | null }>; invites: Array<Record<string, unknown>> }>(linksGET, ctx, "/api/links");
      return {
        buyers: l.links.map((x) => ({ buyer: orgName(x.partner.name), status: x.status, linked_since: x.createdAt, unlink: x.unlink, export_until: x.exportUntil })),
        invites: l.invites.map((i) => ({ note: i.note, state: i.state, expires_at: i.expiresAt, used_by: i.usedBy })),
      };
    }
    case "get_activity_log": {
      const limit = Math.max(1, Math.min(100, Number(args.limit) || 30));
      const res = await call<{ verification?: unknown; blocks: Array<Record<string, unknown>> }>(ledgerGET, ctx, `/api/audit-ledger?limit=${limit}`);
      return {
        chain: res.verification ?? null,
        entries: res.blocks.map((b) => ({ entry: b.block, time: b.timestamp ?? b.time, event: b.type, by: b.actor, summary: b.summary, status: b.status })),
      };
    }
    case "list_orders": {
      const cat = await call<{ visibleCodes: string[]; customStyles: Record<string, StyleData> }>(catalogGET, ctx, "/api/catalog");
      return {
        orders: cat.visibleCodes.map((code) => {
          const s = cat.customStyles[code] ?? getStyleData(code);
          if (!s) return { order: code };
          const c = styleClearance(s);
          return { order: s.code, title: s.title, buyer: orgName(s.buyer), volume: s.volume, certificates_in_date: c.cleared, status: c.label };
        }),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}. Call tools/list.`);
  }
}
