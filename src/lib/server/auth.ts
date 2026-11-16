/**
 * Route-handler helpers for session cookies (server-only).
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession, type SessionPayload, type UserRole } from "./session.ts";

export function getSession(req: NextRequest): SessionPayload | null {
  return verifySession(req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null);
}

export type Guarded = { ok: true; session: SessionPayload } | { ok: false; response: NextResponse };

export function requireSession(req: NextRequest, roles?: UserRole[]): Guarded {
  const session = getSession(req);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sign in to record events in the ledger.", code: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `This action needs the ${roles.join(" or ")} role.`, code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, session };
}

export function isSecureRequest(req: NextRequest): boolean {
  return req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
}
