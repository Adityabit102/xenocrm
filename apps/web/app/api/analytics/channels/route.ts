import { NextResponse } from "next/server";
import { db } from "@/lib/db";






export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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
        stats: true
      }
    });

    
    const channelStats = {
      whatsapp: { totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOpened: 0, totalRead: 0, totalClicked: 0, totalRevenue: 0 },
      sms: { totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOpened: 0, totalRead: 0, totalClicked: 0, totalRevenue: 0 },
      email: { totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOpened: 0, totalRead: 0, totalClicked: 0, totalRevenue: 0 },
      rcs: { totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOpened: 0, totalRead: 0, totalClicked: 0, totalRevenue: 0 }
    };

    
    for (const campaign of campaigns) {
      const channel = campaign.channel.toLowerCase() as keyof typeof channelStats;
      if (channelStats[channel] && campaign.stats) {
        const stats = campaign.stats;
        channelStats[channel].totalSent += stats.totalSent;
        channelStats[channel].totalDelivered += stats.totalDelivered;
        channelStats[channel].totalFailed += stats.totalFailed;
        channelStats[channel].totalOpened += stats.totalOpened;
        channelStats[channel].totalRead += stats.totalRead;
        channelStats[channel].totalClicked += stats.totalClicked;
        channelStats[channel].totalRevenue += stats.attributedRevenueInr;
      }
    }

    
    const result = Object.entries(channelStats).map(([channel, data]) => {
      const deliveryRate = data.totalSent > 0
        ? parseFloat(((data.totalDelivered / data.totalSent) * 100).toFixed(1))
        : 0.0;

      const openRate = data.totalDelivered > 0
        ? parseFloat(((data.totalOpened / data.totalDelivered) * 100).toFixed(1))
        : 0.0;

      const clickRate = data.totalRead > 0
        ? parseFloat(((data.totalClicked / data.totalRead) * 100).toFixed(1))
        : (data.totalOpened > 0 ? parseFloat(((data.totalClicked / data.totalOpened) * 100).toFixed(1)) : 0.0);

      return {
        channel,
        totalSent: data.totalSent,
        deliveryRate,
        openRate,
        clickRate,
        totalRevenue: data.totalRevenue
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/analytics/channels error:", error);
    return NextResponse.json(
      { error: "Failed to compile channel performance statistics" },
      { status: 500 }
    );
  }
}
