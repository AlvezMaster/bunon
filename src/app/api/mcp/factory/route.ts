import { NextRequest, NextResponse } from "next/server";
import { resolveAgentToken, touchAgentToken } from "@/lib/server/agent-tokens";
import { agentContext, FACTORY_TOOLS, HUMAN_ONLY, runFactoryTool } from "@/lib/server/factory-mcp";

/**
 * Factory MCP endpoint: Model Context Protocol, JSON-RPC over HTTP (protocol 2024-11-05).
 *
 * Lets a factory connect its own AI agent to Bunon. The agent authenticates with an agent token the factory makes
 * on its "AI agents" page (Authorization: Bearer bnn_agent_…), and then sees and does what a person at that
 * factory can in the web app, minus anything a person must decide (see HUMAN_ONLY). `initialize` and
 * `tools/list` are open; `tools/call` needs a valid token.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const SERVER_INFO = { name: "bunon-factory-mcp", version: "1.0.0" };
const PROTOCOL_VERSION = "2024-11-05";
const INSTRUCTIONS =
  "You are working for one garment factory in Bunon. Answers to buyers must rest on the factory's own documents: draft them with draft_answer, then prepare_answer leaves them for a person to check and send. " +
  HUMAN_ONLY;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const result = (id: JsonRpcRequest["id"], value: unknown) => NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result: value }, { headers: CORS });
const error = (id: JsonRpcRequest["id"], code: number, message: string, status = 200) =>
  NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status, headers: CORS });

/** Status check for people and uptime monitors. */
export async function GET() {
  return NextResponse.json(
    { status: "online", protocolVersion: PROTOCOL_VERSION, serverInfo: SERVER_INFO, description: "Bunon factory MCP. POST JSON-RPC with Authorization: Bearer <agent token>.", tools: FACTORY_TOOLS.map((t) => t.name), human_only: HUMAN_ONLY },
    { headers: CORS }
  );
}

export async function POST(req: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return error(null, -32700, "Parse error: the body must be JSON.", 400);
  }
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") return error(body?.id, -32600, "Invalid request: expected JSON-RPC 2.0 with a method.", 400);

  switch (body.method) {
    case "initialize":
      return result(body.id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
    case "notifications/initialized":
      return new NextResponse(null, { status: 202, headers: CORS });
    case "ping":
      return result(body.id, {});
    case "tools/list":
      return result(body.id, { tools: FACTORY_TOOLS });
    case "tools/call": {
      const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
      const token = await resolveAgentToken(bearer);
      if (!token) return error(body.id, -32001, "Send a valid agent token: Authorization: Bearer bnn_agent_… (make one on the factory's AI agents page).", 401);
      await touchAgentToken(token).catch(() => undefined);
      const name = typeof body.params?.name === "string" ? body.params.name : "";
      const args = (body.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const out = await runFactoryTool(name, args, await agentContext(token, req.nextUrl.origin));
        return result(body.id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }], isError: false });
      } catch (err) {
        return result(body.id, { content: [{ type: "text", text: err instanceof Error ? err.message : "Tool failed." }], isError: true });
      }
    }
    default:
      return error(body.id, -32601, `Method not found: ${body.method}`);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
