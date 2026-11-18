import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { KvAbort } from "@/lib/server/kv";
import { createAgentToken, listAgentTokens, revokeAgentToken, MAX_TOKENS_PER_FACTORY } from "@/lib/server/agent-tokens";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import { recordBlockParties } from "@/lib/server/ledger-parties";
import { getSubscription } from "@/lib/server/billing";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Agent tokens for the factory MCP endpoint. Only a signed-in person at a factory may list, make or revoke them;
 * an agent can never manage tokens. Making and revoking a token is recorded in the factory's ledger.
 *
 *   GET                                   this factory's tokens (never the token values)
 *   POST { action: "create", name }       a new token, shown once
 *   POST { action: "revoke", id }
 */
async function guard(req: NextRequest) {
  const g = requireSession(req, ["factory"]);
  if (!g.ok) return { error: g.response };
  if (isAgentSession(g.session)) return { error: NextResponse.json({ error: "An AI agent can't manage agent tokens." }, { status: 403 }) };
  return { session: g.session, scope: await scopeFor(g.session) };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.error) return g.error;
  return NextResponse.json({ tokens: await listAgentTokens(g.scope.orgId), max: MAX_TOKENS_PER_FACTORY, endpoint: `${req.nextUrl.origin}/api/mcp/factory` });
}

export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.error) return g.error;
  const body = (await req.json().catch(() => null)) as { action?: string; name?: string; id?: string } | null;
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
  const record = async (type: string, summary: string) => {
    const { block } = await appendLedgerBlock({ type, actor: g.scope.orgNameOf(g.scope.orgId), summary, styleCode: null, payloadHash: null, status: "verified" });
    await recordBlockParties(block.block, [g.scope.orgId]);
  };

  if (body?.action === "create") {
    if (PLANS[(await getSubscription(g.scope.orgId)).plan].limits.agentTokens === 0) return fail("AI agents are part of the Pro and Enterprise plans. Upgrade on the Billing page.", 402);
    try {
      const { token, meta } = await createAgentToken(g.scope.orgId, String(body.name ?? ""), g.session.name);
      await record("AGENT TOKEN CREATED", `${g.session.name} made agent token ${meta.id} ("${meta.name}") for the factory MCP connector.`);
      return NextResponse.json({ token, meta }, { status: 201 });
    } catch (error) {
      if (error instanceof KvAbort) return fail(error.message, 409);
      throw error;
    }
  }
  if (body?.action === "revoke") {
    const gone = await revokeAgentToken(g.scope.orgId, String(body.id ?? ""));
    if (!gone) return fail("No such token.", 404);
    await record("AGENT TOKEN REVOKED", `${g.session.name} revoked agent token ${gone.id} ("${gone.name}").`);
    return NextResponse.json({ ok: true });
  }
  return fail("Unknown action.");
}
