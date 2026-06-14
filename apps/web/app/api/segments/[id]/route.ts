import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSegmentCustomerIds } from "@/lib/segment-engine/executor";


const updateSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  description: z.string().nullable().optional(),
  filterRules: z.any().refine((val) => {
    return val && typeof val === "object" && Array.isArray(val.conditions);
  }, "Filter rules must contain an array of conditions"),
  naturalLanguageQuery: z.string().nullable().optional(),
  createdByAi: z.boolean().optional()
});





export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const segment = await db.segment.findUnique({
      where: { id }
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json(segment);
  } catch (error: any) {
    console.error("GET /api/segments/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch segment details" }, { status: 500 });
  }
}






export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bodyJson = await request.json();

    
    const result = updateSegmentSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    
    const existingSegment = await db.segment.findUnique({
      where: { id }
    });
    if (!existingSegment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    
    const matchedCustomerIds = await getSegmentCustomerIds(data.filterRules);
    const customerCount = matchedCustomerIds.length;

    
    const updatedSegment = await db.$transaction(async (tx) => {
      const segment = await tx.segment.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          filterRules: data.filterRules,
          naturalLanguageQuery: data.naturalLanguageQuery || null,
          createdByAi: data.createdByAi !== undefined ? data.createdByAi : existingSegment.createdByAi,
          customerCount
        }
      });

      
      await tx.segmentMembership.deleteMany({
        where: { segmentId: id }
      });

      if (matchedCustomerIds.length > 0) {
        
        await tx.segmentMembership.createMany({
          data: matchedCustomerIds.map((customerId) => ({
            segmentId: id,
            customerId
          }))
        });
      }

      return segment;
    });

    return NextResponse.json(updatedSegment);
  } catch (error: any) {
    console.error("PUT /api/segments/[id] error:", error);
    return NextResponse.json({ error: "Failed to update segment" }, { status: 500 });
  }
}






export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    
    const existingSegment = await db.segment.findUnique({
      where: { id }
    });
    if (!existingSegment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    
    await db.segment.delete({
      where: { id }
    });

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error("DELETE /api/segments/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete segment" }, { status: 500 });
  }
}
