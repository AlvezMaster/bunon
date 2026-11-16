import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXPORT_WINDOW_MS,
  UNLINK_HOLD_MS,
  agreeUnlink,
  cancelUnlink,
  inviteState,
  isReadable,
  requestUnlink,
  settle,
  type Invite,
  type Link,
} from "../src/lib/links.ts";
import { checkSignup } from "../src/lib/signup-rules.ts";
import { canAppendEvent } from "../src/lib/ledger-policy.ts";
import { STYLES_CATALOG, applyRenewals, styleClearance, tierStatusOn } from "../src/lib/styles.ts";

test("browsers may record only their role's own event types", () => {
  assert.ok(canAppendEvent("buyer", "BUYER QUERY"));
  assert.ok(canAppendEvent("factory", "SUPPLIER CHASE"));
  for (const t of ["ANSWER APPROVED", "LINK CREATED", "SHARED DATA DELETED", "CERT INGESTION"]) {
    assert.equal(canAppendEvent("factory", t), false, t);
    assert.equal(canAppendEvent("buyer", t), false, t);
  }
  assert.equal(canAppendEvent("factory", "BUYER QUERY"), false);
});

test("a certificate past its date counts as expired everywhere, even after a renewal", () => {
  assert.equal(tierStatusOn({ status: "verified", validThrough: "2026-01-01" }, "2026-11-16"), "expired");
  assert.equal(tierStatusOn({ status: "verified", validThrough: "2027-01-01" }, "2026-11-16"), "verified");
  const style = STYLES_CATALOG["DN-2026"];
  const tier = style.tiers[0];
  const stale = applyRenewals(style, { [tier.id]: { certNumber: "X", certType: "Y", validThrough: "2020-01-01", documentSha256: "0".repeat(64), ingestedAt: "", engine: "rules" } });
  assert.equal(styleClearance(stale).cleared, false);
});

const T0 = Date.parse("2026-12-01T10:00:00Z");
const link: Link = { id: "lnk-1", factoryOrgId: "f", buyerOrgId: "b", createdAt: "2026-10-01T00:00:00Z", via: "invite", status: "active" };

function must(r: ReturnType<typeof requestUnlink>): Link {
  assert.ok(r.ok, r.ok ? "" : r.error);
  return (r as { ok: true; link: Link }).link;
}

test("either side can start an unlink alone; nothing changes for 12 hours", () => {
  for (const side of ["f", "b"]) {
    const pending = must(requestUnlink(link, side, T0));
    assert.equal(pending.status, "unlink_pending");
    assert.equal(settle(pending, T0 + UNLINK_HOLD_MS - 1).status, "unlink_pending");
    const done = settle(pending, T0 + UNLINK_HOLD_MS);
    assert.equal(done.status, "unlinked");
    assert.equal(Date.parse(done.exportUntil!), T0 + UNLINK_HOLD_MS + EXPORT_WINDOW_MS);
  }
});

test("outsiders cannot unlink", () => {
  assert.equal(requestUnlink(link, "someone-else", T0).ok, false);
});

test("only the side that asked can cancel, and only during the hold", () => {
  const pending = must(requestUnlink(link, "f", T0));
  assert.equal(cancelUnlink(pending, "b", T0 + 1000).ok, false);
  assert.equal(must(cancelUnlink(pending, "f", T0 + 1000)).status, "active");
  assert.equal(cancelUnlink(pending, "f", T0 + UNLINK_HOLD_MS + 1).ok, false);
});

test("if the other side agrees, the unlink happens at once", () => {
  const pending = must(requestUnlink(link, "b", T0));
  assert.equal(agreeUnlink(pending, "b", T0).ok, false);
  const done = must(agreeUnlink(pending, "f", T0 + 60_000));
  assert.equal(done.status, "unlinked");
  assert.equal(done.unlinkedAt, new Date(T0 + 60_000).toISOString());
});

test("shared data stays readable for 30 days after unlinking, then the link is purged", () => {
  const done = must(agreeUnlink(must(requestUnlink(link, "b", T0)), "f", T0));
  assert.ok(isReadable(settle(done, T0 + EXPORT_WINDOW_MS - 1)));
  const purged = settle(done, T0 + EXPORT_WINDOW_MS);
  assert.equal(purged.status, "purged");
  assert.equal(isReadable(purged), false);
});

test("invites work once, can be cancelled, and expire", () => {
  const inv: Invite = { id: "i", factoryOrgId: "f", tokenHash: "x", note: "", createdBy: "", createdAt: "", expiresAt: new Date(T0 + 1000).toISOString() };
  assert.equal(inviteState(inv, T0), "open");
  assert.equal(inviteState(inv, T0 + 1000), "expired");
  assert.equal(inviteState({ ...inv, usedAt: "x" }, T0), "used");
  assert.equal(inviteState({ ...inv, revokedAt: "x" }, T0), "revoked");
});

test("buyers sign up with email and passphrase; factories must declare their details", () => {
  const base = { company: "Fjordline Wear AS", fullName: "Test Person", email: "a@b.example", password: "long enough pass" };
  assert.deepEqual(checkSignup({ role: "buyer", ...base }), {});
  const missing = checkSignup({ role: "factory", ...base });
  for (const k of ["address", "district", "workers", "tradeLicence", "bin", "erc", "difeLicence", "declaration"]) assert.ok(k in missing, k);
  const ok = checkSignup({
    role: "factory",
    ...base,
    address: "Plot 12, Road 4, Ashulia",
    district: "Dhaka",
    workers: "1240",
    tradeLicence: "TRAD/DNCC/012345",
    bin: "000123456-0101",
    erc: "RA-0123456",
    association: "BGMEA",
    membershipNo: "1234",
    difeLicence: "DIFE/DHA/5678",
    declaration: true,
  });
  assert.deepEqual(ok, {});
  assert.ok("bin" in checkSignup({ role: "factory", ...base, bin: "12345" }));
});
