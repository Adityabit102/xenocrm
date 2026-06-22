import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrollCustomers, resolveTriggerCustomerIds } from "@/lib/journeys/engine";
import { getSegmentCustomerIds } from "@/lib/segment-engine/executor";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Activate a journey and enrol its starting audience.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const journey = await db.journey.findUnique({ where: { id } });
    if (!journey) return NextResponse.json({ error: "Journey not found" }, { status: 404 });

    await db.journey.update({ where: { id }, data: { status: "active" } });

    let customerIds: string[] = [];
    if (journey.segmentId) {
      const seg = await db.segment.findUnique({ where: { id: journey.segmentId } });
      if (seg) customerIds = await getSegmentCustomerIds(seg.filterRules);
    } else if (journey.triggerType === "event") {
      customerIds = await resolveTriggerCustomerIds(journey);
    }

    const enrolled = await enrollCustomers(id, customerIds);
    await logAudit("demo@cove.io", "journey.activated", `${journey.name} · ${enrolled} enrolled`);
    return NextResponse.json({ status: "active", enrolled });
  } catch (error: any) {
    console.error("POST /api/journeys/[id]/activate error:", error);
    return NextResponse.json({ error: "Failed to activate journey" }, { status: 500 });
  }
}
