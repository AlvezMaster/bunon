/**
 * Evidence graph: how a factory's documents, the answers they back and the buyers who received those answers
 * connect. Built from data Bunon already has (an approved answer names its source document; a questionnaire
 * names its buyer; a reused answer names the earlier question it came from).
 *
 *   document ──backs──▶ answer ──sent to──▶ buyer
 *                         │
 *                         └──reused as──▶ answer (for another buyer)
 *
 * The question it answers: "if this document changes or expires, which answers and which buyers are affected?"
 * That is a walk along the edges from the document node. Pure functions only, unit-tested in
 * tests/evidence-graph.test.ts.
 */

export type NodeKind = "document" | "answer" | "buyer";
export type EdgeKind = "backs" | "sent-to" | "reused-as";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** Document: its valid-until date, when it has one. */
  validUntil?: string | null;
  /** Answer: the buyer it was sent to and the document behind it. */
  buyer?: string;
  docId?: string | null;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface EvidenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphInput {
  documents: Array<{ id: string; title: string; validUntil?: string | null }>;
  questionnaires: Array<{ buyer: string; questions: Array<{ id: string; text: string }> }>;
  answers: Record<string, { docId: string | null; docTitle?: string | null; reusedFrom?: string | null }>;
}

export const docNode = (id: string) => `doc:${id}`;
export const answerNode = (questionId: string) => `ans:${questionId}`;
export const buyerNode = (name: string) => `buyer:${name}`;

export function buildEvidenceGraph({ documents, questionnaires, answers }: GraphInput): EvidenceGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const question = new Map(questionnaires.flatMap((q) => q.questions.map((x) => [x.id, { text: x.text, buyer: q.buyer }] as const)));
  for (const d of documents) nodes.set(docNode(d.id), { id: docNode(d.id), kind: "document", label: d.title, validUntil: d.validUntil ?? null });

  for (const [qid, a] of Object.entries(answers)) {
    const q = question.get(qid);
    if (!q) continue;
    const id = answerNode(qid);
    nodes.set(id, { id, kind: "answer", label: q.text, buyer: q.buyer, docId: a.docId });
    if (!nodes.has(buyerNode(q.buyer))) nodes.set(buyerNode(q.buyer), { id: buyerNode(q.buyer), kind: "buyer", label: q.buyer });
    edges.push({ from: id, to: buyerNode(q.buyer), kind: "sent-to" });
    if (a.docId) {
      // An answer can cite a document that was later deleted: keep the link visible rather than dropping it.
      if (!nodes.has(docNode(a.docId))) nodes.set(docNode(a.docId), { id: docNode(a.docId), kind: "document", label: a.docTitle ?? a.docId });
      edges.push({ from: docNode(a.docId), to: id, kind: "backs" });
    }
  }
  for (const [qid, a] of Object.entries(answers)) {
    if (a.reusedFrom && nodes.has(answerNode(a.reusedFrom)) && nodes.has(answerNode(qid))) {
      edges.push({ from: answerNode(a.reusedFrom), to: answerNode(qid), kind: "reused-as" });
    }
  }
  return { nodes: [...nodes.values()], edges };
}

/** Every node reachable from `start` along the edges (breadth-first), not including `start`. */
export function downstream(g: EvidenceGraph, start: string): Set<string> {
  const out = new Map<string, string[]>();
  for (const e of g.edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) for (const next of out.get(queue.shift()!) ?? []) if (!seen.has(next)) (seen.add(next), queue.push(next));
  seen.delete(start);
  return seen;
}

/** Every node that leads to `end` (walking the edges backwards), not including `end`. */
export function upstream(g: EvidenceGraph, end: string): Set<string> {
  return downstream({ nodes: g.nodes, edges: g.edges.map((e) => ({ ...e, from: e.to, to: e.from })) }, end);
}

/** The nodes linked to `id` in either direction: what to highlight when a node is selected. */
export function connected(g: EvidenceGraph, id: string): Set<string> {
  return new Set([id, ...downstream(g, id), ...upstream(g, id)]);
}

export interface DocumentImpact {
  id: string;
  title: string;
  validUntil: string | null;
  /** Days until it expires (negative: already expired); null when it has no date. */
  daysLeft: number | null;
  answers: string[];
  buyers: string[];
}

/**
 * For every document: the answers that rest on it (directly, or reused from one that does) and the buyers who
 * received them. Most relied-on first.
 */
export function documentImpact(g: EvidenceGraph, today = new Date()): DocumentImpact[] {
  const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return g.nodes
    .filter((n) => n.kind === "document")
    .map((n) => {
      const reach = [...downstream(g, n.id)];
      const validUntil = n.validUntil ?? null;
      const until = validUntil ? Date.parse(validUntil) : NaN;
      return {
        id: n.id,
        title: n.label,
        validUntil,
        daysLeft: Number.isFinite(until) ? Math.round((until - day) / 864e5) : null,
        answers: reach.filter((id) => id.startsWith("ans:")),
        buyers: reach.filter((id) => id.startsWith("buyer:")).map((id) => id.slice("buyer:".length)),
      };
    })
    .sort((a, b) => b.answers.length - a.answers.length || b.buyers.length - a.buyers.length || a.title.localeCompare(b.title));
}

/** Answers sent without a source document behind them. */
export function unsourcedAnswers(g: EvidenceGraph): GraphNode[] {
  const backed = new Set(g.edges.filter((e) => e.kind === "backs").map((e) => e.to));
  return g.nodes.filter((n) => n.kind === "answer" && !backed.has(n.id) && !g.edges.some((e) => e.kind === "reused-as" && e.to === n.id));
}
