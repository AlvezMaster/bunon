import { test } from "node:test";
import assert from "node:assert/strict";

// Force the memory backend for these tests (no PostgreSQL in CI / on judge laptops).
process.env.BUNON_DATA_SOURCE = "memory";

import { SEED_LEDGER, SEED_SEALED_DN_2026_ROOT } from "../src/lib/seed/ledger-seed.ts";
import { SEED_USERS } from "../src/lib/seed/users-seed.ts";
import { verifyChain } from "../src/lib/ledger.ts";
import { buildProvenanceTree } from "../src/lib/provenance.ts";
import { STYLES_CATALOG } from "../src/lib/styles.ts";
import { verifyPassword } from "../src/lib/server/session.ts";
import { __resetMemoryLedger, appendLedgerBlock, listLedger } from "../src/lib/server/ledger-repo.ts";
import { findUserByEmail, toPublicUser } from "../src/lib/server/users-repo.ts";
import { getDataSourceStatus } from "../src/lib/server/data-source.ts";

test("seed ledger is a valid chain of 5 blocks anchored to the current DN-2026 root", async () => {
  assert.equal(SEED_LEDGER.length, 5);
  assert.deepEqual(SEED_LEDGER.map((b) => b.block), [1416, 1417, 1418, 1419, 1420]);
  const v = await verifyChain(SEED_LEDGER);
  assert.equal(v.ok, true, v.reason ?? "");
  const tree = await buildProvenanceTree(STYLES_CATALOG["DN-2026"]);
  assert.equal(SEED_SEALED_DN_2026_ROOT, tree.root, "catalog changed: run `node scripts/generate-seed.ts`");
  assert.equal(SEED_LEDGER[4].payloadHash, tree.root);
});

test("seed users authenticate with demo123 via scrypt and never expose hashes publicly", async () => {
  assert.equal(SEED_USERS.length, 2);
  for (const u of SEED_USERS) {
    assert.match(u.password_hash, /^scrypt\$/);
    assert.equal((await verifyPassword("demo123", u.password_hash)).ok, true);
    assert.equal((await verifyPassword("wrong", u.password_hash)).ok, false);
    assert.ok(!("password_hash" in toPublicUser(u)));
  }
});

test("memory data source: status reports memory, users resolve, ledger appends chain correctly", async () => {
  const status = await getDataSourceStatus(true);
  assert.equal(status.kind, "memory");
  assert.equal(status.configured, "memory");

  const found = await findUserByEmail("  Factory@Nodiwear.Example ");
  assert.equal(found.user?.id, "usr-factory-01");
  assert.equal((await findUserByEmail("nobody@example.com")).user, null);

  __resetMemoryLedger();
  const before = await listLedger(50);
  assert.equal(before.blocks[0].block, 1420);
  assert.equal(before.verification.ok, true);

  // concurrent appends must serialise into consecutive blocks with a valid chain
  const results = await Promise.all(
    [1, 2, 3].map((i) =>
      appendLedgerBlock({ type: "TEST EVENT", actor: "tester", summary: `event ${i}`, status: "verified", styleCode: "DN-2026", payloadHash: null })
    )
  );
  assert.deepEqual(results.map((r) => r.block.block).sort(), [1421, 1422, 1423]);
  const after = await listLedger(50);
  assert.equal(after.blocks.length, 8);
  assert.equal(after.verification.ok, true);
  assert.equal(after.blocks[0].prevHash, after.blocks[1].hash);
  __resetMemoryLedger();
});
