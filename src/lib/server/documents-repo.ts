/**
 * A factory's documents: the files its answers to buyers come from. Server-only.
 *
 *   docs:<orgId>   list of document details (title, file, fingerprint, passages, dates)
 *   doc:<docId>    the extracted text and its passages, each with an embedding when available
 *
 * The demo factory also has the built-in demo documents (src/lib/fixtures/factory-documents.ts).
 * Embeddings are kept per model; passages without one for the current model are found by keywords.
 */
import { randomBytes } from "node:crypto";
import { kvRead, kvReadMany, kvUpdate } from "./kv.ts";
import { embed, embeddingModel } from "./embeddings.ts";
import { FIXTURE_DOCS_ORG } from "./accounts-repo.ts";
import { FACTORY_DOCUMENTS, type FactoryDocument } from "../fixtures/factory-documents.ts";
import { chunkText, quantize, type Passage } from "../rag.ts";

export interface DocumentMeta {
  id: string;
  orgId: string;
  title: string;
  fileName: string;
  sha256: string;
  bytes: number;
  chars: number;
  passages: number;
  embedModel: string | null;
  validUntil: string | null;
  uploadedAt: string;
  uploadedBy: string;
  /** Built-in demo document (can't be deleted). */
  demo?: boolean;
  /** The text was read from a photo or scan by an AI model, so a person should check it. */
  fromPhoto?: boolean;
}

interface StoredText {
  text: string;
  passages: Passage[];
}

/** Fair-use ceiling per factory: plans with unlimited documents still stop here, so one account cannot slow search for everyone. */
export const MAX_DOCUMENTS = 1000;
const listKey = (orgId: string) => `docs:${orgId}`;
const textKey = (docId: string) => `doc:${docId}`;
const FIXTURE_VEC_KEY = (model: string) => `docvec:fixtures:${model}`;

function demoMetas(): DocumentMeta[] {
  return FACTORY_DOCUMENTS.map((d) => ({
    id: d.id,
    orgId: FIXTURE_DOCS_ORG,
    title: d.title,
    fileName: d.fileName,
    sha256: "",
    bytes: d.text.length,
    chars: d.text.length,
    passages: chunkText(d.id, d.title, d.text).length,
    embedModel: null,
    validUntil: null,
    uploadedAt: "2026-10-01T09:00:00.000Z",
    uploadedBy: "Bunon demo data",
    demo: true,
  }));
}

export async function listDocuments(orgId: string): Promise<DocumentMeta[]> {
  const uploaded = await kvRead<DocumentMeta[]>(listKey(orgId), () => []);
  return [...(orgId === FIXTURE_DOCS_ORG ? demoMetas() : []), ...uploaded];
}

/** Everything retrieval needs for one factory: whole documents (for the quote check) and passages. */
export async function loadCorpus(orgId: string): Promise<{ docs: FactoryDocument[]; passages: Passage[]; model: string | null }> {
  const model = await embeddingModel();
  const metas = await kvRead<DocumentMeta[]>(listKey(orgId), () => []);
  const stored = metas.length ? await kvReadMany(metas.map((m) => textKey(m.id))) : {};
  const docs: FactoryDocument[] = [];
  const passages: Passage[] = [];
  for (const m of metas) {
    const s = stored[textKey(m.id)] as StoredText | undefined;
    if (!s) continue;
    docs.push({ id: m.id, title: m.title, fileName: m.fileName, text: s.text });
    // Embeddings made by another model can't be compared; those passages use keywords only.
    passages.push(...s.passages.map((p) => (m.embedModel === model ? p : { ...p, vec: undefined })));
  }
  if (orgId === FIXTURE_DOCS_ORG) {
    const demo = FACTORY_DOCUMENTS.flatMap((d) => chunkText(d.id, d.title, d.text));
    docs.unshift(...FACTORY_DOCUMENTS);
    passages.unshift(...(model ? await withFixtureVectors(model, demo) : demo));
  }
  return { docs, passages, model };
}

/** The demo documents are embedded once per model and the vectors kept. */
async function withFixtureVectors(model: string, demo: Passage[]): Promise<Passage[]> {
  let vecs = await kvRead<Record<string, string>>(FIXTURE_VEC_KEY(model), () => ({}));
  const missing = demo.filter((p) => !vecs[p.id]);
  if (missing.length) {
    const made = await embed("documents", missing.map((p) => `${p.title}\n${p.text}`));
    if (made && made.model === model) {
      const add = Object.fromEntries(missing.map((p, i) => [p.id, quantize(made.vectors[i])]));
      vecs = await kvUpdate<Record<string, string>>(FIXTURE_VEC_KEY(model), () => ({}), (all) => {
        Object.assign(all, add);
      });
    }
  }
  return demo.map((p) => (vecs[p.id] ? { ...p, vec: vecs[p.id] } : p));
}

export interface NewDocument {
  orgId: string;
  title: string;
  fileName: string;
  text: string;
  sha256: string;
  bytes: number;
  validUntil: string | null;
  uploadedBy: string;
  fromPhoto?: boolean;
}

/** Splits, embeds (when a model is available) and stores a document. */
export async function addDocument(d: NewDocument): Promise<DocumentMeta> {
  const id = `doc-${randomBytes(5).toString("hex")}`;
  const passages = chunkText(id, d.title, d.text);
  const made = await embed("documents", passages.map((p) => `${d.title}\n${p.text}`));
  const withVec = made ? passages.map((p, i) => ({ ...p, vec: quantize(made.vectors[i]) })) : passages;
  const meta: DocumentMeta = {
    id,
    orgId: d.orgId,
    title: d.title,
    fileName: d.fileName,
    sha256: d.sha256,
    bytes: d.bytes,
    chars: d.text.length,
    passages: passages.length,
    embedModel: made?.model ?? null,
    validUntil: d.validUntil,
    uploadedAt: new Date().toISOString(),
    uploadedBy: d.uploadedBy,
    ...(d.fromPhoto ? { fromPhoto: true } : {}),
  };
  await kvUpdate<StoredText>(textKey(id), () => ({ text: "", passages: [] }), () => ({ text: d.text, passages: withVec }));
  await kvUpdate<DocumentMeta[]>(listKey(d.orgId), () => [], (list) => {
    if (!list.some((m) => m.id === id)) list.push(meta);
  });
  return meta;
}

/** Removes an uploaded document. Answers already sent keep their quote; new drafts can't use it. */
export async function deleteDocument(orgId: string, docId: string): Promise<boolean> {
  let found = false;
  await kvUpdate<DocumentMeta[]>(listKey(orgId), () => [], (list) => {
    found = list.some((m) => m.id === docId);
    return list.filter((m) => m.id !== docId);
  });
  if (found) await kvUpdate<StoredText>(textKey(docId), () => ({ text: "", passages: [] }), () => ({ text: "", passages: [] }));
  return found;
}
