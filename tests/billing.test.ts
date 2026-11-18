import { test } from "node:test";
import assert from "node:assert/strict";

process.env.BUNON_DATA_SOURCE = "memory";
const { canSendAnswers, extendPaidUntil, newSubscription, priceFor, statusOf, GRACE_DAYS } = await import("../src/lib/plans.ts");
const { createPayment, getSubscription, matchesPayment, settlePaid, startSubscription } = await import("../src/lib/server/billing.ts");

const DAY = 864e5;
const T0 = Date.parse("2026-11-18T00:00:00Z");

test("Starter: a free month, then 7 days' grace, then sending answers pauses", () => {
  const s = newSubscription("org-x", "starter", T0);
  assert.equal(statusOf(s, T0), "trialing");
  assert.equal(Date.parse(s.trialEndsAt!) - T0, 30 * DAY);
  assert.ok(canSendAnswers(s, T0 + 29 * DAY).ok);
  assert.equal(statusOf(s, T0 + 31 * DAY), "past_due");
  assert.ok(canSendAnswers(s, T0 + (30 + GRACE_DAYS - 1) * DAY).ok, "grace days still work");
  const after = canSendAnswers(s, T0 + (30 + GRACE_DAYS + 1) * DAY);
  assert.equal(after.ok, false);
  assert.match(after.reason!, /free month has ended/);
});

test("Pro at sign-up waits for payment, with 7 days of full use", () => {
  const s = newSubscription("org-y", "pro", T0);
  assert.equal(statusOf(s, T0), "awaiting_payment");
  assert.ok(canSendAnswers(s, T0 + 6 * DAY).ok);
  assert.equal(canSendAnswers(s, T0 + 8 * DAY).ok, false);
});

test("paying adds months after any time already left", () => {
  const trial = newSubscription("org-z", "starter", T0);
  assert.equal(extendPaidUntil(trial, 1, T0 + DAY), "2027-01-18T00:00:00.000Z", "paid time starts after the free month");
  const lapsed = { ...trial, trialEndsAt: new Date(T0 - 10 * DAY).toISOString() };
  assert.equal(extendPaidUntil(lapsed, 3, T0), "2027-02-18T00:00:00.000Z", "from today when nothing is left");
  const paid = { ...lapsed, paidUntil: "2026-12-01T00:00:00.000Z" };
  assert.equal(extendPaidUntil(paid, 1, T0), "2027-01-01T00:00:00.000Z", "on top of paid time left");
});

test("demo accounts made before billing keep full use", async () => {
  const s = await getSubscription("org-nodiwear");
  assert.equal(s.legacy, true);
  assert.equal(statusOf(s), "active");
  assert.ok(canSendAnswers(s, T0 + 10_000 * DAY).ok);
});

test("prices: Starter ৳3,500 and Pro ৳7,500 a month; Enterprise has no list price", () => {
  assert.equal(priceFor("starter", 3), 10500);
  assert.equal(priceFor("pro", 12), 90000);
  assert.equal(priceFor("enterprise", 1), null);
});

test("a gateway result counts only for the same transaction, amount and currency", async () => {
  await startSubscription("org-pay", "pro", "Test");
  const p = await createPayment("org-pay", "pro", 1);
  assert.equal(p.amountBdt, 7500);
  assert.ok(matchesPayment(p, { tranId: p.tranId, amount: 7500, currency: "BDT" }));
  assert.equal(matchesPayment(p, { tranId: p.tranId, amount: 75, currency: "BDT" }), false, "a smaller amount is refused");
  assert.equal(matchesPayment(p, { tranId: p.tranId, amount: 7500, currency: "USD" }), false, "another currency is refused");
  assert.equal(matchesPayment(p, { tranId: "BNN-OTHER", amount: 7500, currency: "BDT" }), false, "another transaction is refused");
});

test("a payment is settled once, even if SSLCommerz reports it twice", async () => {
  await startSubscription("org-twice", "pro", "Test");
  const p = await createPayment("org-twice", "pro", 1);
  assert.equal(await settlePaid(p.tranId, { method: "BKASH-BKash", bankTranId: "B1", valId: "V1" }), true);
  const once = (await getSubscription("org-twice")).paidUntil;
  assert.equal(await settlePaid(p.tranId, { method: "BKASH-BKash", bankTranId: "B1", valId: "V1" }), false);
  assert.equal((await getSubscription("org-twice")).paidUntil, once, "paid time was not added twice");
  assert.equal(statusOf(await getSubscription("org-twice")), "active");
});
