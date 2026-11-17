import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { scopeFor } from "@/lib/server/access";
import { MAX_DOCUMENTS, addDocument, deleteDocument, listDocuments } from "@/lib/server/documents-repo";
import { embeddingModel } from "@/lib/server/embeddings";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import { recordBlockParties } from "@/lib/server/ledger-parties";
import { sha256Hex } from "@/lib/crypto";
import { findEvidence } from "@/lib/server/questionnaire-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel accepts request bodies up to 4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_CHARS = 200_000;

async function pdfText(bytes: Uint8Array): Promise<string> {
  const unpdf = (await import("unpdf")) as unknown as {
    getDocumentProxy: (data: Uint8Array) => Promise<unknown>;
    extractText: (doc: unknown, opts: { mergePages: true }) => Promise<{ text: string }>;
  };
  return (await unpdf.extractText(await unpdf.getDocumentProxy(bytes), { mergePages: true })).text;
}

/** GET /api/documents: this factory's documents, and whether meaning search is on. */
export async function GET(req: NextRequest) {
  const guard = requireSession(req, ["factory"]);
  if (!guard.ok) return guard.response;
  const scope = await scopeFor(guard.session);
  return NextResponse.json({ documents: await listDocuments(scope.orgId), embedModel: await embeddingModel(), maxDocuments: MAX_DOCUMENTS });
}

/**
 * POST /api/documents
 *   multipart: `file` (PDF, .txt or .md, up to 4 MB), optional `title`, optional `validUntil` (YYYY-MM-DD)
 *   JSON: { action: "delete", id }
 */
export async function POST(req: NextRequest) {
  const guard = requireSession(req, ["factory"]);
  if (!guard.ok) return guard.response;
  const scope = await scopeFor(guard.session);
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

  if (!(req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const body = (await req.json().catch(() => null)) as { action?: string; id?: string; text?: string } | null;
    if (body?.action === "search") {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 300) : "";
      if (text.length < 4) return fail("Type a question.");
      const { corpus, evidence, meaning } = await findEvidence(scope.orgId, text);
      const title = (id: string) => corpus.docs.find((d) => d.id === id)?.title ?? id;
      return NextResponse.json({ meaning, passages: evidence.map((p) => ({ docId: p.docId, title: title(p.docId), text: p.text, via: p.via })) });
    }
    if (body?.action !== "delete" || typeof body.id !== "string") return fail("Unknown action.");
    return (await deleteDocument(scope.orgId, body.id)) ? NextResponse.json({ ok: true }) : fail("That document can't be deleted.", 404);
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Choose a file to upload.");
  if (file.size > MAX_BYTES) return fail("The file is larger than 4 MB.", 413);
  if ((await listDocuments(scope.orgId)).filter((d) => !d.demo).length >= MAX_DOCUMENTS) return fail(`You can keep up to ${MAX_DOCUMENTS} documents. Delete one first.`, 409);

  const name = file.name || "document";
  const lower = name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";
  try {
    if (lower.endsWith(".pdf") || file.type === "application/pdf") text = await pdfText(bytes);
    else if (/\.(txt|md|markdown)$/.test(lower) || file.type.startsWith("text/")) text = new TextDecoder("utf-8").decode(bytes);
    else return fail("Upload a PDF or a text file (.txt, .md).", 415);
  } catch {
    return fail("This file could not be read. If it is a scanned PDF, it needs a text layer.", 422);
  }
  text = text.replace(/\u0000/g, "").trim();
  if (text.length < 80) return fail("This file has almost no readable text. Scanned PDFs need a text layer (OCR is not supported yet).", 422);
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  const rawTitle = String(form.get("title") ?? "").trim();
  const title = (rawTitle || name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ")).slice(0, 120);
  const v = String(form.get("validUntil") ?? "").trim();
  const validUntil = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  const sha256 = await sha256Hex(bytes);

  const meta = await addDocument({ orgId: scope.orgId, title, fileName: name, text, sha256, bytes: file.size, validUntil, uploadedBy: guard.session.name });

  // The ledger records that this exact file was added (its fingerprint), not its content.
  const { block } = await appendLedgerBlock({
    type: "DOCUMENT ADDED",
    actor: scope.orgNameOf(scope.orgId),
    summary: `Document added for answering buyer questions (${meta.passages} passages${meta.embedModel ? ", searchable by meaning" : ""}). The fingerprint identifies the exact file.`,
    styleCode: null,
    payloadHash: sha256,
    status: "verified",
  });
  await recordBlockParties(block.block, [scope.orgId]);
  return NextResponse.json({ document: meta, ledgerBlock: block.block }, { status: 201 });
}
