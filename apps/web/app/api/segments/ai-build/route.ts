import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSegmentFromNL } from "@/lib/ai/segment-builder";
import { getSegmentCount } from "@/lib/segment-engine/executor";


const aiBuildRequestSchema = z.object({
  query: z
    .string()
    .min(5, "Natural language query description must be at least 5 characters long")
    .max(500, "Natural language query description cannot exceed 500 characters")
});







export async function POST(request: Request) {
  try {
    const bodyJson = await request.json();

    
    const result = aiBuildRequestSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { query } = result.data;

    
    const { rules, insight } = await buildSegmentFromNL(query);

    
    const customerCount = await getSegmentCount(rules);

    return NextResponse.json({
      rules,
      insight,
      customerCount
    });
  } catch (error: any) {
    console.error("POST /api/segments/ai-build error:", error);
    return NextResponse.json(
      { error: `AI Segment build execution failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
