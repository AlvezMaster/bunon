import { NextResponse, type NextRequest } from "next/server";
import { findUserByEmail, orgIdOfUser, toPublicUser } from "@/lib/server/users-repo";
import { createAccount, orgNameTaken } from "@/lib/server/accounts-repo";
import { KvAbort } from "@/lib/server/kv";
import { sessionCookieOptions, signSession } from "@/lib/server/session";
import { isSecureRequest } from "@/lib/server/auth";
import { checkSignup, normaliseBin, type SignupInput } from "@/lib/signup-rules";
import { startSubscription } from "@/lib/server/billing";
import { isPlanId, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory throttle: 5 new accounts per client per hour.
const recent = new Map<string, number[]>();
function throttled(req: NextRequest): boolean {
  const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  recent.set(key, [...hits, now]);
  return hits.length >= 5;
}

/** POST /api/auth/signup: creates a company and its first user, then signs them in. */
export async function POST(req: NextRequest) {
  let body: SignupInput;
  try {
    body = (await req.json()) as SignupInput;
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const errors = checkSignup(body);
  if (Object.keys(errors).length) return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });
  if (throttled(req)) return NextResponse.json({ error: "Too many new accounts from this network. Try again later." }, { status: 429 });

  const taken = { error: "An account with this email already exists. Sign in instead.", errors: { email: "Already registered." } };
  if ((await findUserByEmail(body.email)).user) return NextResponse.json(taken, { status: 409 });
  if (await orgNameTaken(body.company)) {
    return NextResponse.json(
      { error: "A company with this name is already on Bunon. Ask its owner to invite you.", errors: { company: "Already registered." } },
      { status: 409 }
    );
  }

  try {
    const { user } = await createAccount({
      role: body.role,
      company: body.company,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      country: body.role === "factory" ? "BD" : "",
      profile:
        body.role === "factory"
          ? {
              legalName: body.company.trim(),
              address: String(body.address).trim(),
              district: String(body.district).trim(),
              workers: Number(body.workers),
              tradeLicence: String(body.tradeLicence).trim(),
              bin: normaliseBin(String(body.bin)),
              erc: String(body.erc).trim(),
              association: body.association ?? "none",
              membershipNo: body.association === "none" ? "" : String(body.membershipNo ?? "").trim(),
              difeLicence: String(body.difeLicence).trim(),
            }
          : undefined,
    });
    // A new factory starts on the plan it chose (Starter's free month by default); buyers use Bunon free.
    const chosen = (body as unknown as { plan?: unknown }).plan;
    const plan: PlanId | null = body.role === "factory" ? (isPlanId(chosen) ? chosen : "starter") : null;
    const newOrgId = orgIdOfUser(user);
    if (plan && newOrgId) await startSubscription(newOrgId, plan, user.full_name);
    const token = signSession({ sub: user.id, email: user.email, role: user.role, name: user.full_name, org: user.organization, oid: orgIdOfUser(user) });
    const res = NextResponse.json({ success: true, user: toPublicUser(user), plan }, { status: 201 });
    const { name, ...options } = sessionCookieOptions(isSecureRequest(req));
    res.cookies.set(name, token, options);
    return res;
  } catch (error) {
    if (error instanceof KvAbort) return NextResponse.json(taken, { status: 409 });
    console.error("[bunon/auth] signup error:", error);
    return NextResponse.json({ error: "Sign-up is unavailable right now." }, { status: 503 });
  }
}
