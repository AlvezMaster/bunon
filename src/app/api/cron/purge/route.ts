import { NextResponse, type NextRequest } from "next/server";
import { runLinkJobs } from "@/lib/server/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/purge: finishes 12-hour unlink holds and deletes shared data whose 30-day export window
 * has ended. Vercel Cron calls it daily (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 * Access already ends on time without it; this does the actual deletion.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ ok: true, changed: await runLinkJobs() });
}
