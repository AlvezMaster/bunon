import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { listDocuments } from "@/lib/server/documents-repo";
import { originalLink } from "@/lib/server/file-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/documents/file?id=doc-…  →  the original file, through a signed link that expires in 5 minutes.
 * Only a person at the factory that owns the document can open it.
 */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req, ["factory"]);
  if (!guard.ok) return guard.response;
  if (isAgentSession(guard.session)) return NextResponse.json({ error: "Only a person can open original files." }, { status: 403 });
  const scope = await scopeFor(guard.session);
  const doc = (await listDocuments(scope.orgId)).find((d) => d.id === req.nextUrl.searchParams.get("id"));
  if (!doc?.stored) return NextResponse.json({ error: "No original file is kept for this document." }, { status: 404 });
  return NextResponse.redirect(originalLink(doc.stored), 302);
}
