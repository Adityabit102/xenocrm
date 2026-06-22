import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Approve or reject a campaign that was submitted for review.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }
    const campaign = await db.campaign.update({
      where: { id },
      data: {
        approvalStatus: action === "approve" ? "approved" : "rejected",
        approvedBy: "demo@cove.io",
        approvedAt: new Date(),
      },
    });
    await logAudit("demo@cove.io", action === "approve" ? "campaign.approved" : "campaign.rejected", campaign.name);
    return NextResponse.json({ id: campaign.id, approvalStatus: campaign.approvalStatus, approvedBy: campaign.approvedBy });
  } catch (error: any) {
    console.error("POST /api/campaigns/[id]/approval error:", error);
    return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
  }
}
