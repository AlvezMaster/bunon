import { NextRequest, NextResponse } from "next/server";
import { resolveAgentToken, tokenRole, touchAgentToken } from "@/lib/server/agent-tokens";
import { BUYER_READ_ONLY, BUYER_TOOLS, buyerAgentContext, runBuyerTool } from "@/lib/server/buyer-mcp";

/**
 * Buyer MCP endpoint: Model Context Protocol, JSON-RPC over HTTP (protocol 2024-11-05). Read-only.
 *
 * Lets a buyer connect its own AI agent to Bunon, to read the answers its factories sent with the exact sentence
 * and document behind each one. The agent authenticates with an agent token made on the buyer's "AI agents" page
 * (Authorization: Bearer bnn_agent_…). `initialize` and `tools/list` are open; `tools/call` needs a buyer token.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const SERVER_INFO = { name: "bunon-buyer-mcp", version: "1.0.0" };
const PROTOCOL_VERSION = "2024-11-05";
const INSTRUCTIONS =
  "You are reading for one brand or buyer in Bunon. Every answer a factory sent carries the exact sentence and document it rests on: quote them when you report, and say when a question is still waiting. " +
  BUYER_READ_ONLY;

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
    { status: "online", protocolVersion: PROTOCOL_VERSION, serverInfo: SERVER_INFO, description: "Bunon buyer MCP (read-only). POST JSON-RPC with Authorization: Bearer <agent token>.", tools: BUYER_TOOLS.map((t) => t.name), read_only: BUYER_READ_ONLY },
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
      return result(body.id, { tools: BUYER_TOOLS });
    case "tools/call": {
      const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
      const token = await resolveAgentToken(bearer);
      if (!token) return error(body.id, -32001, "Send a valid agent token: Authorization: Bearer bnn_agent_… (make one on the buyer's AI agents page).", 401);
      if (tokenRole(token) !== "buyer") return error(body.id, -32001, "This is a factory's agent token. Factories' agents use /api/mcp/factory.", 401);
      await touchAgentToken(token).catch(() => undefined);
      const name = typeof body.params?.name === "string" ? body.params.name : "";
      const args = (body.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const out = await runBuyerTool(name, args, await buyerAgentContext(token, req.nextUrl.origin));
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
