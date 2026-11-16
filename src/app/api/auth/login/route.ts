import { NextResponse, type NextRequest } from "next/server";
import { findUserByEmail, orgIdOfUser, toPublicUser } from "@/lib/server/users-repo";
import { sessionCookieOptions, signSession, verifyPassword, SESSION_TTL_SECONDS } from "@/lib/server/session";
import { isSecureRequest } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory throttle: 8 failed attempts per client per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; first: number }>();

function clientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function isThrottled(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(key: string): void {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  if (isThrottled(key)) {
    return NextResponse.json({ error: "Too many failed sign-in attempts. Try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Email and passphrase are required." }, { status: 400 });
  }

  try {
    const { user, source } = await findUserByEmail(email);
    const check = user ? await verifyPassword(password, user.password_hash) : { ok: false, legacyPlaintext: false };
    if (!user || !check.ok) {
      recordFailure(key);
      return NextResponse.json({ error: "Invalid email or passphrase." }, { status: 401 });
    }
    if (check.legacyPlaintext) {
      console.warn(`[bunon/auth] user ${user.id} has a plaintext password_hash; re-run init_db.sql to migrate to scrypt.`);
    }

    const token = signSession({ sub: user.id, email: user.email, role: user.role, name: user.full_name, org: user.organization, oid: orgIdOfUser(user) });
    const res = NextResponse.json({
      success: true,
      user: toPublicUser(user),
      source,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    });
    const { name, ...options } = sessionCookieOptions(isSecureRequest(req));
    res.cookies.set(name, token, options);
    return res;
  } catch (error) {
    console.error("[bunon/auth] login error:", error);
    return NextResponse.json({ error: "Sign-in service unavailable." }, { status: 503 });
  }
}
