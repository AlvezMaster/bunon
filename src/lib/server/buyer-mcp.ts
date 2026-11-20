/**
 * Tools of the buyer MCP connector (/api/mcp/buyer): what a buyer's own AI agent can read in Bunon.
 *
 * Read-only. Like the factory connector, every tool calls the API handler the web app uses, with a short-lived
 * session signed for the agent ("agent:<token id>", role buyer, that buyer only), so the agent sees exactly what a
 * person at the buyer sees: the questionnaires it sent, the answers factories sent back with the sentence and
 * document each rests on, its linked factories and its activity log. Nothing that changes data is offered.
 */
import { signSession, AGENT_SUBJECT_PREFIX } from "@/lib/server/session";
import { orgIndex } from "@/lib/server/accounts-repo";
import type { AgentToken } from "@/lib/server/agent-tokens";
import { GET as questionnaireGET } from "@/app/api/questionnaire/route";
import { GET as linksGET } from "@/app/api/links/route";
import { GET as ledgerGET } from "@/app/api/audit-ledger/route";
import { call, orgName, type Ctx } from "@/lib/server/factory-mcp";
import { tokens } from "@/lib/questionnaire";

export const BUYER_READ_ONLY =
  "This connector only reads. Sending questionnaires, asking new questions, and linking or unlinking factories stay with a person at the buyer in the Bunon web app.";

const str = (description: string) => ({ type: "string", description });

export const BUYER_TOOLS = [
  { name: "get_overview", description: "This buyer at a glance: linked factories, questionnaires sent, how many questions are answered, and how many answers carry their source sentence.", inputSchema: { type: "object", properties: {} } },
  { name: "list_questionnaires", description: "Every questionnaire this buyer sent, one entry per factory, with due date, state and how many questions that factory has answered.", inputSchema: { type: "object", properties: {} } },
  {
    name: "get_answers",
    description: "One factory's answers to one questionnaire: each question with the answer, the exact sentence it rests on, the document title, when it was sent and its activity log entry. Unanswered questions are marked as waiting.",
    inputSchema: { type: "object", properties: { questionnaire_id: str("From list_questionnaires") }, required: ["questionnaire_id"] },
  },
  {
    name: "search_answers",
    description: "Finds answers on a topic across every factory (for example 'fire safety' or 'overtime'), so the agent can compare factories. English keywords.",
    inputSchema: { type: "object", properties: { topic: str("A topic or question, at least 3 characters") }, required: ["topic"] },
  },
  { name: "list_factories", description: "The factories this buyer is linked to, and since when.", inputSchema: { type: "object", properties: {} } },
  {
    name: "get_activity_log",
    description: "The buyer's tamper-evident activity log, newest first, with whether the hash chain verifies.",
    inputSchema: { type: "object", properties: { limit: { type: "number", description: "How many entries, 1 to 100 (default 30)" } } },
  },
];

/** A short-lived buyer session for this agent: the buyer's own scope, marked as an agent. */
export async function buyerAgentContext(token: AgentToken, origin: string): Promise<Ctx> {
  const org = (await orgIndex()).byId.get(token.orgId);
  const cookie = signSession({ sub: `${AGENT_SUBJECT_PREFIX}${token.id}`, email: "", role: "buyer", name: `AI agent · ${token.name}`, org: org?.name ?? "", oid: token.orgId }, Date.now(), 300);
  return { origin, cookie };
}

interface BuyerPayload {
  questionnaires: Array<{ id: string; factory: string; title: string; sentOn: string; dueOn: string; linkState?: string; questions: Array<{ id: string; text: string }> }>;
  answers: Record<string, { answer: string; quote: string; docTitle?: string | null; approvedAt?: string; approvedBy: string; ledgerBlock: number | null; aiDrafted: boolean }>;
}

const answerOut = (a: BuyerPayload["answers"][string]) => ({
  answer: a.answer,
  quote: a.quote || null,
  document: a.docTitle ?? null,
  sent_at: a.approvedAt ?? null,
  approved_by: a.approvedBy,
  drafted_by_ai: a.aiDrafted,
  activity_log_entry: a.ledgerBlock,
});

