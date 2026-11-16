import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalJson, isCanonicalHash, sha256Hex, shortHash } from "../src/lib/crypto.ts";
import { auditPathNodeIds, buildMerkleTree, merkleProof, verifyMerkleProof } from "../src/lib/merkle.ts";
import { GENESIS_PREV_HASH, appendBlock, formatBlockTime, parseLedgerInput, verifyChain } from "../src/lib/ledger.ts";

test("sha256Hex matches the known digest of 'abc'", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
  assert.ok(isCanonicalHash(await sha256Hex(new Uint8Array([1, 2, 3]))));
});

test("canonicalJson sorts keys recursively and drops undefined", () => {
  assert.equal(canonicalJson({ b: 1, a: { d: undefined, c: [3, { z: 1, y: 2 }] } }), '{"a":{"c":[3,{"y":2,"z":1}]},"b":1}');
  assert.equal(shortHash("0x" + "ab".repeat(32)), "0xabababab…abab");
});

test("Merkle tree over 5 leaves: root is reproducible and proofs verify", async () => {
  const leaves = await Promise.all(
    ["t4", "t3", "t2", "t1", "t0"].map(async (id) => ({ id, label: id, hash: await sha256Hex(`leaf:${id}`) }))
  );
  const tree = await buildMerkleTree(leaves);
  assert.equal(tree.levels.length, 4); // 5 → 3 → 2 → 1
  assert.ok(isCanonicalHash(tree.root));

  const again = await buildMerkleTree(leaves);
  assert.equal(again.root, tree.root);

  for (let i = 0; i < leaves.length; i += 1) {
    const proof = merkleProof(tree, i);
    assert.equal(await verifyMerkleProof(leaves[i].hash, proof, tree.root), true);
    assert.equal(await verifyMerkleProof(await sha256Hex("forged"), proof, tree.root), false);
  }

  const path = auditPathNodeIds(tree, "t3");
  assert.deepEqual(path, ["L0-1", "L1-0", "L2-0", "L3-0"]);

  // Changing any leaf changes the root
  const tampered = [...leaves];
  tampered[1] = { ...tampered[1], hash: await sha256Hex("tampered") };
  assert.notEqual((await buildMerkleTree(tampered)).root, tree.root);
});

test("ledger: blocks chain, verification detects tampering", async () => {
  const t0 = "2026-11-07T12:50:00.000Z";
  const genesis = await appendBlock(null, parseLedgerInput({ type: "buyer query", actor: "A", summary: "s1", status: "verified" }), t0);
  assert.equal(genesis.block, 1416);
  assert.equal(genesis.id, "BLK-1416");
  assert.equal(genesis.prevHash, GENESIS_PREV_HASH);
  assert.equal(genesis.type, "BUYER QUERY");

  const second = await appendBlock(genesis, { type: "x", actor: "B", summary: "s2", status: "flagged", styleCode: "dn-2026" }, "2026-11-07T13:35:00.000Z");
  assert.equal(second.block, 1417);
  assert.equal(second.prevHash, genesis.hash);

  const ok = await verifyChain([second, genesis]);
  assert.deepEqual(ok, { ok: true, checked: 2, brokenAt: null, reason: null });

  const edited = { ...genesis, summary: "rewritten history" };
  const broken = await verifyChain([edited, second]);
  assert.equal(broken.ok, false);
  assert.equal(broken.brokenAt, 1416);

  const relinked = { ...second, prevHash: GENESIS_PREV_HASH };
  const broken2 = await verifyChain([genesis, relinked]);
  assert.equal(broken2.ok, false);
  assert.equal(broken2.brokenAt, 1417);

  assert.equal(formatBlockTime(t0), "12:50 UTC");
});

test("parseLedgerInput rejects bad payloads and normalises good ones", () => {
  assert.throws(() => parseLedgerInput({ hello: "world" }), /type is required/);
  assert.throws(() => parseLedgerInput({ type: "T", actor: "A", summary: "S", status: "sealed" }), /status/);
  assert.throws(() => parseLedgerInput({ type: "T", actor: "A", summary: "S", status: "verified", payloadHash: "nope" }), /payloadHash/);
  const parsed = parseLedgerInput({ type: " dpp minting ", actor: "Engine", summary: "ok", status: "verified", styleCode: "dn-2026", payloadHash: "AB".repeat(32) });
  assert.equal(parsed.type, "DPP MINTING");
  assert.equal(parsed.styleCode, "DN-2026");
  assert.equal(parsed.payloadHash, "0x" + "ab".repeat(32));
});
