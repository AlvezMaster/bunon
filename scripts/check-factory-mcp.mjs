/**
 * End-to-end check of the factory MCP connector against a running local dev server (in-memory data).
 *   node scripts/check-factory-mcp.mjs            (BASE=http://localhost:3001 by default)
 * Signs in as the demo factory, makes an agent token, calls every tool, and checks the safety rules:
 * no token → refused; another factory's questionnaire → not found; no tool can send an answer; the token can be revoked.
 */
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://localhost:3001";
if (!/localhost|127\.0\.0\.1/.test(BASE)) throw new Error("Run this against a local dev server only (it writes test data).");

const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "factory@nodiwear.example", password: "demo123" }) });
const cookie = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
assert.ok(cookie.includes("bunon_session="), "sign-in failed");
const app = (path, body) => fetch(`${BASE}${path}`, { method: body ? "POST" : "GET", headers: { cookie, "Content-Type": "application/json" }, body: body && JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }));

const made = await app("/api/agent-tokens", { action: "create", name: "Test agent" });
assert.equal(made.status, 201, JSON.stringify(made.json));
const token = made.json.token;
assert.match(token, /^bnn_agent_/);
const listed = await app("/api/agent-tokens");
assert.ok(listed.json.tokens.every((t) => !("hash" in t) && !("token" in t)), "token list must not expose secrets");

let id = 0;
const rpc = (method, params, bearer = token) =>
  fetch(`${BASE}/api/mcp/factory`, { method: "POST", headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) }).then(async (r) => ({ status: r.status, json: await r.json() }));
const tool = async (name, args = {}) => {
  const r = await rpc("tools/call", { name, arguments: args });
  const c = r.json.result?.content?.[0]?.text ?? r.json.error?.message;
  return { isError: r.json.result?.isError ?? true, data: (() => { try { return JSON.parse(c); } catch { return c; } })() };
};

const init = await rpc("initialize", {});
assert.equal(init.json.result.serverInfo.name, "bunon-factory-mcp");
const tools = (await rpc("tools/list", {})).json.result.tools.map((t) => t.name);
console.log("tools:", tools.join(", "));
assert.ok(!tools.some((t) => /send|approve|unlink|invite|upload|delete/.test(t)), "no tool may send, unlink, invite, upload or delete");

assert.equal((await rpc("tools/call", { name: "get_overview" }, null)).status, 401, "no token must be refused");
assert.equal((await rpc("tools/call", { name: "get_overview" }, "bnn_agent_wrongwrongwrongwrongwrong")).status, 401, "a wrong token must be refused");

const overview = await tool("get_overview");
console.log("overview:", JSON.stringify(overview.data.questionnaires), "docs:", overview.data.documents_on_file);
assert.ok(!overview.isError && /Nodiwear/.test(overview.data.factory));

const qs = await tool("list_questionnaires");
const ids = qs.data.questionnaires.map((x) => x.questionnaire_id);
console.log("questionnaires:", ids.join(", "));
assert.ok(ids.includes("nordlys-2026") && !ids.includes("nordlys-2026-kanthaloom"), "only this factory's questionnaires");

const other = await tool("get_questionnaire", { questionnaire_id: "nordlys-2026-kanthaloom" });
assert.ok(other.isError, "another factory's questionnaire must not be readable");

const one = await tool("get_questionnaire", { questionnaire_id: "nordlys-2026" });
assert.ok(!one.isError && one.data.questions.length >= 10);

const found = await tool("search_documents", { query: "Is overtime voluntary?" });
assert.ok(!found.isError && found.data.passages.length > 0);
console.log("search top hit:", found.data.passages[0].document);

const draft = await tool("draft_answer", { question_id: "q05" });
console.log("draft q05:", draft.data.status, "|", draft.data.answer, "|", draft.data.document);
assert.ok(!draft.isError);

if (draft.data.status.startsWith("draft")) {
  const prep = await tool("prepare_answer", { question_id: "q05", answer: draft.data.answer, quote: draft.data.quote, document_id: draft.data.document_id });
  assert.ok(!prep.isError, JSON.stringify(prep.data));
  const after = await tool("get_questionnaire", { questionnaire_id: "nordlys-2026" });
  assert.equal(after.data.questions.find((x) => x.question_id === "q05").state, "prepared, waiting for a person");
  const fake = await tool("prepare_answer", { question_id: "q04", answer: "60 hours", quote: "This sentence is not in any document.", document_id: draft.data.document_id });
  assert.ok(fake.isError, "a made-up quote must be refused");
}

for (const name of ["list_documents", "list_buyers", "get_activity_log", "list_orders"]) {
  const r = await tool(name, name === "get_activity_log" ? { limit: 5 } : {});
  assert.ok(!r.isError, `${name}: ${JSON.stringify(r.data)}`);
  console.log(`${name}: ok`, name === "get_activity_log" ? r.data.entries.map((e) => e.event).join(" / ") : "");
}

const revoke = await app("/api/agent-tokens", { action: "revoke", id: made.json.meta.id });
assert.equal(revoke.status, 200);
assert.equal((await rpc("tools/call", { name: "get_overview" })).status, 401, "a revoked token must stop working");
console.log("\nAll factory MCP checks passed.");
