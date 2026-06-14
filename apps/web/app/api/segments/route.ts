import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSegmentCustomerIds } from "@/lib/segment-engine/executor";

const createSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  description: z.string().nullable().optional(),
  filterRules: z.any().refine((val) => {
    return val && typeof val === "object" && Array.isArray(val.conditions);
  }, "Filter rules must contain an array of conditions"),
  naturalLanguageQuery: z.string().nullable().optional(),
  createdByAi: z.boolean().optional().default(false)
});

export async function GET() {
  try {
    const segments = await db.segment.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Recalculate actual customer counts dynamically
    const segmentsWithCounts = await Promise.all(
      segments.map(async (seg) => {
        try {
          const matchedIds = await getSegmentCustomerIds(seg.filterRules);
          const actualCount = matchedIds.length;
          // Update cached count if it differs
          if (actualCount !== seg.customerCount) {
            await db.segment.update({
              where: { id: seg.id },
              data: { customerCount: actualCount }
            });
          }
          return { ...seg, customerCount: actualCount, matchCount: actualCount };
        } catch {
          return { ...seg, matchCount: seg.customerCount };
        }
      })
    );

    return NextResponse.json(segmentsWithCounts);
  } catch (error: any) {
    console.error("GET /api/segments error:", error);
    return NextResponse.json({ error: "Failed to fetch segments list" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const bodyJson = await request.json();
    const result = createSegmentSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }
    const data = result.data;
    const matchedCustomerIds = await getSegmentCustomerIds(data.filterRules);
    const customerCount = matchedCustomerIds.length;
    const createdSegment = await db.$transaction(async (tx) => {
      const segment = await tx.segment.create({
        data: {
          name: data.name,
          description: data.description || null,
          filterRules: data.filterRules,
          naturalLanguageQuery: data.naturalLanguageQuery || null,
          createdByAi: data.createdByAi || false,
          customerCount
        }
      });
      if (matchedCustomerIds.length > 0) {
        await tx.segmentMembership.createMany({
          data: matchedCustomerIds.map((customerId) => ({
            segmentId: segment.id,
            customerId
          }))
        });
      }
      return segment;
    });
    return NextResponse.json(createdSegment, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/segments error:", error);
    return NextResponse.json({ error: "Failed to create segment" }, { status: 500 });
  }
}

export const maxDuration = 60;
