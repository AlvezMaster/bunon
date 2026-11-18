import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/auth";
import { findUserByEmail, toPublicUser } from "@/lib/server/users-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/session — the signed-in user (from the httpOnly cookie), or null. */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ user: null });
  try {
    const { user } = await findUserByEmail(session.email);
    if (user) return NextResponse.json({ user: toPublicUser(user), expiresAt: new Date(session.exp * 1000).toISOString() });
  } catch (error) {
    console.error("[bunon/auth] session lookup error:", error);
  }
  // Fall back to the signed claims so the UI still knows who is signed in.
  return NextResponse.json({
    user: {
      id: session.sub,
      email: session.email,
      fullName: session.name,
      organization: session.org,
      role: session.role,
      clearanceLevel: "",
      clusterId: "",
      avatarInitial: session.name.slice(0, 1),
    },
    expiresAt: new Date(session.exp * 1000).toISOString(),
  });
}
