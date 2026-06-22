import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const journeys = await db.journey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        steps: { orderBy: { order: "asc" } },
        _count: { select: { enrollments: true } },
      },
    });

    const withCounts = await Promise.all(
      journeys.map(async (j) => {
        const completedCount = await db.journeyEnrollment.count({
          where: { journeyId: j.id, status: "completed" },
        });
        return {
          ...j,
          enrolledCount: j._count.enrollments,
          completedCount,
          stepCount: j.steps.length,
        };
      })
    );

    return NextResponse.json(withCounts);
  } catch (error: any) {
    console.error("GET /api/journeys error:", error);
    return NextResponse.json({ error: "Failed to load journeys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, triggerType, segmentId, eventType, steps } = body;

    if (!name || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "Name and at least one step are required" }, { status: 400 });
    }

    const journey = await db.journey.create({
      data: {
        name,
        description: description || null,
        triggerType: triggerType || "manual",
        segmentId: segmentId || null,
        eventType: eventType || null,
        steps: {
          create: steps.map((s: any, i: number) => ({
            order: i,
            type: s.type === "wait" ? "wait" : "message",
            channel: s.type === "message" ? (s.channel || "whatsapp") : null,
            template: s.type === "message" ? (s.template || "") : null,
            waitHours: s.type === "wait" ? Number(s.waitHours) || 24 : null,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(journey, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/journeys error:", error);
    return NextResponse.json({ error: "Failed to create journey" }, { status: 500 });
  }
}
