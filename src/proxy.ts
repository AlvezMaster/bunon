import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession, type UserRole } from "@/lib/server/session";

/**
 * Sign-in gate. Everything except the public overview (/) and /login needs a valid session cookie.
 * The factory and buyer workspaces are also role-locked; the ledger and report pages are open to both.
 * API routes check the session themselves (see src/lib/server/auth.ts).
 */
const HOME: Record<UserRole, string> = { factory: "/factory", buyer: "/buyer" };
const ROLE_AREAS: Array<[prefix: string, role: UserRole]> = [
  ["/factory", "factory"],
  ["/buyer", "buyer"],
];

function inArea(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifySession(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  for (const [prefix, role] of ROLE_AREAS) {
    if (inArea(pathname, prefix) && session.role !== role) {
      const url = request.nextUrl.clone();
      url.pathname = HOME[session.role];
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/factory/:path*", "/buyer/:path*", "/ledger/:path*", "/passport/:path*", "/reports/:path*"],
};
