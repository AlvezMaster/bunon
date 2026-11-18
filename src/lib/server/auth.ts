/**
 * Route-handler helpers for session cookies (server-only).
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isAgentSession, verifySession, type SessionPayload, type UserRole } from "./session.ts";
import { signedOutAt } from "./accounts-repo.ts";

/**
 * The signed-in person, or null. A session that started before its user chose "Sign out everywhere" no longer
 * counts (agent sessions are short-lived and governed by their own revocable tokens instead).
 */
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const session = verifySession(req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null);
  if (!session || isAgentSession(session)) return session;
  return session.iat < (await signedOutAt(session.sub)) ? null : session;
}

export type Guarded = { ok: true; session: SessionPayload } | { ok: false; response: NextResponse };

export async function requireSession(req: NextRequest, roles?: UserRole[]): Promise<Guarded> {
  const session = await getSession(req);
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
