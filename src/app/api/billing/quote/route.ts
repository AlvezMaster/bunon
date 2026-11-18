import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/auth";
import { scopeFor } from "@/lib/server/access";
import { saveQuoteRequest } from "@/lib/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

/** POST /api/billing/quote: an Enterprise quote request (open to visitors; a few per hour per network). */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 5) return NextResponse.json({ error: "Too many requests from this network. Try again later." }, { status: 429 });
  recent.set(ip, [...hits, now]);

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const s = (k: string, max: number) => (typeof b?.[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");
  const n = (k: string) => Math.max(0, Math.min(1_000_000, Math.round(Number(b?.[k]) || 0)));
  const q = { company: s("company", 120), contactName: s("contactName", 80), email: s("email", 120), phone: s("phone", 30), factories: n("factories"), workers: n("workers"), needs: s("needs", 1000) };
  const errors: Record<string, string> = {};
  if (q.company.length < 2) errors.company = "Enter the company name.";
  if (q.contactName.length < 2) errors.contactName = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) errors.email = "Enter a valid email.";
  if (q.factories < 1) errors.factories = "How many factories?";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });

  const session = getSession(req);
  const orgId = session?.role === "factory" ? (await scopeFor(session)).orgId : null;
  const saved = await saveQuoteRequest({ ...q, orgId });
  return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
}
