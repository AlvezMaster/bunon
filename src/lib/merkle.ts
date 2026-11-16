/**
 * Real SHA-256 Merkle tree over supply-chain tier leaf hashes.
 *
 * Construction (deterministic):
 *  - level 0 = leaf hashes in tier order (canonical 0x-hex, lowercased)
 *  - each parent = sha256Hex(leftHex + rightHex) where both operands are the canonical
 *    `0x…` strings; an odd trailing node is paired with itself (Bitcoin-style duplication)
 *  - the single node at the top level is the root
 *
 * The tree carries ids for every node (`L{level}-{index}`) so visualisers can render it and
 * highlight audit paths, and `merkleProof` / `verifyMerkleProof` implement standard inclusion proofs.
 */
import { normalizeHash, sha256Hex } from "./crypto.ts";

export interface MerkleLeaf {
  /** Stable id of the thing being committed (e.g. tier id `t3-yarn`). */
  id: string;
  /** Human label for visualisers. */
  label: string;
  /** Canonical SHA-256 hex (0x-prefixed). */
  hash: string;
}

export interface MerkleNode {
  id: string;
  level: number;
  index: number;
  hash: string;
  /** Ids of children (absent on leaves). */
  left?: string;
  right?: string;
  /** For leaves: the leaf id this node commits to. */
  leafId?: string;
}

export interface MerkleTree {
  root: string;
  /** levels[0] = leaves … levels[last] = [root] */
  levels: string[][];
  nodes: MerkleNode[];
  leaves: MerkleLeaf[];
}

export interface MerkleProofStep {
  hash: string;
  /** Where the sibling sits relative to the running hash. */
  position: "left" | "right";
}

export async function hashPair(left: string, right: string): Promise<string> {
  return sha256Hex(`${normalizeHash(left)}${normalizeHash(right)}`);
}

export async function buildMerkleTree(leaves: MerkleLeaf[]): Promise<MerkleTree> {
  if (leaves.length === 0) throw new Error("Cannot build a Merkle tree with zero leaves");

  const levels: string[][] = [leaves.map((l) => normalizeHash(l.hash))];
  const nodes: MerkleNode[] = levels[0].map((hash, index) => ({
    id: `L0-${index}`,
    level: 0,
    index,
    hash,
    leafId: leaves[index].id,
  }));

  let level = 0;
  while (levels[level].length > 1) {
    const current = levels[level];
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const leftIdx = i;
      const rightIdx = i + 1 < current.length ? i + 1 : i; // duplicate odd node
      const parent = await hashPair(current[leftIdx], current[rightIdx]);
      next.push(parent);
      nodes.push({
        id: `L${level + 1}-${next.length - 1}`,
        level: level + 1,
        index: next.length - 1,
        hash: parent,
        left: `L${level}-${leftIdx}`,
        right: `L${level}-${rightIdx}`,
      });
    }
    levels.push(next);
    level += 1;
  }

  return { root: levels[level][0], levels, nodes, leaves };
}

/** Inclusion proof (sibling path) for the leaf at `leafIndex`. */
export function merkleProof(tree: MerkleTree, leafIndex: number): MerkleProofStep[] {
  if (leafIndex < 0 || leafIndex >= tree.levels[0].length) {
    throw new RangeError(`Leaf index ${leafIndex} out of range`);
  }
  const proof: MerkleProofStep[] = [];
  let index = leafIndex;
  for (let level = 0; level < tree.levels.length - 1; level += 1) {
    const current = tree.levels[level];
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1 < current.length ? index + 1 : index;
    proof.push({ hash: current[siblingIndex], position: isRight ? "left" : "right" });
    index = Math.floor(index / 2);
  }
  return proof;
}

/** Recomputes the root from a leaf hash and its proof and compares with `root`. */
export async function verifyMerkleProof(
  leafHash: string,
  proof: MerkleProofStep[],
  root: string
): Promise<boolean> {
  let running = normalizeHash(leafHash);
  for (const step of proof) {
    running =
      step.position === "left" ? await hashPair(step.hash, running) : await hashPair(running, step.hash);
  }
  return running === normalizeHash(root);
}

/** Ids of all nodes on the path from a leaf to the root (for highlighting). */
export function auditPathNodeIds(tree: MerkleTree, leafId: string): string[] {
  const leafNode = tree.nodes.find((n) => n.level === 0 && n.leafId === leafId);
  if (!leafNode) return [];
  const ids = [leafNode.id];
  let current = leafNode;
  for (let level = 1; level < tree.levels.length; level += 1) {
    const parent = tree.nodes.find(
      (n) => n.level === level && (n.left === current.id || n.right === current.id)
    );
    if (!parent) break;
    ids.push(parent.id);
    current = parent;
  }
  return ids;
}
