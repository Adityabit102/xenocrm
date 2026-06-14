import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSegmentCustomerIds } from "@/lib/segment-engine/executor";
import { addDispatchJob } from "@/lib/queue/worker";
import { Channel } from "@/types";

export const dynamic = "force-dynamic";







export async function POST(request: Request) {
  try {
    
    const session = process.env.BYPASS_AUTH === "true"
      ? { user: { name: "Test User", email: "test@example.com" } }
      : await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    
    const body = await request.json();
    const { plan, campaignName } = body;

    if (!campaignName || typeof campaignName !== "string" || campaignName.trim().length === 0) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    if (!plan || typeof plan !== "object") {
      return NextResponse.json({ error: "Agent campaign plan is required" }, { status: 400 });
    }

    
    if (!plan.segmentId && !plan.newSegmentRules) {
      return NextResponse.json(
        { error: "Campaign plan must specify either segmentId or newSegmentRules" },
        { status: 400 }
      );
    }

    
    let segmentId = plan.segmentId;

    if (plan.newSegmentRules) {
      
      const matchedCustomerIds = await getSegmentCustomerIds(plan.newSegmentRules);
      const customerCount = matchedCustomerIds.length;

      
      const createdSegment = await db.$transaction(async (tx) => {
        const segment = await tx.segment.create({
          data: {
            name: plan.newSegmentName || `${campaignName} Segment`,
            description: plan.reasoning[0] || `AI Planned segment for ${campaignName}`,
            filterRules: plan.newSegmentRules as any,
            createdByAi: true,
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

      segmentId = createdSegment.id;
    }

    
    let isImmediate = true;
    let scheduledDate: Date | null = null;

    if (plan.scheduledAt) {
      scheduledDate = new Date(plan.scheduledAt);
      if (!isNaN(scheduledDate.getTime())) {
        if (scheduledDate.getTime() > Date.now()) {
          isImmediate = false;
        }
      } else {
        scheduledDate = null;
      }
    }

    
    const campaign = await db.campaign.create({
      data: {
        name: campaignName,
        segmentId: segmentId!,
        channel: plan.channel.toLowerCase(),
        messageTemplate: plan.messageTemplate,
        scheduledAt: scheduledDate,
        status: isImmediate ? "in_progress" : "scheduled",
        createdByAgent: true,
        agentReasoningTrace: plan.reasoning as any
      }
    });

    
    if (isImmediate) {
      await addDispatchJob(campaign.id);
    }

    
    return NextResponse.json({
      campaignId: campaign.id,
      segmentId: campaign.segmentId,
      status: campaign.status
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/ai/agent/execute error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
