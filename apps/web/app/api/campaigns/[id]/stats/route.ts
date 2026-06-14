import { NextResponse } from "next/server";
import { db } from "@/lib/db";






export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    
    const stats = await db.campaignStats.findUnique({
      where: { campaignId: id }
    });

    if (!stats) {
      return NextResponse.json({ error: "Campaign statistics record not found" }, { status: 404 });
    }

    const {
      totalSent,
      totalDelivered,
      totalFailed,
      totalOpened,
      totalRead,
      totalClicked,
      totalOrdersAttributed,
      attributedRevenueInr,
      lastUpdated
    } = stats;

    
    const deliveryRate = totalSent > 0 
      ? ((totalDelivered / totalSent) * 100).toFixed(1) 
      : "0.0";

    const openRate = totalDelivered > 0 
      ? ((totalOpened / totalDelivered) * 100).toFixed(1) 
      : "0.0";

    const clickRate = totalRead > 0 
      ? ((totalClicked / totalRead) * 100).toFixed(1) 
      : "0.0";

    return NextResponse.json({
      totalSent,
      totalDelivered,
      totalFailed,
      totalOpened,
      totalRead,
      totalClicked,
      totalOrdersAttributed,
      attributedRevenueInr,
      deliveryRate,
      openRate,
      clickRate,
      lastUpdated
    });
  } catch (error: any) {
    console.error("GET /api/campaigns/[id]/stats error:", error);
    return NextResponse.json({ error: "Failed to retrieve campaign statistics" }, { status: 500 });
  }
}
