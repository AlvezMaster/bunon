import { test } from "node:test";
import assert from "node:assert/strict";

process.env.BUNON_DATA_SOURCE = "memory";
const { createAgentToken, listAgentTokens, resolveAgentToken, revokeAgentToken, MAX_TOKENS_PER_FACTORY } = await import("../src/lib/server/agent-tokens.ts");
const { KvAbort } = await import("../src/lib/server/kv.ts");
const { isAgentSession } = await import("../src/lib/server/session.ts");

test("a token works for its own factory only, is stored as a hash, and stops working when revoked", async () => {
  const { token, meta } = await createAgentToken("org-a", "Compliance bot", "Tariqul");
  assert.match(token, /^bnn_agent_[A-Za-z0-9_-]{30,}$/);
  assert.equal((await resolveAgentToken(token))?.orgId, "org-a");

  const listed = await listAgentTokens("org-a");
  assert.equal(listed.length, 1);
  assert.ok(!("hash" in listed[0]) && !JSON.stringify(listed).includes(token), "the list never shows the token or its hash");
  assert.deepEqual(await listAgentTokens("org-b"), [], "another factory sees none of them");

  assert.equal(await revokeAgentToken("org-b", meta.id), null, "another factory can't revoke it");
  assert.ok(await resolveAgentToken(token));
  assert.equal((await revokeAgentToken("org-a", meta.id))?.id, meta.id);
  assert.equal(await resolveAgentToken(token), null, "a revoked token stops working");
});

test("wrong or malformed tokens are refused", async () => {
  for (const bad of [null, "", "abc", "bnn_agent_short", "bnn_agent_" + "x".repeat(40), "Bearer bnn_agent_" + "y".repeat(32)]) {
    assert.equal(await resolveAgentToken(bad), null, String(bad));
  }
});

test(`a factory can have at most ${MAX_TOKENS_PER_FACTORY} tokens`, async () => {
  for (let i = 0; i < MAX_TOKENS_PER_FACTORY; i++) await createAgentToken("org-c", `agent ${i}`, "x");
  await assert.rejects(() => createAgentToken("org-c", "one too many", "x"), KvAbort);
});

test("agent sessions are told apart from people", () => {
  assert.equal(isAgentSession({ sub: "agent:1a2b3c4d" }), true);
  assert.equal(isAgentSession({ sub: "u_123" }), false);
});
