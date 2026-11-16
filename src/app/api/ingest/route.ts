import { NextResponse, type NextRequest } from "next/server";
import { CERTIFICATE_DOCUMENT_FIXTURES, isCertificateScenario } from "@/lib/fixtures/certificate-documents";
import { runIngestion, type IngestionResult } from "@/lib/server/ingestion";
import { getSession } from "@/lib/server/auth";
import { appendLedgerBlock } from "@/lib/server/ledger-repo";
import type { LedgerBlock } from "@/lib/ledger";
import type { TierRenewal } from "@/lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export interface IngestResponse {
  success: true;
  result: IngestionResult;
  /** Present when the certificate verified and belongs to a catalog tier. */
  renewal: (TierRenewal & { tierId: string }) | null;
  ledger: { sealed: true; block: LedgerBlock; source: string } | { sealed: false; reason: string };
}

/**
 * POST /api/ingest
 *   multipart/form-data: `file` (PDF, text, JSON or image), optional `styleCode`, `allowSlm=false`
 *   or JSON: { scenario: "valid" | "expired" | "tampered", styleCode?, allowSlm? }
 *
 * Anyone may run the analysis (it only touches local resources). Sealing the result into the
 * ledger needs a factory session; otherwise `ledger.sealed` is false with the reason.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  let styleCode: string | null = null;
  let result: IngestionResult;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });
      if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File exceeds 15 MB." }, { status: 413 });
      const sc = form.get("styleCode");
      styleCode = typeof sc === "string" && sc.trim() ? sc.trim().toUpperCase() : null;
      const bytes = new Uint8Array(await file.arrayBuffer());
      result = await runIngestion(
        { fileName: file.name, mimeType: file.type || "application/octet-stream", bytes },
        { allowOllama: form.get("allowSlm") !== "false" }
      );
    } else {
      const body = (await req.json().catch(() => null)) as { scenario?: unknown; styleCode?: unknown; allowSlm?: unknown } | null;
      if (!body || !isCertificateScenario(body.scenario)) {
        return NextResponse.json({ error: 'JSON body must include scenario: "valid", "expired" or "tampered".' }, { status: 400 });
      }
      styleCode = typeof body.styleCode === "string" && body.styleCode.trim() ? body.styleCode.trim().toUpperCase() : null;
      const fixture = CERTIFICATE_DOCUMENT_FIXTURES[body.scenario];
      result = await runIngestion(
        { fileName: fixture.fileName, mimeType: fixture.mimeType, scenario: body.scenario },
        { allowOllama: body.allowSlm !== false }
      );
    }
  } catch (error) {
    console.error("[bunon/ingest] pipeline error:", error);
    return NextResponse.json({ error: "The ingestion pipeline failed." }, { status: 500 });
  }

  const entry = result.assessment.entry;
  const renewal: IngestResponse["renewal"] =
    result.assessment.verdict === "verified" && entry?.tierId
      ? {
          tierId: entry.tierId,
          certNumber: entry.certNumber,
          certType: `${entry.standard} Scope Certificate`,
          validThrough: entry.validUntil,
          documentSha256: result.documentSha256,
          ingestedAt: new Date().toISOString(),
          engine: result.engine === "ollama" ? `ollama:${result.model}` : "rules",
        }
      : null;

  const session = getSession(req);
  let ledger: IngestResponse["ledger"];
  if (!session) {
    ledger = { sealed: false, reason: "Sign in to a factory account to seal this result into the ledger." };
  } else if (session.role !== "factory") {
    ledger = { sealed: false, reason: "Only factory accounts can seal certificate ingestions." };
  } else {
    try {
      const engineLabel = result.engine === "ollama" ? `local model ${result.model}` : "rules engine";
      const { block, source } = await appendLedgerBlock({
        type: "CERT INGESTION",
        actor: `${session.name} via ${engineLabel}`,
        summary: `${result.assessment.headline} (${result.fileName}${styleCode ? `, order ${styleCode}` : ""})`,
        styleCode,
        payloadHash: result.documentSha256,
        status: result.assessment.verdict === "verified" ? "verified" : "flagged",
      });
      ledger = { sealed: true, block, source };
    } catch (error) {
      console.error("[bunon/ingest] ledger append failed:", error);
      ledger = { sealed: false, reason: "The ledger is unavailable; this result was not recorded." };
    }
  }

  const response: IngestResponse = { success: true, result, renewal, ledger };
  return NextResponse.json(response);
}
