import { NextResponse, type NextRequest } from "next/server";
import { LedgerValidationError, parseLedgerInput, type LedgerBlockInput } from "@/lib/ledger";
import { canAppendEvent } from "@/lib/ledger-policy";
import { getSession, requireSession } from "@/lib/server/auth";
import { appendLedgerBlock, listLedger } from "@/lib/server/ledger-repo";
import { canSeeStyle, questionnaireParties, scopeFor, styleParties } from "@/lib/server/access";
import { getBlockParties, recordBlockParties } from "@/lib/server/ledger-parties";
import { getCatalogState } from "@/lib/server/catalog-repo";
import { STYLES_CATALOG, getStyleData } from "@/lib/styles";
import { QUESTIONNAIRES } from "@/lib/questionnaire";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/audit-ledger?limit=100 — newest first, with chain verification. Needs any signed-in user. */
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Sign in to view the ledger.", code: "UNAUTHENTICATED" }, { status: 401 });
  }
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "100");
  try {
    const [{ blocks, source, verification }, scope, parties, state] = await Promise.all([
      listLedger(Number.isFinite(limitParam) ? limitParam : 100),
      scopeFor(session),
      getBlockParties(),
      getCatalogState(),
    ]);
    // Older answer blocks named their question in the summary; find their companies from that.
    const questionParties = (summary: string) => {
      const q = QUESTIONNAIRES.find((qn) => qn.questions.some((x) => summary.includes(`"${x.text}"`) || summary.includes(`question ${x.id} `)));
      return q ? Object.values(questionnaireParties(scope, q)) : [];
    };
    // The chain is verified on the full blocks above; entries about other companies are then hidden.
    const mine = (b: (typeof blocks)[number]) => {
      if (b.styleCode) {
        const style = getStyleData(b.styleCode, state.customStyles) ?? STYLES_CATALOG[b.styleCode];
        return !!style && canSeeStyle(scope, style);
      }
      const who = parties[String(b.block)] ?? questionParties(b.summary);
      return who.length === 0 ? b.type !== "ANSWER APPROVED" : who.includes(scope.orgId);
    };
    const shown = blocks.map((b) =>
      mine(b) ? b : { ...b, actor: "Another company", summary: "An entry about another company. Its details are hidden; its fingerprint still counts in the chain check." }
    );
    return NextResponse.json({ success: true, source, verification, latestBlock: blocks[0]?.block ?? null, blocks: shown });
  } catch (error) {
    console.error("[bunon/ledger] GET error:", error);
    return NextResponse.json({ success: false, error: "Ledger unavailable." }, { status: 503 });
  }
}

/**
 * POST /api/audit-ledger — append ONE event. The server assigns block number, time, parent hash
 * and hash; clients only describe the event. Requires a session whose role may record that type.
 */
export async function POST(req: NextRequest) {
  const guard = requireSession(req);
  if (!guard.ok) return guard.response;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  let input: LedgerBlockInput;
  try {
    input = parseLedgerInput({ ...(raw as object), actor: guard.session.name });
  } catch (err) {
    if (err instanceof LedgerValidationError) {
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 });
    }
    throw err;
  }

  if (!canAppendEvent(guard.session.role, input.type)) {
    return NextResponse.json({ error: `Your role may not record ${input.type} events.`, code: "FORBIDDEN" }, { status: 403 });
  }
  // Every client-recorded event is about one order, and it must be an order this company is part of.
  const scope = await scopeFor(guard.session);
  const state = await getCatalogState();
  const style = input.styleCode ? getStyleData(input.styleCode, state.customStyles) : null;
  if (!style || !canSeeStyle(scope, style)) {
    return NextResponse.json({ error: "You can only record events for your own orders.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { block, source } = await appendLedgerBlock({ ...input, actor: scope.orgNameOf(scope.orgId) });
    const p = styleParties(scope, style);
    await recordBlockParties(block.block, [p.factory, p.buyer]);
    return NextResponse.json({ success: true, source, block }, { status: 201 });
  } catch (error) {
    console.error("[bunon/ledger] POST error:", error);
    return NextResponse.json({ success: false, error: "Could not seal the block." }, { status: 503 });
  }
}
