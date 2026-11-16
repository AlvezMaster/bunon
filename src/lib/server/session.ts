/**
 * Server-only authentication primitives: scrypt password hashing and HMAC-signed,
 * expiring session tokens carried in an httpOnly cookie.
 *
 * No third-party dependency: everything comes from `node:crypto`.
 */
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

export type UserRole = "factory" | "buyer";

export interface SessionPayload {
  /** User id (bunon_users.id) */
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  org: string;
  /** Organisation id (older cookies may not have it; see orgIdForSession). */
  oid?: string;
  /** Issued-at and expiry, unix seconds */
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = "bunon_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const DEV_FALLBACK_SECRET = "bunon-dev-only-insecure-secret-set-BUNON_SESSION_SECRET";
let warnedAboutFallback = false;

export function getSessionSecret(): string {
  const configured = process.env.BUNON_SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) return configured;
  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[bunon/session] BUNON_SESSION_SECRET is not set (or shorter than 16 chars); using an insecure development secret. Set it in .env.local before deploying."
    );
  }
  return DEV_FALLBACK_SECRET;
}

const b64url = {
  encode(input: Buffer | string): string {
    return Buffer.from(input).toString("base64url");
  },
  decode(input: string): Buffer {
    return Buffer.from(input, "base64url");
  },
};

function hmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
  nowMs: number = Date.now(),
  ttlSeconds: number = SESSION_TTL_SECONDS
): string {
  const iat = Math.floor(nowMs / 1000);
  const full: SessionPayload = { ...payload, iat, exp: iat + ttlSeconds };
  const body = b64url.encode(JSON.stringify(full));
  return `${body}.${hmac(body, getSessionSecret())}`;
}

/** Returns the payload when the token is well-formed, correctly signed and unexpired; otherwise null. */
export function verifySession(token: string | null | undefined, nowMs: number = Date.now()): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = hmac(body, getSessionSecret());
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64url.decode(body).toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= nowMs) return null;
    if (payload.role !== "factory" && payload.role !== "buyer") return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Parses a Cookie header and returns the session token, if any. */
export function readSessionCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Set-Cookie attributes for the session cookie. */
export function sessionCookieOptions(secure: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt, RFC 7914) — format: scrypt$N$r$p$<salt b64url>$<hash b64url>
// ---------------------------------------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 32 } as const;

function scryptAsync(password: string, salt: Buffer, N: number, r: number, p: number, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashPassword(password: string, salt: Buffer = randomBytes(16)): Promise<string> {
  const key = await scryptAsync(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keyLength);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export interface PasswordCheck {
  ok: boolean;
  /** True when the stored value was not a scrypt hash (legacy plaintext seed); callers should warn/migrate. */
  legacyPlaintext: boolean;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<PasswordCheck> {
  if (!stored || typeof password !== "string") return { ok: false, legacyPlaintext: false };
  if (!stored.startsWith("scrypt$")) {
    // Legacy plaintext row (pre-migration init_db.sql). Constant-time compare, but flag it.
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    return { ok, legacyPlaintext: true };
  }
  const [, nStr, rStr, pStr, saltB64, hashB64] = stored.split("$");
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !saltB64 || !hashB64) {
    return { ok: false, legacyPlaintext: false };
  }
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64url"), N, r, p, expected.length);
  return { ok: actual.length === expected.length && timingSafeEqual(actual, expected), legacyPlaintext: false };
}
