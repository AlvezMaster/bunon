/**
 * Retrieval for questionnaire answers: split documents into passages, then find the passages that
 * answer a question with two independent searches, merged.
 *
 *   keyword search   idf-weighted word overlap (exact terms, numbers, licence names)
 *   meaning search   cosine similarity of multilingual Qwen embeddings (synonyms, rewording, Bangla)
 *   fusion           reciprocal rank fusion: a passage ranked well by either search rises
 *
 * Pure functions only (no network, no storage), so they are unit-tested in tests/rag.test.ts.
 */
import { tokens } from "./questionnaire.ts";

export interface Passage {
  /** "<docId>#<n>" */
  id: string;
  docId: string;
  title: string;
  text: string;
  /** Embedding as base64 int8 (see quantize); missing when no embedding model was available. */
  vec?: string;
}

export interface RankedPassage {
  id: string;
  docId: string;
  text: string;
  /** Fused score (higher is better). */
  score: number;
  /** Which searches found it. */
  via: Array<"keyword" | "meaning">;
}

// ------------------------------------------------------------------ chunking

/**
 * Splits text into passages of roughly `target` characters along paragraph and sentence lines,
 * so a quoted sentence is never cut in half.
 */
export function chunkText(docId: string, title: string, text: string, target = 700, max = 1100): Passage[] {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  // Paragraphs: blank lines, or single line breaks when the text has no blank lines (common in PDFs).
  const paras = (/\n\s*\n/.test(clean) ? clean.split(/\n\s*\n/) : clean.split(/\n/)).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const pieces: string[] = [];
  for (const p of paras) {
    if (p.length <= max) {
      pieces.push(p);
      continue;
    }
    // A very long paragraph is split between sentences.
    let buf = "";
    for (const s of p.split(/(?<=[.!?।])\s+/)) {
      if (buf && buf.length + s.length + 1 > target) {
        pieces.push(buf);
        buf = s;
      } else buf = buf ? `${buf} ${s}` : s;
    }
    if (buf) pieces.push(buf);
  }
  // Short neighbours are joined so a heading stays with the text under it.
  const merged: string[] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.length + piece.length + 2 <= target) merged[merged.length - 1] = `${last}\n\n${piece}`;
    else merged.push(piece);
  }
  return merged.map((t, i) => ({ id: `${docId}#${i}`, docId, title, text: t }));
}

// ------------------------------------------------------------------ vectors

/** Normalises a vector and stores it as int8 in base64 (4x smaller than JSON floats; cosine barely changes). */
export function quantize(v: number[]): string {
  const len = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  const bytes = new Int8Array(v.length);
  for (let i = 0; i < v.length; i++) bytes[i] = Math.max(-127, Math.min(127, Math.round((v[i] / len) * 127)));
  return Buffer.from(bytes.buffer).toString("base64");
}

export function dequantize(s: string): Int8Array {
  const buf = Buffer.from(s, "base64");
  return new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function cosine(a: Int8Array, b: Int8Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// ------------------------------------------------------------------ searches

/** Keyword search: idf-weighted overlap of question words with passage words, plus a bonus for the title. */
export function keywordRank(question: string, passages: Passage[]): Array<{ id: string; score: number }> {
  const df = new Map<string, number>();
  for (const p of passages) for (const w of new Set(tokens(p.text))) df.set(w, (df.get(w) ?? 0) + 1);
  const idf = (w: string) => Math.log(1 + passages.length / (1 + (df.get(w) ?? 0)));
  const q = new Set(tokens(question));
  return passages
    .map((p) => {
      const words = new Set(tokens(p.text));
      const title = new Set(tokens(p.title));
      let score = 0;
      for (const w of q) {
        if (words.has(w)) score += idf(w);
        if (title.has(w)) score += 0.5 * idf(w);
      }
      return { id: p.id, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Meaning search: cosine similarity between the question's embedding and each passage's. */
export function meaningRank(queryVec: Int8Array, passages: Passage[], minScore = 0.25): Array<{ id: string; score: number }> {
  return passages
    .filter((p) => p.vec)
    .map((p) => ({ id: p.id, score: cosine(queryVec, dequantize(p.vec as string)) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/** Reciprocal rank fusion: score = Σ 1 / (k + rank). Robust to the two searches using different scales. */
export function fuse(rankings: Array<Array<{ id: string }>>, k = 60): Map<string, number> {
  const out = new Map<string, number>();
  for (const list of rankings) list.forEach((r, i) => out.set(r.id, (out.get(r.id) ?? 0) + 1 / (k + i + 1)));
  return out;
}

/** Keyword + meaning search, fused, top `k` passages. Works keyword-only when there are no vectors. */
export function hybridSearch(question: string, passages: Passage[], queryVec: Int8Array | null, k = 4): RankedPassage[] {
  const byKeyword = keywordRank(question, passages).slice(0, 20);
  const byMeaning = queryVec ? meaningRank(queryVec, passages).slice(0, 20) : [];
  const fused = fuse([byKeyword, byMeaning]);
  const kw = new Set(byKeyword.map((r) => r.id));
  const mn = new Set(byMeaning.map((r) => r.id));
  const byId = new Map(passages.map((p) => [p.id, p]));
  return [...fused.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([id, score]) => {
      const p = byId.get(id) as Passage;
      const via: RankedPassage["via"] = [];
      if (kw.has(id)) via.push("keyword");
      if (mn.has(id)) via.push("meaning");
      return { id, docId: p.docId, text: p.text, score, via };
    });
}
