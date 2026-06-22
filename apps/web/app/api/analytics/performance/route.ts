import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignCost, campaignRoi } from "@/lib/utils/channel-cost";






export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
    const sortBy = searchParams.get("sortBy") || "date";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};

    
    if (dateFrom) {
      const parsedFrom = new Date(dateFrom);
      if (!isNaN(parsedFrom.getTime())) {
        where.createdAt = { ...where.createdAt, gte: parsedFrom };
      }
    }
    if (dateTo) {
      const parsedTo = new Date(dateTo);
      if (!isNaN(parsedTo.getTime())) {
        where.createdAt = { ...where.createdAt, lte: parsedTo };
      }
    }

    
    const campaigns = await db.campaign.findMany({
      where,
      include: {
        segment: {
          select: {
            name: true
          }
        },
        stats: true
      }
    });

    
    const mappedCampaigns = campaigns.map((camp: any) => {
      const stats = camp.stats || {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalOpened: 0,
        totalRead: 0,
        totalClicked: 0,
        totalOrdersAttributed: 0,
        attributedRevenueInr: 0
      };

      const deliveryRate = stats.totalSent > 0 
        ? parseFloat(((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)) 
        : 0.0;

      const openRate = stats.totalDelivered > 0 
        ? parseFloat(((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1)) 
        : 0.0;

      const clickRate = stats.totalRead > 0 
        ? parseFloat(((stats.totalClicked / stats.totalRead) * 100).toFixed(1)) 
        : (stats.totalOpened > 0 ? parseFloat(((stats.totalClicked / stats.totalOpened) * 100).toFixed(1)) : 0.0);

      const cost = campaignCost(camp.channel, stats.totalSent);
      const roi = campaignRoi(stats.attributedRevenueInr, cost);

      return {
        id: camp.id,
        name: camp.name,
        channel: camp.channel,
        segmentName: camp.segment?.name || "All Users",
        status: camp.status,
        totalSent: stats.totalSent,
        totalDelivered: stats.totalDelivered,
        totalOpened: stats.totalOpened,
        totalClicked: stats.totalClicked,
        deliveryRate,
        openRate,
        clickRate,
        attributedRevenue: stats.attributedRevenueInr,
        cost,
        roi,
        netRevenue: Math.round((stats.attributedRevenueInr - cost) * 100) / 100,
        createdAt: camp.createdAt
      };
    });

    
    if (sortBy === "roi") {
      mappedCampaigns.sort((a, b) => (b.roi ?? -1) - (a.roi ?? -1));
    } else if (sortBy === "revenue") {
      mappedCampaigns.sort((a, b) => b.attributedRevenue - a.attributedRevenue);
    } else if (sortBy === "clickRate") {
      mappedCampaigns.sort((a, b) => b.clickRate - a.clickRate);
    } else if (sortBy === "deliveryRate") {
      mappedCampaigns.sort((a, b) => b.deliveryRate - a.deliveryRate);
    } else if (sortBy === "date") {
      mappedCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      
      mappedCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    
    const slicedCampaigns = mappedCampaigns.slice(0, limit);

    return NextResponse.json(slicedCampaigns);
  } catch (error: any) {
    console.error("GET /api/analytics/performance error:", error);
    return NextResponse.json({ error: "Failed to compile campaign performance statistics" }, { status: 500 });
  }
}
