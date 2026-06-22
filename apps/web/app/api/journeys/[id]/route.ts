import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const journey = await db.journey.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!journey) return NextResponse.json({ error: "Journey not found" }, { status: 404 });

    const [active, completed, total] = await Promise.all([
      db.journeyEnrollment.count({ where: { journeyId: id, status: "active" } }),
      db.journeyEnrollment.count({ where: { journeyId: id, status: "completed" } }),
      db.journeyEnrollment.count({ where: { journeyId: id } }),
    ]);
    const segment = journey.segmentId
      ? await db.segment.findUnique({ where: { id: journey.segmentId }, select: { name: true } })
      : null;

    return NextResponse.json({
      ...journey,
      segmentName: segment?.name || null,
      enrollment: { active, completed, total },
    });
  } catch (error: any) {
    console.error("GET /api/journeys/[id] error:", error);
    return NextResponse.json({ error: "Failed to load journey" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: any = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.description === "string") data.description = body.description;
    if (["draft", "active", "paused"].includes(body.status)) data.status = body.status;

    const journey = await db.journey.update({ where: { id }, data });
    return NextResponse.json(journey);
  } catch (error: any) {
    console.error("PATCH /api/journeys/[id] error:", error);
    return NextResponse.json({ error: "Failed to update journey" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.journey.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/journeys/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete journey" }, { status: 500 });
  }
}
