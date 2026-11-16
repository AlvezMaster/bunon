import { NextResponse, type NextRequest } from "next/server";
import { findInvite, orgIndex } from "@/lib/server/accounts-repo";
import { inviteState } from "@/lib/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/invites?token=…: public check of an invite link. Shows only the factory's name and whether it still works. */
export async function GET(req: NextRequest) {
  const inv = await findInvite(req.nextUrl.searchParams.get("token") ?? "");
  if (!inv) return NextResponse.json({ state: "invalid" }, { status: 404 });
  const idx = await orgIndex();
  return NextResponse.json({ state: inviteState(inv), factory: idx.byId.get(inv.factoryOrgId)?.name ?? "A factory", expiresAt: inv.expiresAt });
}
