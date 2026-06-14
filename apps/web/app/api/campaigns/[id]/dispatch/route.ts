import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDispatchJob } from "@/lib/queue/worker";






export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    
    const campaign = await db.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    
    if (!campaign.segmentId || !campaign.messageTemplate) {
      return NextResponse.json(
        { error: "Campaign cannot be dispatched: missing target segment or message template configuration" },
        { status: 400 }
      );
    }

    
    if (campaign.status === "in_progress" || campaign.status === "completed") {
      return NextResponse.json(
        { error: "Campaign dispatch has already been triggered or completed" },
        { status: 409 }
      );
    }

    
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return NextResponse.json(
        { error: `Campaign in status '${campaign.status}' cannot be dispatched` },
        { status: 400 }
      );
    }

    
    const updatedCampaign = await db.campaign.update({
      where: { id },
      data: { status: "in_progress" }
    });

    const job = await addDispatchJob(updatedCampaign.id);

    return NextResponse.json({
      jobId: job.id,
      status: "queued",
      message: "Campaign dispatch started successfully"
    });
  } catch (error: any) {
    console.error("POST /api/campaigns/[id]/dispatch error:", error);
    return NextResponse.json({ error: "Failed to queue campaign dispatch job" }, { status: 500 });
  }
}
