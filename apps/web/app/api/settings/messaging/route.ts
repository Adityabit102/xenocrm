import { NextResponse } from "next/server";
import { getMessagingSettings, setMessagingSettings } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getMessagingSettings());
  } catch (error: any) {
    console.error("GET /api/settings/messaging error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const patch: any = {};
    if (typeof body.quietHoursEnabled === "boolean") patch.quietHoursEnabled = body.quietHoursEnabled;
    if (Number.isInteger(body.quietHoursStart)) patch.quietHoursStart = Math.max(0, Math.min(23, body.quietHoursStart));
    if (Number.isInteger(body.quietHoursEnd)) patch.quietHoursEnd = Math.max(0, Math.min(23, body.quietHoursEnd));
    if (Number.isInteger(body.frequencyCap)) patch.frequencyCap = Math.max(1, Math.min(50, body.frequencyCap));
    const next = await setMessagingSettings(patch);
    await logAudit("demo@cove.io", "settings.updated", "messaging controls");
    return NextResponse.json(next);
  } catch (error: any) {
    console.error("PATCH /api/settings/messaging error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
