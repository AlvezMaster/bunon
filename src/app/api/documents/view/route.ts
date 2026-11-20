import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { scopeFor } from "@/lib/server/access";
import { getDocument } from "@/lib/server/documents-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/documents/view?id=doc-…  →  one of this factory's documents with the full text Bunon reads, for the
 * document viewer. Only the factory that owns the document can read it.
 */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req, ["factory"]);
  if (!guard.ok) return guard.response;
  const scope = await scopeFor(guard.session);
  const found = await getDocument(scope.orgId, req.nextUrl.searchParams.get("id") ?? "");
  if (!found) return NextResponse.json({ error: "No such document." }, { status: 404 });
  const { meta, text } = found;
  return NextResponse.json({
    document: {
      id: meta.id,
      title: meta.title,
      fileName: meta.fileName,
      bytes: meta.bytes,
      uploadedAt: meta.uploadedAt,
      uploadedBy: meta.uploadedBy,
      validUntil: meta.validUntil,
      demo: !!meta.demo,
      fromPhoto: !!meta.fromPhoto,
      original: meta.stored ? { kind: meta.stored.resourceType === "image" ? "image" : /\.pdf$/i.test(meta.fileName) ? "pdf" : "file" } : null,
    },
    text,
  });
}