export async function runBuyerTool(name: string, args: Record<string, unknown>, ctx: Ctx): Promise<Record<string, unknown>> {
  const q = () => call<BuyerPayload>(questionnaireGET, ctx, "/api/questionnaire");
  const links = () => call<{ me: { name: string }; links: Array<{ status: string; createdAt: string; partner: { name: string } }> }>(linksGET, ctx, "/api/links");
  const text = (k: string) => (typeof args[k] === "string" ? (args[k] as string).trim() : "");

  switch (name) {
    case "get_overview": {
      const [qs, l] = await Promise.all([q(), links()]);
      const all = qs.questionnaires.flatMap((x) => x.questions);
      const answered = all.filter((x) => qs.answers[x.id]);
      return {
        buyer: orgName(l.me.name),
        factories: l.links.map((x) => ({ name: orgName(x.partner.name), status: x.status })),
        questionnaires_sent: new Set(qs.questionnaires.map((x) => `${x.title}|${x.sentOn}`)).size,
        factory_copies: qs.questionnaires.length,
        questions: { total: all.length, answered: answered.length, waiting: all.length - answered.length },
        answers_with_source_sentence: answered.filter((x) => qs.answers[x.id].quote).length,
        note: BUYER_READ_ONLY,
      };
    }
    case "list_questionnaires": {
      const qs = await q();
      return {
        questionnaires: qs.questionnaires.map((x) => ({
          questionnaire_id: x.id,
          factory: orgName(x.factory),
          title: x.title,
          sent_on: x.sentOn,
          due_on: x.dueOn,
          state: x.linkState ?? "open",
          answered: x.questions.filter((y) => qs.answers[y.id]).length,
          questions: x.questions.length,
        })),
      };
    }
    case "get_answers": {
      const qs = await q();
      const x = qs.questionnaires.find((y) => y.id === text("questionnaire_id"));
      if (!x) throw new Error("No such questionnaire. Call list_questionnaires for the ids.");
      return {
        questionnaire_id: x.id,
        factory: orgName(x.factory),
        title: x.title,
        due_on: x.dueOn,
        questions: x.questions.map((y, i) => {
          const a = qs.answers[y.id];
          return { n: i + 1, question: y.text, state: a ? "answered" : "waiting for the factory", ...(a ? answerOut(a) : {}) };
        }),
      };
    }
    case "search_answers": {
      const topic = text("topic");
      if (topic.length < 3) throw new Error("Give a topic of at least 3 characters.");
      const want = new Set(tokens(topic));
      if (!want.size) throw new Error("Use a few plain words, for example 'fire safety'.");
      const qs = await q();
      const hits = qs.questionnaires
        .flatMap((x) => x.questions.map((y) => ({ x, y, a: qs.answers[y.id] })))
        .filter(({ a }) => a)
        .map(({ x, y, a }) => {
          const words = new Set(tokens(`${y.text} ${a.answer} ${a.quote} ${a.docTitle ?? ""}`));
          return { score: [...want].filter((w) => words.has(w)).length, factory: orgName(x.factory), questionnaire_id: x.id, question: y.text, ...answerOut(a) };
        })
        .filter((h) => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(({ score: _score, ...h }) => h);
      return { topic, found: hits.length, answers: hits };
    }
    case "list_factories": {
      const l = await links();
      return { factories: l.links.map((x) => ({ factory: orgName(x.partner.name), status: x.status, linked_since: x.createdAt })) };
    }
    case "get_activity_log": {
      const limit = Math.max(1, Math.min(100, Number(args.limit) || 30));
      const res = await call<{ verification?: unknown; blocks: Array<Record<string, unknown>> }>(ledgerGET, ctx, `/api/audit-ledger?limit=${limit}`);
      return {
        chain: res.verification ?? null,
        entries: res.blocks.map((b) => ({ entry: b.block, time: b.timestamp ?? b.time, event: b.type, by: b.actor, summary: b.summary, status: b.status })),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}. Call tools/list.`);
  }
}
