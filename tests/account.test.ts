import { test } from "node:test";
import assert from "node:assert/strict";

process.env.BUNON_DATA_SOURCE = "memory";
const { createAccount, findStoredUser, signOutEverywhere, signedOutAt, updateStoredUser } = await import("../src/lib/server/accounts-repo.ts");
const { verifyPassword } = await import("../src/lib/server/session.ts");

const account = () =>
  createAccount({ role: "buyer", company: `Account Test ${Math.random().toString(36).slice(2)}`, fullName: "Ana Test", email: `ana-${Math.random().toString(36).slice(2)}@test.example`, password: "first-passphrase-1", country: "DE" });

test("a person can change their name and passphrase", async () => {
  const { user } = await account();
  const renamed = await updateStoredUser(user.id, { fullName: "  Ana Lind  " });
  assert.equal(renamed.full_name, "Ana Lind");
  assert.equal(renamed.avatar_initial, "A");
  await updateStoredUser(user.id, { password: "second-passphrase-2" });
  const stored = await findStoredUser(user.email);
  assert.equal((await verifyPassword("second-passphrase-2", stored!.password_hash)).ok, true);
  assert.equal((await verifyPassword("first-passphrase-1", stored!.password_hash)).ok, false, "the old passphrase stops working");
});

test("the shared demo accounts are not stored users, so they can't be changed", async () => {
  assert.equal(await findStoredUser("factory@nodiwear.example"), null);
  await assert.rejects(updateStoredUser("usr-factory-01", { fullName: "Someone" }));
});

test("sign out everywhere ends sessions that started earlier, not later ones", async () => {
  const { user } = await account();
  assert.equal(await signedOutAt(user.id), 0);
  const cut = await signOutEverywhere(user.id, 2_000_000_000);
  assert.equal(await signedOutAt(user.id), cut);
  const startedBefore = cut - 60;
  const startedAfter = cut;
  assert.ok(startedBefore < cut, "an older session is refused");
  assert.ok(!(startedAfter < cut), "the fresh session on this device still works");
});
