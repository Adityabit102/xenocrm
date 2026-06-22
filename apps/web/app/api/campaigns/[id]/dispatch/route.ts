import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processCampaignDispatch } from "@/lib/queue/jobs/dispatch-campaign";
import { getMessagingSettings, inQuietHours } from "@/lib/settings";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (!campaign.segmentId || !campaign.messageTemplate) {
      return NextResponse.json({ error: "Campaign missing segment or message" }, { status: 400 });
    }
    if (campaign.approvalStatus === "pending") {
      return NextResponse.json({ error: "Campaign is awaiting approval" }, { status: 403 });
    }
    if (campaign.approvalStatus === "rejected") {
      return NextResponse.json({ error: "Campaign was rejected and cannot be sent" }, { status: 403 });
    }
    if (campaign.status === "in_progress" || campaign.status === "completed") {
      return NextResponse.json({ error: "Campaign already dispatched or completed" }, { status: 409 });
    }
    const messaging = await getMessagingSettings();
    if (inQuietHours(messaging)) {
      return NextResponse.json({ error: `Within quiet hours (${messaging.quietHoursStart}:00–${messaging.quietHoursEnd}:00). Sending is paused.` }, { status: 423 });
    }
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return NextResponse.json({ error: `Cannot dispatch campaign in status '${campaign.status}'` }, { status: 400 });
    }

    // Update status to in_progress immediately
    await db.campaign.update({ where: { id }, data: { status: "in_progress" } });

    // Await dispatch directly — Vercel kills background tasks after response
    try {
      await processCampaignDispatch(id);
    } catch (err: any) {
      console.error(`[Dispatch] Dispatch failed for ${id}:`, err.message);
    }

    return NextResponse.json({ status: "dispatched", message: "Campaign dispatch completed" });
  } catch (error: any) {
    console.error("POST /api/campaigns/[id]/dispatch error:", error);
    return NextResponse.json({ error: "Failed to dispatch campaign" }, { status: 500 });
  }
}

export const maxDuration = 60;
