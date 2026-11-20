import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { isAgentSession } from "@/lib/server/session";
import { scopeFor } from "@/lib/server/access";
import { listDocuments } from "@/lib/server/documents-repo";
import { originalLink } from "@/lib/server/file-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8" };

/**
 * GET /api/documents/file?id=doc-…  →  the original file, through a signed link that expires in 5 minutes.
 * GET /api/documents/file?id=doc-…&view=1  →  the same file passed through Bunon, marked to show in the browser
 * (for the document viewer), since Cloudinary's signed links download instead of showing.
 * Only a person at the factory that owns the document can open it.
 */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req, ["factory"]);
  if (!guard.ok) return guard.response;
  if (isAgentSession(guard.session)) return NextResponse.json({ error: "Only a person can open original files." }, { status: 403 });
  const scope = await scopeFor(guard.session);
  const doc = (await listDocuments(scope.orgId)).find((d) => d.id === req.nextUrl.searchParams.get("id"));
  if (!doc?.stored) return NextResponse.json({ error: "No original file is kept for this document." }, { status: 404 });
  const link = await originalLink(doc.stored);
  if (req.nextUrl.searchParams.get("view") !== "1") return NextResponse.redirect(link, 302);
  const file = await fetch(link);
  if (!file.ok || !file.body) return NextResponse.json({ error: "The original file could not be loaded." }, { status: 502 });
  const ext = (doc.fileName.match(/\.([a-z0-9]+)$/i)?.[1] ?? doc.stored.format).toLowerCase();
  return new Response(file.body, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${doc.fileName.replace(/["\\\r\n]/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
