/**
 * A small factory AI agent for Bunon, built with the Vercel AI SDK agent loop (ToolLoopAgent).
 *
 *   Brain   an open model on the factory's own computer, through Ollama (default qwen3.5:4b),
 *           or any OpenAI-compatible endpoint (MODEL_URL, MODEL, MODEL_API_KEY).
 *   Hands   Bunon's factory MCP server over HTTP, signed in with an agent token from the factory's
 *           "AI agents" page. The agent sees only that factory's data.
 *
 * It finds open buyer questions, drafts answers from the factory's own documents (each with the exact quote
 * Bunon verified), and reports them. With --prepare it also leaves the drafts in Bunon for a person to check:
 * nothing reaches a buyer until a person presses Send. Without --prepare it only reads (a dry run).
 *
 *   BUNON_URL=https://your-bunon BUNON_AGENT_TOKEN=bnn_agent_… node agent.mjs [--prepare] [--max 3]
 */
import { ToolLoopAgent, isStepCount } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const arg = (name) => process.argv.includes(name);
const num = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 && Number(process.argv[i + 1]) > 0 ? Number(process.argv[i + 1]) : fallback;
};

const BUNON_URL = (process.env.BUNON_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKEN = process.env.BUNON_AGENT_TOKEN;
const MODEL_URL = process.env.MODEL_URL ?? "http://localhost:11434/v1"; // Ollama's OpenAI-compatible API
const MODEL = process.env.MODEL ?? "qwen3.5:4b";
const PREPARE = arg("--prepare");
const MAX = num("--max", 3);

if (!TOKEN) {
  console.error("Set BUNON_AGENT_TOKEN to a token from your factory's AI agents page in Bunon.");
  process.exit(1);
}

// Only the tools this job needs. prepare_answer is offered only with --prepare.
const WANTED = ["list_questionnaires", "get_questionnaire", "search_documents", "draft_answer", ...(PREPARE ? ["prepare_answer"] : [])];

const bunon = await createMCPClient({
  transport: { type: "http", url: `${BUNON_URL}/api/mcp/factory`, headers: { Authorization: `Bearer ${TOKEN}` }, redirect: "error" },
  // Bunon's MCP server speaks the 2024-11-05 protocol: start with the initialize handshake.
  protocolVersionDiscovery: false,
});

try {
  const all = await bunon.tools();
  const tools = Object.fromEntries(Object.entries(all).filter(([name]) => WANTED.includes(name)));

  const agent = new ToolLoopAgent({
    model: createOpenAICompatible({ name: "local", baseURL: MODEL_URL, apiKey: process.env.MODEL_API_KEY }).chatModel(MODEL),
    instructions: [
      "You work for one garment factory in Bunon. Buyers send the factory questionnaires; answers must rest on the factory's own documents.",
      "1. Call list_questionnaires, pick an open questionnaire with unanswered questions, and call get_questionnaire.",
      `2. For at most ${MAX} questions whose state is "open", call draft_answer with the question_id.`,
      PREPARE
        ? "3. When a draft comes back as \"draft with a verified quote\", call prepare_answer with its answer, quote and document_id. Skip drafts that need a person."
        : "3. This is a dry run: do not prepare or save anything.",
      "Never write a quote yourself: use only the quote draft_answer returned. Never claim an answer was sent; a person sends answers.",
      "Finish with a short plain report: each question, the answer, the quote and its document, or why a person must answer it.",
    ].join("\n"),
    tools,
    stopWhen: isStepCount(MAX * 3 + 6),
  });

  console.log(`Bunon factory agent · model ${MODEL} · ${PREPARE ? "preparing answers for a person to check" : "dry run (add --prepare to save drafts)"}\n`);
  const result = await agent.generate({ prompt: `Draft answers for up to ${MAX} open buyer questions.` });

  console.log("Tool calls:");
  for (const step of result.steps) for (const call of step.toolCalls) console.log(`  · ${call.toolName} ${JSON.stringify(call.input)}`);
  console.log(`\n${result.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()}`);
} finally {
  await bunon.close();
}
