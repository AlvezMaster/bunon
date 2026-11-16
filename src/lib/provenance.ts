/**
 * Provenance commitments: each supply-chain tier becomes a Merkle leaf whose hash commits to the
 * certificate facts (facility, standard, certificate number, validity, material). The style's
 * Merkle root therefore changes whenever a certificate is renewed — which is exactly what the
 * ledger records ("Merkle provenance tree re-sealed").
 */
import { canonicalJson, sha256Hex } from "./crypto.ts";
import { buildMerkleTree, merkleProof, verifyMerkleProof, type MerkleProofStep, type MerkleTree } from "./merkle.ts";
import type { StyleData, SupplyChainTier, TierId } from "./styles.ts";

export function tierLeafPreimage(styleCode: string, tier: SupplyChainTier): string {
  return canonicalJson({
    styleCode,
    tierId: tier.id,
    tierNumber: tier.tierNumber,
    facilityName: tier.facilityName,
    standard: tier.certType,
    certNumber: tier.certNumber,
    validThrough: tier.validThrough,
    material: tier.material,
  });
}

export async function computeTierLeafHash(styleCode: string, tier: SupplyChainTier): Promise<string> {
  return sha256Hex(tierLeafPreimage(styleCode, tier));
}

export interface ProvenanceTree {
  styleCode: string;
  root: string;
  tree: MerkleTree;
  /** tierId → leaf hash */
  leafHashes: Record<TierId, string>;
  /** tier ids in leaf order (Tier 4 → Tier 0) */
  leafOrder: TierId[];
  expiredTierIds: TierId[];
}

/** Leaves are ordered upstream → downstream (Tier 4 raw material first, Tier 0 assembly last). */
export function orderedTiers(style: StyleData): SupplyChainTier[] {
  return [...style.tiers].sort((a, b) => b.tierNumber - a.tierNumber);
}

export async function buildProvenanceTree(style: StyleData): Promise<ProvenanceTree> {
  const tiers = orderedTiers(style);
  const leaves = await Promise.all(
    tiers.map(async (tier) => ({
      id: tier.id,
      label: `T${tier.tierNumber} ${tier.facilityName}`,
      hash: await computeTierLeafHash(style.code, tier),
    }))
  );
  const tree = await buildMerkleTree(leaves);
  const leafHashes = Object.fromEntries(leaves.map((l) => [l.id, l.hash])) as Record<TierId, string>;
  return {
    styleCode: style.code,
    root: tree.root,
    tree,
    leafHashes,
    leafOrder: tiers.map((t) => t.id),
    expiredTierIds: tiers.filter((t) => t.status === "expired").map((t) => t.id),
  };
}

export interface TierInclusionProof {
  tierId: TierId;
  leafHash: string;
  proof: MerkleProofStep[];
  root: string;
}

export function tierInclusionProof(prov: ProvenanceTree, tierId: TierId): TierInclusionProof {
  const index = prov.leafOrder.indexOf(tierId);
  if (index < 0) throw new RangeError(`Tier ${tierId} is not part of ${prov.styleCode}`);
  return { tierId, leafHash: prov.leafHashes[tierId], proof: merkleProof(prov.tree, index), root: prov.root };
}

export async function verifyTierInclusion(p: TierInclusionProof): Promise<boolean> {
  return verifyMerkleProof(p.leafHash, p.proof, p.root);
}
