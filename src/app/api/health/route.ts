import { NextResponse } from "next/server";
import { getDataSourceStatus } from "@/lib/server/data-source";
import { getOllamaStatus } from "@/lib/server/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — which backends are really live (feeds the UI status badges). */
export async function GET() {
  const [dataSource, slm] = await Promise.all([getDataSourceStatus(), getOllamaStatus()]);
  return NextResponse.json(
    {
      status: "ok",
      time: new Date().toISOString(),
      dataSource: { kind: dataSource.kind, configured: dataSource.configured, postgresReachable: dataSource.postgres.reachable },
      slm: { available: slm.available, model: slm.model },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
