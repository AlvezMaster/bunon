/**
 * Certificate ingestion pipeline (server-only orchestration):
 *
 *   bytes ──► SHA-256 fingerprint
 *         ──► text layer (PDF via unpdf, UTF-8 for text/JSON; images have none)
 *         ──► field extraction: local SLM (Ollama) when available, deterministic rules otherwise
 *             (rules always run as a cross-check; blanks in the SLM output are filled from rules)
 *         ──► issuer-registry assessment (traffic light)
 *
 * Nothing here calls a cloud service: the only network hop is to the local Ollama runtime.
 */
import { sha256Hex } from "../crypto.ts";
import { extractCertificateByRules, type ExtractedCertificate } from "../extraction.ts";
import { assessCertificate, type CertificateAssessment } from "../certificate-registry.ts";
import { CERTIFICATE_DOCUMENT_FIXTURES, type CertificateScenario } from "../fixtures/certificate-documents.ts";
import { extractCertificateWithOllama, getOllamaStatus } from "./ollama.ts";

export interface IngestionInput {
  fileName: string;
  mimeType: string;
  /** Raw document bytes (uploads). Omit for fixture scenarios. */
  bytes?: Uint8Array;
  /** Demo scenario — uses the bundled fixture document instead of bytes. */
  scenario?: CertificateScenario;
}

export interface IngestionResult {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  documentSha256: string;
  textChars: number;
  /** Which extractor produced `extraction` */
  engine: "ollama" | "rules";
  model: string | null;
  extraction: ExtractedCertificate;
  rulesExtraction: ExtractedCertificate;
  agreement: { certificateNumber: boolean; validUntil: boolean };
  assessment: CertificateAssessment;
  timings: { textMs: number; extractMs: number; totalMs: number };
  warnings: string[];
}

export interface IngestionOptions {
  /** ISO date for validity checks (defaults to today, UTC). */
  today?: string;
  /** Set false to force the rules engine (tests, or a user policy that disallows the SLM). */
  allowOllama?: boolean;
}

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

async function pdfToText(bytes: Uint8Array): Promise<string> {
  // Loaded lazily so the module (and its pdf.js build) is only pulled in for PDF uploads.
  const unpdf = (await import("unpdf")) as unknown as {
    getDocumentProxy: (data: Uint8Array) => Promise<unknown>;
    extractText: (doc: unknown, opts: { mergePages: true }) => Promise<{ text: string; totalPages: number }>;
  };
  const doc = await unpdf.getDocumentProxy(bytes);
  const { text } = await unpdf.extractText(doc, { mergePages: true });
  return text;
}

async function extractTextLayer(input: IngestionInput, bytes: Uint8Array, warnings: string[]): Promise<string> {
  if (input.scenario) return CERTIFICATE_DOCUMENT_FIXTURES[input.scenario].text;
  const mime = input.mimeType.toLowerCase();
  const name = input.fileName.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const text = await pdfToText(bytes);
      if (!text.trim()) warnings.push("PDF has no text layer (scanned image). OCR is not configured; verification relies on the fingerprint only.");
      return text;
    } catch (err) {
      warnings.push(`PDF text extraction failed: ${err instanceof Error ? err.message : String(err)}`);
      return "";
    }
  }
  if (mime.startsWith("text/") || mime === "application/json" || /\.(txt|json|csv|md)$/.test(name)) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  if (mime.startsWith("image/")) {
    warnings.push("Image upload: no text layer available and OCR is not configured; verification relies on the fingerprint only.");
    return "";
  }
  warnings.push(`Unsupported file type ${input.mimeType || "(unknown)"}; verification relies on the fingerprint only.`);
  return "";
}

function fillBlanks(primary: ExtractedCertificate, fallback: ExtractedCertificate): ExtractedCertificate {
  const out = { ...primary };
  for (const key of Object.keys(out) as Array<keyof ExtractedCertificate>) {
    if (!out[key] && fallback[key]) out[key] = fallback[key];
  }
  return out;
}

export async function runIngestion(input: IngestionInput, options: IngestionOptions = {}): Promise<IngestionResult> {
  const started = Date.now();
  const warnings: string[] = [];

  const bytes = input.scenario
    ? new TextEncoder().encode(CERTIFICATE_DOCUMENT_FIXTURES[input.scenario].text)
    : input.bytes ?? new Uint8Array();
  if (!input.scenario && bytes.byteLength === 0) warnings.push("Empty file");

  const documentSha256 = await sha256Hex(bytes);

  const textStarted = Date.now();
  const text = await extractTextLayer(input, bytes, warnings);
  const textMs = Date.now() - textStarted;

  const rules = extractCertificateByRules(text);
  let engine: IngestionResult["engine"] = "rules";
  let model: string | null = null;
  let extraction: ExtractedCertificate = rules.extracted;

  const extractStarted = Date.now();
  if (text.trim() && options.allowOllama !== false) {
    const status = await getOllamaStatus();
    if (status.available) {
      try {
        const llm = await extractCertificateWithOllama(text);
        engine = "ollama";
        model = llm.model;
        extraction = fillBlanks(llm.extracted, rules.extracted);
      } catch (err) {
        warnings.push(`Local SLM extraction failed (${err instanceof Error ? err.message : String(err)}); used rules engine.`);
      }
    } else {
      warnings.push(`Local SLM runtime unavailable (${status.error ?? "not running"}); used rules engine.`);
    }
  }
  const extractMs = Date.now() - extractStarted;

  const hasAnyField = Object.values(extraction).some((v) => v);
  const assessment = await assessCertificate({
    documentSha256,
    extracted: hasAnyField ? extraction : null,
    today: options.today ?? todayIso(),
  });

  return {
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: bytes.byteLength,
    documentSha256,
    textChars: text.length,
    engine,
    model,
    extraction,
    rulesExtraction: rules.extracted,
    agreement: {
      certificateNumber: extraction.certificateNumber === rules.extracted.certificateNumber,
      validUntil: extraction.validUntil === rules.extracted.validUntil,
    },
    assessment,
    timings: { textMs, extractMs, totalMs: Date.now() - started },
    warnings,
  };
}
