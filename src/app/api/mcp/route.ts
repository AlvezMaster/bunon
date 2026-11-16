import { NextRequest, NextResponse } from "next/server";
import { getStyleData, listStyles, normalizeStyleCode, styleClearance, type StyleData } from "@/lib/styles";
import { buildProvenanceTree } from "@/lib/provenance";
import { findCertificateByNumber } from "@/lib/certificate-registry";
import { getSession } from "@/lib/server/auth";

/**
 * Model Context Protocol (MCP) endpoint, JSON-RPC over HTTP (protocol 2024-11-05).
 *
 * Lets a buyer's AI assistant query the same demo catalog the web app shows. Every company and
 * certificate is fictional and the certificate registry is simulated; each tool result says so.
 * `initialize` and `tools/list` are open; `tools/call` needs a signed-in session (production would
 * use per-buyer API tokens instead).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const SERVER_INFO = { name: "bunon-evidence-mcp", version: "1.1.0" };
const PROTOCOL_VERSION = "2024-11-05";
const DEMO_NOTE = "Demo data: all companies and certificates are fictional, and the certificate registry is simulated.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TOOLS_MANIFEST = [
  {
    name: "list_styles",
    description: "Lists the orders (style codes) in the demo catalog with their buyer and certificate status.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "verify_style_compliance",
    description:
      "For one order: whether every supplier certificate is in date, which tiers are expired, and the SHA-256 Merkle root over the supplier tiers.",
    inputSchema: {
      type: "object",
      properties: { style_code: { type: "string", description: "Style code, e.g. 'DN-2026'" } },
      required: ["style_code"],
    },
  },
  {
    name: "query_supply_chain_tier",
    description: "Returns one supplier tier of an order (0 = garment factory … 4 = cotton farm) with its certificate and registry record.",
    inputSchema: {
      type: "object",
      properties: {
        style_code: { type: "string", description: "Style code, e.g. 'DN-2026'" },
        tier: { type: "number", description: "Tier number from 0 (factory) to 4 (farm)" },
      },
      required: ["style_code", "tier"],
    },
  },
];

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }, { headers: CORS });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status, headers: CORS });
}

function styleSummary(style: StyleData) {
  const clearance = styleClearance(style);
  return {
    style_code: style.code,
    title: style.title,
    buyer: style.buyer,
    volume: style.volume,
    certificates_in_date: clearance.cleared,
    status: clearance.label,
  };
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (name === "list_styles") {
    return { note: DEMO_NOTE, styles: listStyles().map(styleSummary) };
  }

  const code = normalizeStyleCode(typeof args.style_code === "string" ? args.style_code : "");
  const style = getStyleData(code);
  if (!style) throw new Error(`No order with style code "${code}". Call list_styles for the available codes.`);

  if (name === "verify_style_compliance") {
    const provenance = await buildProvenanceTree(style);
    return {
      note: DEMO_NOTE,
      ...styleSummary(style),
      merkle_root: provenance.root,
      tiers: style.tiers.map((t) => ({
        tier: t.tierNumber,
        step: t.stepName,
        facility: t.facilityName,
        certificate: t.certNumber,
        certificate_type: t.certType,
        valid_through: t.validThrough,
        status: t.status,
      })),
    };
  }

  if (name === "query_supply_chain_tier") {
    const tierNumber = Number(args.tier);
    const tier = style.tiers.find((t) => t.tierNumber === tierNumber);
    if (!tier) throw new Error(`Order ${style.code} has no tier ${String(args.tier)}. Tiers run from 0 to 4.`);
    const registry = findCertificateByNumber(tier.certNumber);
    return {
      note: DEMO_NOTE,
      style_code: style.code,
      tier: tier.tierNumber,
      step: tier.stepName,
      facility: tier.facilityName,
      location: tier.facilityLocation,
      material: tier.material,
      certificate: tier.certNumber,
      certificate_type: tier.certType,
      valid_through: tier.validThrough,
      status: tier.status,
      registry_record: registry
        ? {
            issuer: registry.issuer,
            standard: registry.standard,
            licensee: registry.licensee,
            scope: registry.scope,
            valid_until: registry.validUntil,
            registry_status: registry.status,
          }
        : null,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

/** Plain status check for humans and uptime monitors. */
export async function GET() {
  return NextResponse.json(
    {
      status: "online",
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: SERVER_INFO,
      description: "Bunon evidence MCP server (demo catalog). POST JSON-RPC requests to this URL.",
      available_tools: TOOLS_MANIFEST.map((t) => t.name),
      note: DEMO_NOTE,
    },
    { headers: CORS }
  );
}

export async function POST(req: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error: the body must be JSON.", 400);
  }
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return rpcError(body?.id, -32600, "Invalid request: expected a JSON-RPC 2.0 object with a method.", 400);
  }

  switch (body.method) {
    case "initialize":
      return rpcResult(body.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: DEMO_NOTE,
      });
    case "notifications/initialized":
      return new NextResponse(null, { status: 202, headers: CORS });
    case "ping":
      return rpcResult(body.id, {});
    case "tools/list":
      return rpcResult(body.id, { tools: TOOLS_MANIFEST });
    case "tools/call": {
      if (!getSession(req)) {
        return rpcError(body.id, -32001, "Sign in to Bunon before calling tools.", 401);
      }
      const name = typeof body.params?.name === "string" ? body.params.name : "";
      const args = (body.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const result = await executeTool(name, args);
        return rpcResult(body.id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool failed.";
        return rpcResult(body.id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    default:
      return rpcError(body.id, -32601, `Method not found: ${body.method}`);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
