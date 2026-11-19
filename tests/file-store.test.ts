import { test } from "node:test";
import assert from "node:assert/strict";

delete process.env.CLOUDINARY_URL;
const { fileStoreOn, storeOriginal } = await import("../src/lib/server/file-store.ts");

test("without CLOUDINARY_URL, originals are not stored and uploads carry on as before", async () => {
  assert.equal(fileStoreOn(), false);
  assert.equal(await storeOriginal("org-x", "0xabc", "policy.pdf", new Uint8Array([1, 2, 3]), false), null);
});

test("a pasted CLOUDINARY_URL= prefix or quotes are tidied; anything else turns storage off instead of failing", async () => {
  const { cloudinaryUrl } = await import("../src/lib/server/file-store.ts");
  assert.equal(cloudinaryUrl("cloudinary://123:abc_DEF-9@my-cloud"), "cloudinary://123:abc_DEF-9@my-cloud");
  assert.equal(cloudinaryUrl("CLOUDINARY_URL=cloudinary://123:abc@mycloud"), "cloudinary://123:abc@mycloud");
  assert.equal(cloudinaryUrl(' "cloudinary://123:abc@mycloud" '), "cloudinary://123:abc@mycloud");
  assert.equal(cloudinaryUrl("abc123secret"), null);
  assert.equal(cloudinaryUrl(""), null);
});

test("loading the storage module never throws, even with a bad CLOUDINARY_URL", async () => {
  process.env.CLOUDINARY_URL = "not-a-url";
  const m = await import("../src/lib/server/file-store.ts");
  assert.equal(m.fileStoreOn(), false);
  delete process.env.CLOUDINARY_URL;
});
