import { test } from "node:test";
import assert from "node:assert/strict";

delete process.env.CLOUDINARY_URL;
const { fileStoreOn, storeOriginal } = await import("../src/lib/server/file-store.ts");

test("without CLOUDINARY_URL, originals are not stored and uploads carry on as before", async () => {
  assert.equal(fileStoreOn(), false);
  assert.equal(await storeOriginal("org-x", "0xabc", "policy.pdf", new Uint8Array([1, 2, 3]), false), null);
});
