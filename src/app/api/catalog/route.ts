import { NextResponse, type NextRequest } from "next/server";
import { getSession, requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { getCatalogState, resetStyle, saveCustomStyle } from "@/lib/server/catalog-repo";
import { STYLES_CATALOG, getStyleData, normalizeStyleCode, type StyleData, type TierId, type TierRenewal } from "@/lib/styles";
import { canSeeStyle, isLiveWith, scopeFor, styleParties } from "@/lib/server/access";
import { FIXTURE_DOCS_ORG } from "@/lib/server/accounts-repo";
import { partnerOf, type Link } from "@/lib/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/catalog: the orders this company may see (its own, or a linked factory's for its brand),
 * their renewals, and the companies it is linked to. Nothing from unlinked companies is returned.
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const [scope, state] = await Promise.all([scopeFor(session), getCatalogState()]);
  const customStyles = Object.fromEntries(Object.entries(state.customStyles).filter(([, st]) => canSeeStyle(scope, st)));
  const visibleCodes = [...Object.values(STYLES_CATALOG), ...Object.values(customStyles)].filter((st) => canSeeStyle(scope, st)).map((st) => st.code);
  const renewals = Object.fromEntries(Object.entries(state.renewals).filter(([code]) => visibleCodes.includes(code)));
  const partners = scope.links.map((l: Link) => ({ orgId: partnerOf(l, scope.orgId), name: scope.orgNameOf(partnerOf(l, scope.orgId)), status: l.status }));
  return NextResponse.json({ orgId: scope.orgId, renewals, customStyles, visibleCodes, partners });
}

type Body =
  | { action: "renewal"; styleCode: string; tierId: TierId; renewal: TierRenewal }
  | { action: "reset"; styleCode: string }
  | { action: "order"; style: StyleData };

/** POST /api/catalog: factory accounts record a renewal, reset an order, or add a new order. */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req, ["factory"]);
  if (!guard.ok) return guard.response;
  // Orders and renewals are recorded by a person, never by an AI agent.
  if (isAgentSession(guard.session)) return NextResponse.json({ error: "Only a person can do this in Bunon." }, { status: 403 });
  const scope = await scopeFor(guard.session);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const state = await getCatalogState();
  const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

  if (body.action === "order") {
    const s = body.style;
    if (!s || typeof s.code !== "string" || !Array.isArray(s.tiers) || s.tiers.length === 0) return bad("Invalid order.");
    const code = normalizeStyleCode(s.code);
    if (getStyleData(code, state.customStyles)) return bad(`Order ${code} already exists.`);
    // The order is always this factory's, and its buyer must be a company this factory is linked to.
    const buyerOrgId = typeof s.buyerOrgId === "string" ? s.buyerOrgId : undefined;
    if (buyerOrgId && !isLiveWith(scope, buyerOrgId)) return bad("Link with this buyer first.");
    const demoFactory = scope.orgId === FIXTURE_DOCS_ORG;
    const tiers = s.tiers.map((t) =>
      t.tierNumber === 0
        ? { ...t, facilityName: scope.orgNameOf(scope.orgId).replace(/\s*\(.*\)\s*$/, "") }
        : demoFactory
          ? t
          : { ...t, facilityName: `${t.facilityName} (example supplier, replace)` }
    );
    await saveCustomStyle({
      ...s,
      code,
      tiers,
      factoryOrgId: scope.orgId,
      buyerOrgId,
      buyer: buyerOrgId ? scope.orgNameOf(buyerOrgId) : "Pending buyer assignment",
    });
    return NextResponse.json({ ok: true });
  }

  const code = normalizeStyleCode(body.styleCode);
  const style = getStyleData(code, state.customStyles);
  if (!style) return bad(`No order ${code}.`);
  if (styleParties(scope, style).factory !== scope.orgId) return NextResponse.json({ error: "This order belongs to another factory." }, { status: 403 });

  if (body.action === "reset") {
    await resetStyle(code);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "renewal") {
    // Renewals are saved only by /api/ingest after the certificate itself has been checked.
    return NextResponse.json({ error: "Upload the certificate to renew it." }, { status: 410 });
  }

  return bad("Unknown action.");
}
