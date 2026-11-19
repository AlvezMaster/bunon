/**
 * Keeps each uploaded document's original file (PDF, text or photo) so the factory can open it later and anyone
 * can check it against the fingerprint in the tamper-evident record. Server-only.
 *
 * Storage: Cloudinary, as private ("authenticated") files: there is no public link. Opening one gives a signed
 * link that expires after a few minutes, and only the factory's own people can ask for it. Deleting a document
 * deletes its file. Turned on by CLOUDINARY_URL (cloudinary://key:secret@cloud); without it Bunon keeps only the
 * text it read and the fingerprint, as before.
 *
 * The SDK checks CLOUDINARY_URL as soon as it loads and throws on a bad value, so it is loaded only on first use,
 * after the value is tidied and checked here: a mistyped value turns storage off instead of breaking the site.
 */
import type { UploadApiResponse } from "cloudinary";

export interface StoredFile {
  publicId: string;
  resourceType: "image" | "raw";
  format: string;
}

/**
 * The CLOUDINARY_URL value, tidied (a pasted "CLOUDINARY_URL=" prefix and quotes are removed), or null when it is
 * not a cloudinary://key:secret@cloud address.
 */
export function cloudinaryUrl(raw = process.env.CLOUDINARY_URL): string | null {
  const v = (raw ?? "").trim().replace(/^CLOUDINARY_URL\s*=\s*/i, "").replace(/^["']+|["']+$/g, "").trim();
  return /^cloudinary:\/\/[^:@\s]+:[^@\s]+@[\w-]+$/.test(v) ? v : null;
}

let warned = false;
export function fileStoreOn(): boolean {
  const ok = cloudinaryUrl() !== null;
  if (!ok && process.env.CLOUDINARY_URL?.trim() && !warned) {
    warned = true;
    console.warn("[bunon/files] CLOUDINARY_URL is set but is not a cloudinary://key:secret@cloud address; original files are not kept.");
  }
  return ok;
}

let sdk: typeof import("cloudinary").v2 | null = null;
async function client() {
  if (sdk) return sdk;
  const url = cloudinaryUrl();
  if (!url) throw new Error("CLOUDINARY_URL is not a cloudinary:// address.");
  process.env.CLOUDINARY_URL = url; // the SDK reads the tidied value when it loads
  const { v2 } = await import("cloudinary");
  v2.config({ secure: true });
  sdk = v2;
  return v2;
}

/** Saves the original privately. Returns null when storage is off or the upload fails (the document still works). */
export async function storeOriginal(orgId: string, sha256: string, fileName: string, bytes: Uint8Array, isPhoto: boolean): Promise<StoredFile | null> {
  if (!fileStoreOn()) return null;
  const resourceType = isPhoto ? "image" : "raw";
  const ext = (fileName.match(/\.([a-z0-9]+)$/i)?.[1] ?? "bin").toLowerCase();
  // Named by fingerprint: the same file is stored once, and its name says what it must hash to.
  const base = `bunon/${orgId.replace(/[^a-z0-9-]/gi, "")}/${sha256.replace(/^0x/, "").slice(0, 24)}`;
  try {
    const cloud = await client();
    const res = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloud.uploader.upload_stream(
        { public_id: resourceType === "raw" ? `${base}.${ext}` : base, resource_type: resourceType, type: "authenticated", overwrite: false },
        (error, result) => (error || !result ? reject(error ?? new Error("No upload result")) : resolve(result))
      );
      stream.end(Buffer.from(bytes));
    });
    return { publicId: res.public_id, resourceType, format: res.format ?? ext };
  } catch (error) {
    console.warn("[bunon/files] original not stored:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** A signed link to the original that stops working after `minutes`. */
export async function originalLink(f: StoredFile, minutes = 5): Promise<string> {
  return (await client()).utils.private_download_url(f.publicId, f.resourceType === "raw" ? "" : f.format, {
    resource_type: f.resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + minutes * 60,
  });
}

export async function deleteOriginal(f: StoredFile): Promise<void> {
  if (!fileStoreOn()) return;
  await (await client()).uploader.destroy(f.publicId, { resource_type: f.resourceType, type: "authenticated", invalidate: true }).catch((error: unknown) => {
    console.warn("[bunon/files] original not deleted:", error instanceof Error ? error.message : error);
  });
}
