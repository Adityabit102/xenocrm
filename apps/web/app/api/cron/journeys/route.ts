import { NextResponse } from "next/server";
import { processJourneyTick } from "@/lib/journeys/engine";
import { checkCronSecret, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduler tick — advance all active journeys. Wire to a cron in prod;
// also callable on demand ("Run now") from the journey UI.
async function tick() {
  try {
    const result = await processJourneyTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("cron/journeys error:", error);
    return NextResponse.json({ ok: false, error: "Journey tick failed" }, { status: 500 });
  }
}

// POST — invoked by the in-app "Run scheduler now" button (session-gated UI).
export async function POST() {
  return tick();
}

// GET — Vercel Cron entry point, guarded by the cron secret.
export async function GET(request: Request) {
  if (!checkCronSecret(request)) return unauthorized();
  return tick();
}
