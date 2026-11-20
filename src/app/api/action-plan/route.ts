import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { kvRead, kvUpdate } from "@/lib/server/kv";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import { recordBlockParties } from "@/lib/server/ledger-parties";
import { WATCHED_RULES } from "@/lib/watched-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Compliance Action Plan state for one factory.
 *
 *   GET                                              watched rules, the version of each this factory last reviewed,
 *                                                    and the fixes approved so far
 *   POST { action: "approve", ruleId, version, fix } a person approves one fix: kept, and recorded in the activity log
 *   POST { action: "reviewed", ruleId, version }     a person marks a rule change as reviewed: recorded too
 *
 * Only a person at the factory can approve or review; an AI agent cannot.
 */
interface State {
  reviewed: Record<string, number>;
  approvals: Record<string, { fix: string; by: string; at: string; block: number }>;
}
const key = (orgId: string) => `actionplan:${orgId}`;
const none = (): State => ({ reviewed: {}, approvals: {} });
const approvalKey = (ruleId: string, version: number, fix: string) => `${ruleId}@${version}#${createHash("sha256").update(fix).digest("hex").slice(0, 16)}`;

export async function GET(req: NextRequest) {
  const g = await requireSession(req, ["factory"]);
  if (!g.ok) return g.response;
  const scope = await scopeFor(g.session);
  const state = await kvRead<State>(key(scope.orgId), none);
  return NextResponse.json({ rules: WATCHED_RULES, reviewed: state.reviewed ?? {}, approvals: state.approvals ?? {} });
}

export async function POST(req: NextRequest) {
  const g = await requireSession(req, ["factory"]);
  if (!g.ok) return g.response;
  if (isAgentSession(g.session)) return NextResponse.json({ error: "Only a person can approve fixes or review rule changes." }, { status: 403 });
  const scope = await scopeFor(g.session);
  const body = (await req.json().catch(() => null)) as { action?: string; ruleId?: string; version?: number; fix?: string } | null;
  const ruleId = String(body?.ruleId ?? "").slice(0, 40);
  const version = Number(body?.version) || 0;
  const rule = WATCHED_RULES.find((r) => r.id === ruleId);
  const name = rule?.name ?? "A rule change entered by hand";
  const log = async (type: string, summary: string) => {
    const { block } = await appendLedgerBlock({ type, actor: scope.orgNameOf(scope.orgId), summary, styleCode: null, payloadHash: null, status: "verified" });
    await recordBlockParties(block.block, [scope.orgId]);
    return block.block as number;
  };

  if (body?.action === "approve") {
    const fix = String(body.fix ?? "").trim().slice(0, 400);
    if (fix.length < 5) return NextResponse.json({ error: "Which fix?" }, { status: 400 });
    const k = approvalKey(ruleId || "manual", version, fix);
    const existing = (await kvRead<State>(key(scope.orgId), none)).approvals?.[k];
    if (existing) return NextResponse.json({ approval: existing });
    const block = await log("ACTION PLAN FIX APPROVED", `${g.session.name} approved a fix for "${name}"${version ? ` (version ${version})` : ""}: ${fix}`);
    const approval = { fix, by: g.session.name, at: new Date().toISOString(), block };
    await kvUpdate<State>(key(scope.orgId), none, (s) => {
      s.approvals = { ...(s.approvals ?? {}), [k]: approval };
    });
    return NextResponse.json({ approval }, { status: 201 });
  }
  if (body?.action === "reviewed") {
    if (!rule || !rule.versions.some((v) => v.version === version)) return NextResponse.json({ error: "Unknown rule version." }, { status: 400 });
    const block = await log("RULE CHANGE REVIEWED", `${g.session.name} reviewed "${name}" version ${version} and its action plan.`);
    await kvUpdate<State>(key(scope.orgId), none, (s) => {
      s.reviewed = { ...(s.reviewed ?? {}), [ruleId]: version };
    });
    return NextResponse.json({ reviewed: version, block });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
