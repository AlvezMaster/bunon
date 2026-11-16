/**
 * Isomorphic cryptographic primitives for Bunon.
 *
 * Uses the Web Crypto API, which is available both in browsers and in Node.js 19+
 * (`globalThis.crypto.subtle`), so the same code hashes documents in the
 * DocumentIngestionEngine (client) and seals ledger blocks in route handlers (server).
 *
 * All hashes are returned as lowercase hex strings prefixed with `0x`
 * (66 characters for SHA-256), which is the canonical hash format throughout the app.
 */

const HEX_256 = /^0x[0-9a-f]{64}$/;

/** Returns true when `value` is a canonical 0x-prefixed lowercase SHA-256 hex string. */
export function isCanonicalHash(value: unknown): value is string {
  return typeof value === "string" && HEX_256.test(value);
}

/** Normalises a hex digest to the canonical `0x` + lowercase form (no validation of length). */
export function normalizeHash(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function toBytes(input: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof input === "string") return new TextEncoder().encode(input);
  if (input instanceof Uint8Array) return input;
  return new Uint8Array(input);
}

/** SHA-256 digest of a string (UTF-8), byte array or ArrayBuffer, as canonical `0x` hex. */
export async function sha256Hex(input: string | Uint8Array | ArrayBuffer): Promise<string> {
  const bytes = toBytes(input);
  // Copy into a plain ArrayBuffer so SharedArrayBuffer-backed views are never passed to digest().
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  let hex = "0x";
  for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

/**
 * Deterministic JSON serialisation: object keys are sorted recursively so that the same
 * logical value always produces the same bytes (required for reproducible block hashes).
 * `undefined` values are dropped, like JSON.stringify.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}

/** Short display form of a hash, e.g. `0x7f4b82a1…938b`. */
export function shortHash(hash: string, head = 10, tail = 4): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
