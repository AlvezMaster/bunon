/**
 * Keeps each uploaded document's original file (PDF, text or photo) so the factory can open it later and anyone
 * can check it against the fingerprint in the tamper-evident record. Server-only.
 *
 * Storage: Cloudinary, as private ("authenticated") files: there is no public link. Opening one gives a signed
 * link that expires after a few minutes, and only the factory's own people can ask for it. Deleting a document
 * deletes its file. Turned on by CLOUDINARY_URL (cloudinary://key:secret@cloud); without it Bunon keeps only the
 * text it read and the fingerprint, as before.
 */
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export interface StoredFile {
  publicId: string;
  resourceType: "image" | "raw";
  format: string;
}

let ready = false;
function client() {
  // The SDK reads CLOUDINARY_URL from the environment.
  if (!ready) {
    cloudinary.config({ secure: true });
    ready = true;
  }
  return cloudinary;
}

export const fileStoreOn = () => !!process.env.CLOUDINARY_URL?.trim();

/** Saves the original privately. Returns null when storage is off or the upload fails (the document still works). */
export async function storeOriginal(orgId: string, sha256: string, fileName: string, bytes: Uint8Array, isPhoto: boolean): Promise<StoredFile | null> {
  if (!fileStoreOn()) return null;
  const resourceType = isPhoto ? "image" : "raw";
  const ext = (fileName.match(/\.([a-z0-9]+)$/i)?.[1] ?? "bin").toLowerCase();
  // Named by fingerprint: the same file is stored once, and its name says what it must hash to.
  const base = `bunon/${orgId.replace(/[^a-z0-9-]/gi, "")}/${sha256.replace(/^0x/, "").slice(0, 24)}`;
  try {
    const res = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = client().uploader.upload_stream(
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
export function originalLink(f: StoredFile, minutes = 5): string {
  return client().utils.private_download_url(f.publicId, f.resourceType === "raw" ? "" : f.format, {
    resource_type: f.resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + minutes * 60,
  });
}

export async function deleteOriginal(f: StoredFile): Promise<void> {
  await client().uploader.destroy(f.publicId, { resource_type: f.resourceType, type: "authenticated", invalidate: true }).catch((error: unknown) => {
    console.warn("[bunon/files] original not deleted:", error instanceof Error ? error.message : error);
  });
}
