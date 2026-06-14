import { NextResponse } from "next/server";
import { db } from "@/lib/db";






export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const campaignWhere: any = {};
    if (dateFrom) {
      const parsedFrom = new Date(dateFrom);
      if (!isNaN(parsedFrom.getTime())) {
        campaignWhere.createdAt = { ...campaignWhere.createdAt, gte: parsedFrom };
      }
    }
    if (dateTo) {
      const parsedTo = new Date(dateTo);
      if (!isNaN(parsedTo.getTime())) {
        campaignWhere.createdAt = { ...campaignWhere.createdAt, lte: parsedTo };
      }
    }

    
    const segments = await db.segment.findMany({
      include: {
        campaigns: {
          where: campaignWhere,
          include: {
            stats: true
          }
        }
      }
    });

    
    const mappedSegments = segments.map((segment) => {
      let totalRevenue = 0;
      let totalSent = 0;
      let totalDelivered = 0;
      let totalOpened = 0;
      let totalRead = 0;
      let totalClicked = 0;

      for (const campaign of segment.campaigns) {
        if (campaign.stats) {
          totalRevenue += campaign.stats.attributedRevenueInr;
          totalSent += campaign.stats.totalSent;
          totalDelivered += campaign.stats.totalDelivered;
          totalOpened += campaign.stats.totalOpened;
          totalRead += campaign.stats.totalRead;
          totalClicked += campaign.stats.totalClicked;
        }
      }

      
      const avgClickRate = totalRead > 0
        ? parseFloat(((totalClicked / totalRead) * 100).toFixed(1))
        : (totalOpened > 0 ? parseFloat(((totalClicked / totalOpened) * 100).toFixed(1)) : 0.0);

      return {
        segmentName: segment.name,
        customerCount: segment.customerCount,
        totalCampaigns: segment.campaigns.length,
        avgClickRate,
        totalRevenue
      };
    });

    
    mappedSegments.sort((a, b) => b.totalRevenue - a.totalRevenue);

    
    const topSegments = mappedSegments.slice(0, 10);

    return NextResponse.json(topSegments);
  } catch (error: any) {
    console.error("GET /api/analytics/segments error:", error);
    return NextResponse.json(
      { error: "Failed to compile segment performance leaderboard" },
      { status: 500 }
    );
  }
}
